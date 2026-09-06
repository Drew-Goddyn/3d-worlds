import * as THREE from 'three';

// Finite compound sections assembled from the bank's actual retained pieces.
// This is a bank-local rigid approximation: supported masonry hinges around
// surviving bearings, then bonded sections fly, strike and split. No animation
// clock controls release or fracture. All persistent solver state is captured.
const KEYS=['x','y','z','rx','ry','rz','vx','vy','vz','wx','wy','wz','state'];
const STRIDE=KEYS.length;
const vector=new THREE.Vector3(),old=new THREE.Vector3(),next=new THREE.Vector3();
const q0=new THREE.Quaternion(),q1=new THREE.Quaternion(),dq=new THREE.Quaternion(),bq=new THREE.Quaternion();
const euler=new THREE.Euler(),box=new THREE.Box3(),otherBox=new THREE.Box3();
export class BankCohesion {
  constructor(bank) {
    this.bank=bank;
    // At most one active section per original structural body. Fracturing can
    // split an island but can never allocate unbounded bodies or history.
    this.sections=[];this.moved=new Set();
    const byKey=new Map();
    for(const b of bank.bodies) {
      b.cluster=-1;
      if(b.fixed||b.content||['glass','joinery','vault-seam'].includes(b.role))continue;
      const key=b.cohesion??`bay:${b.node}`;
      if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(b.id);
    }
    this.neighbors=bank.bodies.map(()=>[]);
    // The recipe's solid members define mortar/metal connections. Empty space
    // enclosed by a window frame never becomes a solid contact rectangle.
    for(const ids of byKey.values())for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++) {
      const a=bank.bodies[ids[i]],b=bank.bodies[ids[j]];
      if(a.node!==b.node)continue;
      let joined=false;
      for(const ap of a.parts) {
        box.copy(ap.collisionBounds).translate(a.origin).expandByScalar(.17);
        for(const bp of b.parts)if(box.intersectsBox(otherBox.copy(bp.collisionBounds).translate(b.origin))){joined=true;break;}
        if(joined)break;
      }
      if(joined){this.neighbors[a.id].push(b.id);this.neighbors[b.id].push(a.id);}
    }
  }
  components(ids) {
    const available=new Set(ids),out=[];
    for(const id of ids) {
      if(!available.delete(id))continue;
      const group=[id];
      for(let i=0;i<group.length;i++)for(const next of this.neighbors[group[i]])if(available.delete(next))group.push(next);
      out.push(group);
    }
    return out;
  }
  assemble(ids) {
    for(const members of this.components(ids)) {
      if(members.length<3)continue;
      const bodies=members.map(id=>this.bank.bodies[id]);
      let mass=0,x=0,y=0,z=0,vx=0,vy=0,vz=0,wx=0,wy=0,wz=0;
      for(const b of bodies){mass+=b.mass;x+=b.x*b.mass;y+=b.y*b.mass;z+=b.z*b.mass;vx+=b.vx*b.mass;vy+=b.vy*b.mass;vz+=b.vz*b.mass;wx+=b.wx*b.mass;wy+=b.wy*b.mass;wz+=b.wz*b.mass;}
      let id=this.sections.findIndex(s=>s.state===0);if(id<0)id=this.sections.length;
      this.sections[id]={x:x/mass,y:y/mass,z:z/mass,rx:0,ry:0,rz:0,vx:vx/mass,vy:vy/mass,vz:vz/mass,wx:wx/mass,wy:wy/mass,wz:wz/mass,state:1};
      for(const b of bodies)b.cluster=id;
    }
  }
  detach(b) {
    const id=b.cluster;if(id<0)return;
    b.cluster=-1;
    const members=this.bank.bodies.filter(p=>p.cluster===id);
    this.sections[id].state=0;
    for(const p of members)p.cluster=-1;
    this.assemble(members.map(p=>p.id));
  }
  releaseBay(node,direction,power) {
    const ids=node.bodies.filter(id=>{const b=this.bank.bodies[id];return b.state===0&&!b.content&&!b.fixed;});
    for(const id of ids){const b=this.bank.bodies[id];this.bank.release(b,direction,power);b.wx=node.wx;b.wz=node.wz;b.wy=0;const dy=b.y-(.23+node.y);b.vx+=-node.wz*dy;b.vz+=node.wx*dy;b.vy-=Math.abs(node.wx*(b.z-node.pz))+Math.abs(node.wz*(b.x-node.px));}
    this.assemble(ids.filter(id=>this.neighbors[id].length));
  }
  // A struck part loses its mortar connections; the surviving components keep
  // their own linear/angular momentum. Breakup depends on the impact position.
  fracture(id,point,speed) {
    const members=this.bank.bodies.filter(b=>b.cluster===id);
    if(!members.length)return;
    this.sections[id].state=0;
    const keep=[];
    for(const b of members) {
      b.cluster=-1;
      const d=this.bank.bounds(b,box).distanceToPoint(point);
      if(d<1.45+Math.min(1,speed*.06)) {
        b.hp=Math.min(b.hp,.28);
        const kick=Math.min(1.8,speed*.13);
        vector.set(b.x-point.x,.3,b.z-point.z).normalize();
        b.vx+=vector.x*kick;b.vz+=vector.z*kick;b.wx+=vector.z*.35;b.wz-=vector.x*.35;
      } else keep.push(b.id);
    }
    this.assemble(keep);
    this.bank.revision++;
  }
  candidates(grid,bounds) {
    const entries=new Set();
    for(let x=Math.floor(bounds.min.x/3);x<=Math.floor(bounds.max.x/3);x++)for(let z=Math.floor(bounds.min.z/3);z<=Math.floor(bounds.max.z/3);z++)for(const entry of grid.get(x+','+z)??[])entries.add(entry);
    return entries;
  }
  resolveMovingContacts(prior,priorSleep,grounded,dt) {
    const bank=this.bank,grid=new Map(),bounds=new Map();
    const moving=bank.bodies.filter(b=>b.state===1&&!['paper','glass'].includes(b.role));
    if(!moving.some(b=>b.cluster>=0))return;
    // This response owns the new section/piece boundary. Individual rubble
    // retains the application's existing ground, resting-rubble and furnishing
    // contact model; it is not run through a second free-piece solver.
    for(const b of moving) {
      const now=bank.bounds(b);bounds.set(b.id,now);const swept=now.clone().union(prior.get(b.id)??now),entry={b};
      for(let x=Math.floor(swept.min.x/3);x<=Math.floor(swept.max.x/3);x++)for(let z=Math.floor(swept.min.z/3);z<=Math.floor(swept.max.z/3);z++){const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(entry);}
    }
    const pairs=new Set();
    const mass=b=>b.cluster<0?b.mass:bank.bodies.reduce((sum,p)=>sum+(p.cluster===b.cluster?p.mass:0),0);
    const move=(b,axis,delta)=>{if(b.cluster<0)b[axis]+=delta;else{this.sections[b.cluster][axis]+=delta;for(const p of bank.bodies)if(p.cluster===b.cluster)p[axis]+=delta;}};
    const impulse=(b,axis,dv)=>{if(b.cluster<0)b['v'+axis]+=dv;else{this.sections[b.cluster]['v'+axis]+=dv;for(const p of bank.bodies)if(p.cluster===b.cluster)p['v'+axis]+=dv;}};
    // Resolve lower supports first, allowing actual grounded contacts to carry
    // a quiet stack without treating two freely falling pieces as grounded.
    moving.sort((a,b)=>bounds.get(a.id).min.y-bounds.get(b.id).min.y||a.id-b.id);
    for(const first of moving) {
      const swept=bank.bounds(first).union(prior.get(first.id)??bounds.get(first.id));
      for(const {b:second} of this.candidates(grid,swept)) {
        if(first===second||first.cluster<0&&second.cluster<0||first.cluster>=0&&first.cluster===second.cluster)continue;
        const key=Math.min(first.id,second.id)+':'+Math.max(first.id,second.id);if(pairs.has(key))continue;pairs.add(key);
        const a=bank.bounds(first),b=bank.bounds(second);
        if(!a.intersectsBox(b)||!bank.solidContact(first,second))continue;
        const pa=prior.get(first.id)??a,pb=prior.get(second.id)??b;
        let incoming,under,axis,depth;
        for(const dim of ['y','x','z']) {
          const tolerance=.025;
          if(pa.min[dim]>=pb.max[dim]-tolerance&&a.min[dim]<b.max[dim]){incoming=first;under=second;axis=dim;depth=b.max[dim]-a.min[dim];break;}
          if(pb.min[dim]>=pa.max[dim]-tolerance&&b.min[dim]<a.max[dim]){incoming=second;under=first;axis=dim;depth=a.max[dim]-b.min[dim];break;}
        }
        if(!incoming)continue;
        const relative=under['v'+axis]-incoming['v'+axis];if(relative<-.01)continue;
        const mi=mass(incoming),mu=mass(under),fixedUnder=axis==='y'&&(grounded.has(under.id)||under.state===2),ia=1/mi,ib=fixedUnder?0:1/mu;
        move(incoming,axis,(depth+.001)*ia/(ia+ib));if(ib)move(under,axis,-(depth+.001)*ib/(ia+ib));
        const j=Math.max(0,relative)*1.04/(ia+ib);impulse(incoming,axis,j*ia);if(ib)impulse(under,axis,-j*ib);
        const impact=bank.bounds(incoming).getCenter(new THREE.Vector3());impact[axis]=bank.bounds(under).max[axis];
        if(relative>2.5) {
          const ci=incoming.cluster;if(ci>=0)this.fracture(ci,impact,relative);
          const cu=under.cluster;if(cu>=0)this.fracture(cu,impact,relative);
        }
        if(fixedUnder&&incoming.cluster<0) {
          bank.contactFriction(incoming,dt);
          if(Math.abs(incoming.vy)<.5)grounded.add(incoming.id);
          if(Math.hypot(incoming.vx,incoming.vz)<.14&&Math.abs(incoming.vy)<.5&&Math.abs(incoming.wx)+Math.abs(incoming.wz)<.18){incoming.sleep=(priorSleep.get(incoming.id)??0)+dt;if(incoming.sleep>.45)bank.settle(incoming);}
        }
        bank.revision++;
      }
    }
  }
  step(dt,solids) {
    const bank=this.bank;this.moved.clear();
    const district=bank.sim.floors.filter(f=>!f.building.bank).map(f=>({f,minX:f.x-f.building.width/2,maxX:f.x+f.building.width/2,minZ:f.z-f.building.depth/2,maxZ:f.z+f.building.depth/2,bottom:f.y,top:f.y+f.floor.height*f.squash}));
    const active=this.sections.map((s,id)=>({s,id})).filter(({s})=>s.state===1);
    for(const {s,id} of active) {
      // Earlier contact in this step may have split/reused this slot.
      if(this.sections[id]!==s||s.state!==1)continue;
      const members=bank.bodies.filter(b=>b.cluster===id);
      if(members.length<3){s.state=0;for(const b of members)b.cluster=-1;continue;}
      const before=members.map(b=>({b,bounds:bank.bounds(b)}));
      old.set(s.x,s.y,s.z);s.vy-=12.5*dt;
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
      q0.setFromEuler(euler.set(s.rx,s.ry,s.rz));
      s.rx+=s.wx*dt;s.ry+=s.wy*dt;s.rz+=s.wz*dt;
      q1.setFromEuler(euler.set(s.rx,s.ry,s.rz));dq.copy(q1).multiply(q0.invert());next.set(s.x,s.y,s.z);
      for(const b of members) {
        this.moved.add(b.id);
        vector.set(b.x,b.y,b.z).sub(old).applyQuaternion(dq).add(next);
        b.x=vector.x;b.y=vector.y;b.z=vector.z;
        bq.setFromEuler(euler.set(b.rx,b.ry,b.rz)).premultiply(dq);euler.setFromQuaternion(bq);b.rx=euler.x;b.ry=euler.y;b.rz=euler.z;
        const dx=b.x-s.x,dy=b.y-s.y,dz=b.z-s.z;
        b.vx=s.vx+s.wy*dz-s.wz*dy;b.vy=s.vy+s.wz*dx-s.wx*dz;b.vz=s.vz+s.wx*dy-s.wy*dx;
        b.wx=s.wx;b.wy=s.wy;b.wz=s.wz;
      }
      let hit=null,penetration=0;
      for(const {b,bounds:prior} of before) {
        const now=bank.bounds(b,box);
        if(now.min.y<.23&&.23-now.min.y>penetration){penetration=.23-now.min.y;hit={b,point:new THREE.Vector3(b.x,.23,b.z),under:null};}
        for(const entry of this.candidates(solids,now.clone().union(prior))) {
          const other=entry.b;
          if(other===b||other.cluster===id||other.state===1)continue;
          if(now.max.y>entry.bottom+.04&&now.min.y<entry.top-.04) {
            const walls=[['x','max','min',entry.minX,1],['x','min','max',entry.maxX,-1],['z','max','min',entry.minZ,1],['z','min','max',entry.maxZ,-1]];
            for(const [axis,edge,opposite,at,sign] of walls) {
              const across=axis==='x'?now.max.z>entry.minZ+.03&&now.min.z<entry.maxZ-.03:now.max.x>entry.minX+.03&&now.min.x<entry.maxX-.03;
              if(across&&(prior[edge][axis]-at)*sign<=.015&&(now[edge][axis]-at)*sign>.015&&bank.solidContact(b,other)) {
                const depth=(now[edge][axis]-at)*sign;
                if(!hit){penetration=depth;hit={b,under:other,point:now.getCenter(new THREE.Vector3()),axis,sign};hit.point[axis]=at;}
              }
            }
          }
          if(other.state===1)continue;
          if(entry.top>prior.min.y+.08||entry.top<now.min.y||entry.top<.25)continue;
          if(b.x<entry.minX||b.x>entry.maxX||b.z<entry.minZ||b.z>entry.maxZ)continue;
          if(entry.top-now.min.y>penetration){penetration=entry.top-now.min.y;hit={b,point:new THREE.Vector3(b.x,entry.top,b.z),under:other};}
        }
      }
      // The neighboring district keeps its original coarse storey solver.
      // Its current envelopes stop an incoming bank section and receive the
      // same contact impulse; no second solver owns the neighboring storey.
      for(const {b,bounds:prior} of before) {
        if(hit)break;
        const now=bank.bounds(b,box);
        for(const f of district) {
          if(now.max.y<f.bottom||now.min.y>f.top||now.max.x<f.minX||now.min.x>f.maxX||now.max.z<f.minZ||now.min.z>f.maxZ)continue;
          const walls=[['x','max',f.minX,1],['x','min',f.maxX,-1],['z','max',f.minZ,1],['z','min',f.maxZ,-1],['y','min',f.top,-1]];
          for(const [axis,edge,at,sign] of walls)if((prior[edge][axis]-at)*sign<=.015&&(now[edge][axis]-at)*sign>.015) {
            penetration=(now[edge][axis]-at)*sign;hit={b,external:f.f,axis,sign,point:now.getCenter(new THREE.Vector3())};hit.point[axis]=at;break;
          }
          if(hit)break;
        }
      }
      if(hit) {
        const axis=hit.axis??'y',sign=hit.axis?-hit.sign:1;
        for(const b of members)b[axis]+=penetration*sign;s[axis]+=penetration*sign;
        const speed=hit.axis?Math.abs(hit.b['v'+axis]):Math.max(0,-hit.b.vy),impact=hit.point;
        if(hit.under?.content&&speed>1.2)bank.hitContent(hit.under,Math.min(160,speed*18),new THREE.Vector3(s.vx*.2,.1,s.vz*.2));
        if(hit.external&&speed>1.2){const key='neighbor:'+hit.b.id+':'+hit.external.index;if(!bank.contacts.has(key)){bank.contacts.add(key);bank.sim._damageFloor(hit.external,impact,Math.min(130,speed*members.reduce((m,b)=>m+b.mass,0)*1.4),new THREE.Vector3(s.vx,0,s.vz).normalize(),false);}}
        if(speed>2.5) {
          bank.sim._emitDust(impact,Math.min(5,Math.ceil(members.length/12)),Math.min(1.6,.3+speed*.08));
          bank.neighborImpact(hit.b,impact,speed);
        }
        // Contact dissipates energy at the surface; the unstruck upper part
        // retains momentum and may break at another real contact next step.
        for(const b of members){const near=bank.bounds(b,new THREE.Box3()).distanceToPoint(impact)<1.45+Math.min(1,speed*.06);if(near){b['v'+axis]*=.12;for(const a of ['x','y','z'])if(a!==axis)b['v'+a]*=.7;}}
        this.fracture(id,impact,speed);
        if(hit.under?.state===0&&!hit.under.fixed&&speed>2.5)bank.damage(impact,Math.min(115,speed*members.reduce((m,b)=>m+b.mass,0)*.45),new THREE.Vector3(s.vx*.1,-.5,s.vz*.1),false);
        // Low energy contact still separates masonry into resting chunks, so
        // the legacy piece contact solver owns final settlement and scoring.
        if(speed<2.5)for(const b of members)if(b.cluster>=0){const cluster=b.cluster;this.sections[cluster].state=0;for(const p of bank.bodies)if(p.cluster===cluster)p.cluster=-1;}
      }
      bank.revision++;
    }
  }
  capture() {
    const data=new Float64Array(this.sections.length*STRIDE);
    this.sections.forEach((s,id)=>KEYS.forEach((k,i)=>data[id*STRIDE+i]=s[k]));return data;
  }
  restore(data) {
    this.sections=[];
    for(let i=0;i<data.length;i+=STRIDE){const s={};KEYS.forEach((k,j)=>s[k]=data[i+j]);this.sections.push(s);}
  }
  get stats(){return {movingSections:this.sections.filter(s=>s.state===1).length,connectedPieces:this.bank.bodies.filter(b=>b.cluster>=0).length};}
}
