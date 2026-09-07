import * as THREE from 'three';
import { BankCohesion } from './bank-cohesion.js';
import { BankStructure } from './bank-structure.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BODY_KEYS=['x','y','z','rx','ry','rz','vx','vy','vz','wx','wy','wz','hp','state','sleep','hits','scored','cluster'];
const NODE_KEYS=['state','strain','support','drop','rx','rz','px','pz','wx','wz'];
const B=BODY_KEYS.length,N=NODE_KEYS.length;
const topples=b=>b.size.y>Math.max(b.size.x,b.size.z)*1.6||['joinery','glass','parapet'].includes(b.role);
const dummy=new THREE.Object3D(),matrix=new THREE.Matrix4(),partMatrix=new THREE.Matrix4();
const position=new THREE.Vector3(),scale=new THREE.Vector3(1,1,1),quaternion=new THREE.Quaternion(),euler=new THREE.Euler();
const p=new THREE.Vector3(),v=new THREE.Vector3(),size=new THREE.Vector3();

// Bank-only support graph and finite, retained architectural rigid pieces.
// Forces are an intentionally coarse approximation. Rendering and collision
// share the same transforms; all velocities, strength, strain and impact-pair
// state are captured, rather than reconstructing a collapse from its age.
export class BankPhysics {
  constructor(recipe,simulation) {
    this.recipe=recipe;this.sim=simulation;
    this.nodes=recipe.nodes.map(n=>({...n,state:0,strain:0,support:1,drop:0,rx:0,rz:0,px:this.recipe.building.x+n.x,pz:this.recipe.building.z+n.z,wx:0,wz:0}));
    this.bodies=recipe.bodies.map(b=>({...b,x:b.origin.x,y:b.origin.y,z:b.origin.z,rx:0,ry:0,rz:0,vx:0,vy:0,vz:0,wx:0,wy:0,wz:0,hp:1,state:0,sleep:0,hits:0,scored:0,mass:b.mass??.8}));
    this.contacts=new Set();this.tonnage=0;this.collapsed=false;this.revision=0;this.snapshot=null;this.snapshotRevision=-1;
    this.cohesion=new BankCohesion(this);
    this.structure=new BankStructure(this);
    this.render();
  }
  bodyMatrix(body,out=new THREE.Matrix4(),snapshot=null) {
    const i=body.id*B,j=body.node*N;
    const get=(key)=>snapshot?snapshot.bodies[i+BODY_KEYS.indexOf(key)]:body[key];
    let x=get('x'),y=get('y'),z=get('z'),rx=get('rx'),ry=get('ry'),rz=get('rz');
    if(get('state')===0&&!body.fixed&&!body.content) {
      if(this.structure) {
        const owner=this.structure.owner[body.id],f=this.structure.frames[owner],data=snapshot?.structure?.frames[owner];
        const np=data?new THREE.Vector3().fromArray(data):f.p,nq=data?new THREE.Quaternion().fromArray(data,3):f.q;
        position.set(x,y,z).sub(f.rest).applyQuaternion(nq).add(np);x=position.x;y=position.y;z=position.z;
        quaternion.setFromEuler(euler.set(rx,ry,rz)).premultiply(nq);euler.setFromQuaternion(quaternion);rx=euler.x;ry=euler.y;rz=euler.z;
      }
    }
    quaternion.setFromEuler(euler.set(rx,ry,rz));return out.compose(position.set(x,y,z),quaternion,scale);
  }
  bounds(body,out=new THREE.Box3()) {return out.copy(body.bounds).applyMatrix4(this.bodyMatrix(body,matrix));}
  nearest(point, floorIndex=null) {
    let best=null,distance=Infinity;const bounds=new THREE.Box3();
    for(const b of this.bodies) {
      if(b.fixed||b.content||b.role==='glass')continue;
      if(floorIndex!=null&&this.nodes[b.node].level!==floorIndex)continue;
      const d=this.bounds(b,bounds).distanceToPoint(point);
      if(d<distance){distance=d;best=b;}
    }
    return distance<3?best:null;
  }
  sphereHit(center,radius) {
    let best=null,distance=radius;
    const bounds=new THREE.Box3(),local=new THREE.Vector3(),closest=new THREE.Vector3(),transform=new THREE.Matrix4();
    for(const b of this.bodies) {
      if(b.fixed||b.role==='paper')continue;
      if(this.bounds(b,bounds).distanceToPoint(center)>=distance)continue;
      this.bodyMatrix(b,transform);local.copy(center).applyMatrix4(transform.clone().invert());
      // Test individual solid members, not the empty rectangle enclosed by a
      // window frame or the space between a table's legs.
      for(const part of b.parts) {
        part.collisionBounds.clampPoint(local,closest);closest.applyMatrix4(transform);
        const d=closest.distanceTo(center);
        if(d<distance){distance=d;best={point:closest.clone(),body:b};}
      }
    }
    return best;
  }
  solidContact(a,b) {
    const am=this.bodyMatrix(a),bm=this.bodyMatrix(b),ab=new THREE.Box3(),bb=new THREE.Box3();
    for(const ap of a.parts){ab.copy(ap.collisionBounds).applyMatrix4(am);for(const bp of b.parts){bb.copy(bp.collisionBounds).applyMatrix4(bm);if(ab.intersectsBox(bb))return true;}}
    return false;
  }
  hitContent(b,power,direction) {
    if(!b.content||b.fixed||power<3)return false;
    b.hp=Math.max(0,b.hp-power/(b.role==='counter'||b.role==='cabinet'?150:65));
    const impulse=Math.min(7,power/(18+Math.sqrt(b.mass)*32));
    if(b.state===0){this.release(b,direction,impulse);if(b.role!=='paper'){const torque=impulse/(2+b.mass*3);b.wx+=direction.z*torque;b.wz-=direction.x*torque;}}
    else {b.state=1;b.sleep=0;b.vx+=direction.x*impulse;b.vy+=direction.y*impulse;b.vz+=direction.z*impulse;}
    // Loose articles belong to a physical support. Contact with that support
    // releases only its own contents, from their already-visible positions.
    for(const child of this.bodies)if(child.restsOn===b.id&&child.state===0&&child.content) {
      this.hitContent(child,power*.65,direction);
    }
    this.revision++;return true;
  }
  eventMaterial(b) {
    if(b.role==='glass'||b.role==='vault-glass')return 'glass';
    if(['girder','vault-rib','vault-seam','gallery','joinery'].includes(b.role))return 'steel';
    if(b.role==='paper')return 'paper';
    if(b.content||b.role==='partition')return 'wood';
    return 'stone';
  }
  chargePoint(charge) {
    const b=this.bodies[charge.bankBody];return new THREE.Vector3(charge.x,charge.y,charge.z).applyMatrix4(this.bodyMatrix(b));
  }
  anchorCharge(bodyId,worldPoint) {
    const local=worldPoint.clone().applyMatrix4(this.presentationMatrices[bodyId].clone().invert());
    return {bankBody:bodyId,x:local.x,y:local.y,z:local.z};
  }
  damage(point,power,direction,blast=false) {
    const radius=blast?3.9:2.15;const bounds=new THREE.Box3();let changed=false;
    for(const b of this.bodies) {
      if(b.fixed||b.content)continue;
      const distance=this.bounds(b,bounds).distanceToPoint(point);
      if(distance>=radius)continue;
      const influence=Math.pow(1-distance/radius,1.4),weak=b.role==='glass'?3.8:b.role==='joinery'?1.8:1;
      const loss=power/105*influence*weak;
      const impulseDirection=blast?this.bounds(b,new THREE.Box3()).getCenter(new THREE.Vector3()).sub(point).normalize():direction;
      b.hp=Math.max(0,b.hp-loss);changed=true;
      if(b.state===0&&b.hp<(b.role==='pier'?.2:b.role==='slab'?.12:.35))this.release(b,impulseDirection,Math.min(4,power*.022)*influence);
      else if(b.state>0) {this.cohesion.detach(b);b.state=1;b.sleep=0;b.vx+=impulseDirection.x*loss*2;b.vz+=impulseDirection.z*loss*2;b.vy+=blast?impulseDirection.y*loss:0;}
    }
    if(changed) {
      this.revision++;
      this.sim._emitDust(point,blast?6:3,blast?1.7:.7);
      // Fine dust/chips enrich a wound; the actual architecture is never
      // removed to a wrapping particle pool.
      for(let i=0;i<Math.min(14,Math.ceil(power/10));i++) {
        v.set((this.sim.random()-.5)*3+direction.x,1+this.sim.random()*2,(this.sim.random()-.5)*3+direction.z);
        size.set(.09+this.sim.random()*.12,.08,.13);this.sim._spawnDebris('stone',point,v,size,12);
      }
      this.sim._affectProps(point,1.5,power,direction);
    }
    return changed;
  }
  release(b,direction,power=0) {
    if(b.state!==0||b.fixed)return;
    this.bodyMatrix(b,matrix).decompose(position,quaternion,scale);scale.set(1,1,1);
    b.x=position.x;b.y=position.y;b.z=position.z;euler.setFromQuaternion(quaternion);b.rx=euler.x;b.ry=euler.y;b.rz=euler.z;
    b.state=1;b.sleep=0;b.vx=direction.x*power;b.vz=direction.z*power;b.vy=Math.max(-.3,direction.y*power);
    if(b.role==='paper'){b.vy+=1.2+this.sim.random();b.vx+=(this.sim.random()-.5)*2;b.vz+=(this.sim.random()-.5)*2;}
    const tall=topples(b);
    const sign=(b.origin.x-this.recipe.building.x)*.09;
    b.wx=direction.z*.28+(tall?.8:.15+this.sim.random()*.3);b.wz=-direction.x*.28+sign*.15+(this.sim.random()-.5)*.5;b.wy=(this.sim.random()-.5)*.35;
    const carrier=!b.content&&this.structure?.frames[this.structure.owner[b.id]];
    if(carrier?.active) {
      const r=new THREE.Vector3(b.x,b.y,b.z).sub(carrier.p),inherited=new THREE.Vector3().crossVectors(carrier.w,r).add(carrier.v);
      b.vx+=inherited.x;b.vy+=inherited.y;b.vz+=inherited.z;
      b.wx=carrier.w.x+direction.z*.28;b.wy=carrier.w.y;b.wz=carrier.w.z-direction.x*.28;
    }

    this.sim._emit?.('release',new THREE.Vector3(b.x,b.y,b.z),{material:this.eventMaterial(b),mass:b.mass,power:Math.max(4,power*8)});
    this.revision++;
  }
  step(dt) {
    this.structure.step(dt);
    const orphaned=[];
    for(const b of this.bodies)if(b.state===0&&b.restsOn!=null&&this.bodies[b.restsOn].state>0) {
      const support=this.bodies[b.restsOn];
      if(b.content)this.hitContent(b,12,new THREE.Vector3(support.vx*.2,.1,support.vz*.2));
      else {this.release(b,new THREE.Vector3(support.vx*.12,-.25,support.vz*.12),.6);if(support.cluster>=0&&b.role!=='glass'){b.cluster=support.cluster;b.vx=support.vx;b.vy=support.vy;b.vz=support.vz;}else orphaned.push(b.id);}
    }
    this.cohesion.assemble(orphaned);
    // Roof skin is carried by real adjacent half-ribs. Deriving attachment
    // capacity from captured bodies keeps rewind and alternate futures exact.
    for(const b of this.bodies)if(b.state===0&&b.attachments) {
      const held=b.attachments.filter(id=>this.bodies[id].state===0);
      if(held.length<b.minimumAttachments) {
        const lost=this.bodies[b.attachments.find(id=>this.bodies[id].state>0)];
        this.release(b,new THREE.Vector3(lost.vx*.2,-.4,lost.vz*.2),.8);
      }
    }
    // Ground and retained rubble contacts. A spatial grid avoids an all-pairs
    // cost when the entire bank is moving; it is derived, never hidden state.
    const grid=new Map(),bounds=new THREE.Box3(),priorBounds=new Map(),priorSleep=new Map(),grounded=new Set();
    const put=(b,box)=> {
      const entry={b,minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z,bottom:box.min.y,top:box.max.y};
      for(let x=Math.floor(box.min.x/3);x<=Math.floor(box.max.x/3);x++)for(let z=Math.floor(box.min.z/3);z<=Math.floor(box.max.z/3);z++) {
        const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(entry);
      }
    };
    const putBody=b=>{
      if(b.role==='paper'||b.role==='glass')return; // thin loose articles bear no architectural loads
      if(b.content||['vault-rib','gallery','vault-seam'].includes(b.role)){const transform=this.bodyMatrix(b);for(const part of b.parts)put(b,bounds.copy(part.collisionBounds).applyMatrix4(transform),part);}
      else put(b,this.bounds(b,bounds));
    };
    for(const b of this.bodies){putBody(b);if(b.state===1){priorBounds.set(b.id,this.bounds(b));priorSleep.set(b.id,b.sleep);}}
    this.cohesion.step(dt,grid);

    // Resting support is derived from the actual current solid surfaces. A
    // settled article must wake when any support moves, including a surface it
    // landed on after leaving its original parent. No hidden attachment cache.
    for(const b of this.bodies)if(b.state===2) {
      const bottom=this.bounds(b,bounds).min.y;
      if(bottom<=.25)continue;
      const entries=grid.get(Math.floor(b.x/3)+','+Math.floor(b.z/3))||[];
      const supported=entries.some(e=>e.b!==b&&e.b.state!==1&&b.x>=e.minX&&b.x<=e.maxX&&b.z>=e.minZ&&b.z<=e.maxZ&&Math.abs(e.top-bottom)<.045);
      if(!supported){b.state=1;b.sleep=0;if(b.role==='paper')b.hits=0;}
    }
    const contents=this.bodies.filter(b=>b.content&&b.role!=='paper').map(b=>({b,box:this.bounds(b)}));
    let active=false;
    for(const b of this.bodies) {
      if(b.state!==1||b.cluster>=0||this.cohesion.moved.has(b.id))continue;active=true;
      const oldBottom=this.bounds(b,bounds).min.y;
      b.vy-=dt*(b.role==='paper'?2.4:12.5);
      if(b.role==='paper'&&!b.hits&&oldBottom>.5){b.vx+=Math.sin(this.sim.time*5+b.id)*dt*.7;b.wx=Math.sin(this.sim.time*4+b.id)*1.6;}
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
      b.rx+=b.wx*dt;b.ry+=b.wy*dt;b.rz+=b.wz*dt;
      const box=this.bounds(b,bounds);let surface=.23,under=null;
      // Incoming architectural pieces must actually overlap a furnishing.
      // Regional wall damage does not teleport impulses through the room.
      if(b.role!=='paper'&&b.role!=='glass')for(const target of contents) {
        if(target.b===b||target.b.restsOn===b.id||b.restsOn===target.b.id)continue;
        const key='content:'+b.id+':'+target.b.id;
        const speed=Math.hypot(b.vx,b.vy,b.vz);
        if(speed<1.2||this.contacts.has(key)||!box.intersectsBox(target.box)||!this.solidContact(b,target.b))continue;
        this.contacts.add(key);
        const direction=new THREE.Vector3(b.vx,Math.max(.2,b.vy*.08),b.vz);
        if(direction.length()<.6)direction.set((target.b.x-b.x)*2,.3,(target.b.z-b.z)*2);
        direction.normalize();this.hitContent(target.b,Math.min(160,speed*b.mass*8),direction);
        b.vx*=.82;b.vz*=.82;
      }

      const entries=grid.get(Math.floor(b.x/3)+','+Math.floor(b.z/3))||[];
      for(const entry of entries) {
        if(entry.b===b||entry.b.state===1)continue;
        // Use a central contact footprint to avoid giant empty AABB bridges.
        if(b.x<entry.minX+.03||b.x>entry.maxX-.03||b.z<entry.minZ+.03||b.z>entry.maxZ-.03)continue;
        if(entry.top>oldBottom+.15||entry.top<surface)continue;
        surface=entry.top;under=entry.b;
      }
      if(box.min.y<=surface+.012 && b.vy<.5) {
        const speed=Math.max(0,-b.vy);b.y+=surface-box.min.y;
        if(b.role==='paper')b.hits=1;
        b.vy=speed*(b.role==='glass'?.24:b.role==='paper'?.015:.08);
        this.contactFriction(b,dt);
        if(speed<.5)grounded.add(b.id);
        if(speed>2.5) {
          b.hits++;
          p.set(b.x,surface,b.z);
          this.sim._emit?.('contact',p,{material:this.eventMaterial(b),mass:b.mass,speed,power:Math.min(140,speed*Math.sqrt(b.mass)*8)});
          if(b.hits===1&&b.mass>.8)this.sim._emitDust(p,1,Math.min(.9,b.size.length()*.16));
          const key=b.id+':'+(under?.id??'ground');
          if(!this.contacts.has(key)&&speed>4&&b.mass>.7) {
            this.contacts.add(key);
            if(under?.state===0&&!under.fixed) {
              // Impact fractures the struck floor locally, then the graph
              // reassesses load on the next step. It cannot topple all storeys
              // just because one unrelated corner is falling.
              this.damage(p,Math.min(110,speed*b.mass*2.8),new THREE.Vector3(b.vx*.08,-.4,b.vz*.08),false);
            }
            this.sim._affectProps(p,Math.min(2,b.size.length()*.4),speed*b.mass*8,new THREE.Vector3(b.vx||.2,0,b.vz||.3).normalize());
            this.neighborImpact(b,p,speed);
          }
        }
        if(Math.hypot(b.vx,b.vz)<.14&&speed<.5&&Math.abs(b.wx)+Math.abs(b.wz)<.18)b.sleep+=dt;else b.sleep=0;
        if(b.sleep>.45) {
          this.settle(b);
          putBody(b);
        }
      } else b.sleep=0;
      b.vx*=Math.exp(-dt*(b.role==='paper'?1.9:.16));b.vz*=Math.exp(-dt*(b.role==='paper'?1.9:.16));
    }
    this.cohesion.resolveMovingContacts(priorBounds,priorSleep,grounded,dt);
    if(active)this.revision++;
    if(!this.collapsed&&this.nodes.filter(n=>n.state===2).length>=18) {
      this.collapsed=true;this.sim.collapsedCount++;this.sim.cheerUntil=this.sim.time+4;
      const id=this.recipe.building.id;
      if(this.sim.lastCollapseBuilding!==id&&this.sim.time-this.sim.chainTime<7)this.sim.chain++;
      this.sim.lastCollapseBuilding=id;this.sim.chainTime=this.sim.time;
    }
  }
  contactFriction(b,dt) {
    b.vx*=Math.exp(-dt*12);b.vz*=Math.exp(-dt*12);
    if(topples(b)&&b.role!=='paper'&&Math.abs(b.rx)<1.4)b.wx+=dt*.7;
    else{b.wx*=Math.exp(-dt*9);b.wz*=Math.exp(-dt*9);}
    b.wy*=Math.exp(-dt*8);
  }
  settle(b) {
    b.state=2;b.vx=b.vy=b.vz=b.wx=b.wy=b.wz=0;
    if(!b.scored){b.scored=1;this.tonnage+=b.mass;this.sim.tonnage+=b.mass;}
    this.revision++;
  }
  neighborImpact(body,point,speed) {
    if(body.mass<1||speed<4)return;
    for(const bs of this.sim.buildingStates) {
      if(bs.building===this.recipe.building)continue;
      const b=bs.building;
      if(Math.abs(point.x-b.x)>b.width/2+.5||Math.abs(point.z-b.z)>b.depth/2+.5)continue;
      const f=bs.floors.find(f=>f.state<2&&point.y>=f.y-.5&&point.y<=f.y+f.floor.height);
      const key='neighbor:'+body.id+':'+f?.index;
      if(!f||this.contacts.has(key))continue;
      this.contacts.add(key);this.sim._damageFloor(f,point,Math.min(130,speed*body.mass*3),new THREE.Vector3(body.vx,0,body.vz).normalize(),false);
    }
  }
  capture() {
    if(this.snapshotRevision!==this.revision) {
      const bodies=new Float64Array(this.bodies.length*B),nodes=new Float64Array(this.nodes.length*N);
      for(const b of this.bodies)for(let i=0;i<B;i++)bodies[b.id*B+i]=b[BODY_KEYS[i]];
      for(const n of this.nodes)for(let i=0;i<N;i++)nodes[n.id*N+i]=n[NODE_KEYS[i]];
      this.snapshot={bodies,nodes,cohesion:this.cohesion.capture(),structure:this.structure.capture(),contacts:[...this.contacts],tonnage:this.tonnage,collapsed:this.collapsed};this.snapshotRevision=this.revision;
    }
    return this.snapshot;
  }
  restore(state) {
    for(const b of this.bodies)for(let i=0;i<B;i++)b[BODY_KEYS[i]]=state.bodies[b.id*B+i];
    for(const n of this.nodes)for(let i=0;i<N;i++)n[NODE_KEYS[i]]=state.nodes[n.id*N+i];
    this.cohesion.restore(state.cohesion);
    this.structure.restore(state.structure);
    this.contacts=new Set(state.contacts);this.tonnage=state.tonnage;this.collapsed=state.collapsed;
    this.revision++;this.snapshot=state;this.snapshotRevision=this.revision;
  }
  render(next=null,alpha=0) {
    const matrices=this.bodies.map(b=>this.bodyMatrix(b));
    if(next)for(const b of this.bodies) {
      const from=matrices[b.id],to=this.bodyMatrix(b,new THREE.Matrix4(),next);
      from.decompose(position,quaternion,scale);const tp=new THREE.Vector3(),tq=new THREE.Quaternion();to.decompose(tp,tq,scale);scale.set(1,1,1);
      position.lerp(tp,alpha);quaternion.slerp(tq,alpha);from.compose(position,quaternion,scale);
    }
    this.presentationMatrices=matrices;
    for(const batch of this.recipe.batches) {
      batch.parts.forEach((part,i)=>{
        partMatrix.compose(part.position,part.rotation,part.scale);
        dummy.matrix.multiplyMatrices(matrices[part.body],partMatrix);batch.mesh.setMatrixAt(i,dummy.matrix);
      });
      batch.mesh.instanceMatrix.needsUpdate=true;
      // Raycast bounding spheres must include current rubble, not stale pristine
      // positions. InstancedMesh caches these unless explicitly recomputed.
      batch.mesh.computeBoundingSphere();
    }
  }
  get stats(){return {bays:this.nodes.length,failedBays:this.nodes.filter(n=>n.state===2).length,loose:this.bodies.filter(b=>b.state===1).length,settled:this.bodies.filter(b=>b.state===2).length,retained:this.bodies.length,...this.cohesion.stats};}
}
