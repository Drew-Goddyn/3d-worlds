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
    if(get('state')===0&&!body.fixed) {
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
      if(b.fixed||b.state===2)continue;
      if(floorIndex!=null&&this.nodes[b.node].level!==floorIndex)continue;
      const d=this.bounds(b,bounds).distanceToPoint(point);
      if(d<distance){distance=d;best=b;}
    }
    return distance<3?best:null;
  }
  sphereHit(center,radius) {
    let best=null,distance=radius;const bounds=new THREE.Box3(),point=new THREE.Vector3();
    for(const b of this.bodies) {
      if(b.fixed||b.role==='glass'||b.role==='joinery')continue;
      this.bounds(b,bounds);bounds.clampPoint(center,point);
      const d=point.distanceTo(center);
      if(d<distance){distance=d;best={point:point.clone(),body:b};}
    }
    return best;
  }
  chargePoint(charge) {
    const b=this.bodies[charge.bankBody];return new THREE.Vector3(charge.x,charge.y,charge.z).applyMatrix4(this.bodyMatrix(b));
  }
  damage(point,power,direction,blast=false) {
    const radius=blast?3.9:2.15;const bounds=new THREE.Box3();let changed=false;
    for(const b of this.bodies) {
      if(b.fixed)continue;
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
          for(const id of n.bodies)this.release(this.bodies[id],direction,.55);
          this.sim.lastImpact.set(this.recipe.building.x+n.x,.23+n.y+2,this.recipe.building.z+n.z);
          this.sim._emit('collapse',this.sim.lastImpact,{buildingId:this.recipe.building.id,floor:n.level,material:'stone'});
          this.sim.crowdReaction=1;
        }
      }
    }
    for(const b of this.bodies)if(b.state===0&&b.restsOn!=null&&this.bodies[b.restsOn].state>0) {
      const support=this.bodies[b.restsOn];
      this.release(b,new THREE.Vector3(support.vx*.12,-.25,support.vz*.12),.6);
    }
    // Ground and retained rubble contacts. A spatial grid avoids an all-pairs
    // cost when the entire bank is moving; it is derived, never hidden state.
    const grid=new Map(),bounds=new THREE.Box3();
    const put=(b,box)=> {
      for(let x=Math.floor(box.min.x/3);x<=Math.floor(box.max.x/3);x++)for(let z=Math.floor(box.min.z/3);z<=Math.floor(box.max.z/3);z++) {
        const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push({b,minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z,top:box.max.y});
      }
    };
    for(const b of this.bodies)if(b.state===2||b.fixed||(b.state===0&&b.role==='slab'))put(b,this.bounds(b,bounds));
    let active=false;
    for(const b of this.bodies) {
      if(b.state!==1)continue;active=true;
      const oldBottom=this.bounds(b,bounds).min.y;
      b.vy-=dt*12.5;
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
      b.rx+=b.wx*dt;b.ry+=b.wy*dt;b.rz+=b.wz*dt;
      const box=this.bounds(b,bounds);let surface=.23,under=null;
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
        b.vy=speed*(b.role==='glass'?.12:.08);
        b.vx*=Math.exp(-dt*12);b.vz*=Math.exp(-dt*12);
        // Slabs stay broad and heavy; columns lose balance and roll onto a
        // side. Ground clearance follows the rotated geometry's full bounds.
        if(topples(b)&&Math.abs(b.rx)<1.4) b.wx+=dt*.7;
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
          put(b,this.bounds(b,bounds));
        }
      } else b.sleep=0;
      b.vx*=Math.exp(-dt*.16);b.vz*=Math.exp(-dt*.16);
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
