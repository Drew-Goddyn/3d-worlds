import * as THREE from 'three';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BODY_KEYS=['x','y','z','rx','ry','rz','vx','vy','vz','wx','wy','wz','hp','state','sleep','hits','scored'];
const NODE_KEYS=['state','strain','support','drop','rx','rz'];
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
    this.nodes=recipe.nodes.map(n=>({...n,state:0,strain:0,support:1,drop:0,rx:0,rz:0}));
    this.bodies=recipe.bodies.map(b=>({...b,x:b.origin.x,y:b.origin.y,z:b.origin.z,rx:0,ry:0,rz:0,vx:0,vy:0,vz:0,wx:0,wy:0,wz:0,hp:1,state:0,sleep:0,hits:0,scored:0,mass:b.mass??.8}));
    this.contacts=new Set();this.tonnage=0;this.collapsed=false;this.revision=0;this.snapshot=null;this.snapshotRevision=-1;
    this.render();
  }
  bodyMatrix(body,out=new THREE.Matrix4(),snapshot=null) {
    const i=body.id*B,j=body.node*N;
    const get=(key)=>snapshot?snapshot.bodies[i+BODY_KEYS.indexOf(key)]:body[key];
    let x=get('x'),y=get('y'),z=get('z'),rx=get('rx'),ry=get('ry'),rz=get('rz');
    if(get('state')===0&&!body.fixed&&!body.content) {
      const n=this.nodes[body.node],drop=snapshot?snapshot.nodes[j+3]:n.drop;
      const nx=snapshot?snapshot.nodes[j+4]:n.rx,nz=snapshot?snapshot.nodes[j+5]:n.rz;
      // Small pre-failure deflection is shared by connected architecture.
      y-=drop;rx+=nx;rz+=nz;
      x-=nz*(body.origin.y-(.23+n.y));z+=nx*(body.origin.y-(.23+n.y));
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
      b.hp=Math.max(0,b.hp-loss);changed=true;
      if(b.state===0&&b.hp<(b.role==='pier'?.2:b.role==='slab'?.12:.35))this.release(b,direction,Math.min(4,power*.022)*influence);
      else if(b.state>0) {b.state=1;b.sleep=0;b.vx+=direction.x*loss*2;b.vz+=direction.z*loss*2;b.vy+=blast?loss:0;}
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
    this.revision++;
  }
  step(dt) {
    // Direct support propagates vertically. Lateral bridging uses only direct
    // support, so an unsupported island cannot hold itself up in a cycle.
    const direct=new Float64Array(this.nodes.length);
    for(const n of this.nodes) {
      if(n.state===2)continue;
      const own=n.supports.reduce((sum,id)=>sum+(this.bodies[id].state===0?this.bodies[id].hp:0),0)/n.supports.length;
      const below=n.below<0?1:this.nodes[n.below].state===2?0:Math.max(0,1-this.nodes[n.below].drop*3);direct[n.id]=own*own*below;
    }
    for(const n of this.nodes) {
      if(n.state===2)continue;
      const bridge=n.neighbors.reduce((sum,id)=>sum+direct[id],0)*.16;
      n.support=Math.min(1,direct[n.id]+bridge);
      if(n.support<.72) {
        n.state=1;
        const deficit=.72-n.support;
        // A supported neighbour holds a local wound indefinitely when capacity
        // remains adequate. Continued loss increases load and releases the bay.
        if(n.support<.60)n.strain+=dt*(.60-n.support)*3.5;
        n.drop=Math.min(.24,deficit*.22+n.strain*.12);
        n.rx=(n.iz-1)*deficit*.045;n.rz=-(n.ix-1)*deficit*.045;
        this.revision++;
        if(n.strain>.36) {
          n.state=2;
          const direction=new THREE.Vector3((n.ix-1)*.23,-.2,(n.iz-1)*.23);
          for(const id of n.bodies)if(!this.bodies[id].content)this.release(this.bodies[id],direction,.55);
          this.sim.lastImpact.set(this.recipe.building.x+n.x,.23+n.y+2,this.recipe.building.z+n.z);
          this.sim._emit('collapse',this.sim.lastImpact,{buildingId:this.recipe.building.id,floor:n.level,material:'stone'});
          this.sim.crowdReaction=1;
        }
      }
    }
    for(const b of this.bodies)if(b.state===0&&b.restsOn!=null&&this.bodies[b.restsOn].state>0) {
      const support=this.bodies[b.restsOn];
      if(b.content)this.hitContent(b,12,new THREE.Vector3(support.vx*.2,.1,support.vz*.2));
      else this.release(b,new THREE.Vector3(support.vx*.12,-.25,support.vz*.12),.6);
    }
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
    const grid=new Map(),bounds=new THREE.Box3();
    const put=(b,box)=> {
      for(let x=Math.floor(box.min.x/3);x<=Math.floor(box.max.x/3);x++)for(let z=Math.floor(box.min.z/3);z<=Math.floor(box.max.z/3);z++) {
        const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push({b,minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z,top:box.max.y});
      }
    };
    const putBody=b=>{
      if(b.role==='paper'||b.role==='glass')return; // thin loose articles bear no architectural loads
      if(b.content||['vault-rib','gallery','vault-seam'].includes(b.role)){const transform=this.bodyMatrix(b);for(const part of b.parts)put(b,bounds.copy(part.collisionBounds).applyMatrix4(transform));}
      else put(b,this.bounds(b,bounds));
    };
    for(const b of this.bodies)if(b.state===2||b.fixed||(b.state===0&&(b.role==='slab'||b.content)))putBody(b);
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
      if(b.state!==1)continue;active=true;
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
        if(entry.b===b)continue;
        // Use a central contact footprint to avoid giant empty AABB bridges.
        if(b.x<entry.minX+.03||b.x>entry.maxX-.03||b.z<entry.minZ+.03||b.z>entry.maxZ-.03)continue;
        if(entry.top>oldBottom+.15||entry.top<surface)continue;
        surface=entry.top;under=entry.b;
      }
      if(box.min.y<=surface+.012 && b.vy<.5) {
        const speed=Math.max(0,-b.vy);b.y+=surface-box.min.y;
        if(b.role==='paper')b.hits=1;
        b.vy=speed*(b.role==='glass'?.24:b.role==='paper'?.015:.08);
        b.vx*=Math.exp(-dt*12);b.vz*=Math.exp(-dt*12);
        // Slabs stay broad and heavy; columns lose balance and roll onto a
        // side. Ground clearance follows the rotated geometry's full bounds.
        if(topples(b)&&b.role!=='paper'&&Math.abs(b.rx)<1.4) b.wx+=dt*.7;
        else {b.wx*=Math.exp(-dt*9);b.wz*=Math.exp(-dt*9);}
        b.wy*=Math.exp(-dt*8);
        if(speed>2.5) {
          b.hits++;
          p.set(b.x,surface,b.z);
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
          b.state=2;b.vx=b.vy=b.vz=b.wx=b.wy=b.wz=0;
          if(!b.scored){b.scored=1;this.tonnage+=b.mass;this.sim.tonnage+=b.mass;}
          putBody(b);
        }
      } else b.sleep=0;
      b.vx*=Math.exp(-dt*(b.role==='paper'?1.9:.16));b.vz*=Math.exp(-dt*(b.role==='paper'?1.9:.16));
    }
    if(active)this.revision++;
    if(!this.collapsed&&this.nodes.filter(n=>n.state===2).length>=18) {
      this.collapsed=true;this.sim.collapsedCount++;this.sim.cheerUntil=this.sim.time+4;
      const id=this.recipe.building.id;
      if(this.sim.lastCollapseBuilding!==id&&this.sim.time-this.sim.chainTime<7)this.sim.chain++;
      this.sim.lastCollapseBuilding=id;this.sim.chainTime=this.sim.time;
    }
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
      this.snapshot={bodies,nodes,contacts:[...this.contacts],tonnage:this.tonnage,collapsed:this.collapsed};this.snapshotRevision=this.revision;
    }
    return this.snapshot;
  }
  restore(state) {
    for(const b of this.bodies)for(let i=0;i<B;i++)b[BODY_KEYS[i]]=state.bodies[b.id*B+i];
    for(const n of this.nodes)for(let i=0;i<N;i++)n[NODE_KEYS[i]]=state.nodes[n.id*N+i];
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
  get stats(){return {bays:this.nodes.length,failedBays:this.nodes.filter(n=>n.state===2).length,loose:this.bodies.filter(b=>b.state===1).length,settled:this.bodies.filter(b=>b.state===2).length,retained:this.bodies.length};}
}
