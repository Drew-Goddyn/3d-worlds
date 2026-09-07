import * as THREE from 'three';

// Bank-local articulated construction. Each original bearing bay is a rigid
// load carrier until contact fractures its retained pieces. Connections live
// at actual pier feet and touching construction, never at scenario waypoints.
// Compliant position constraints follow Macklin et al., XPBD (2016).
const G=12.5;
const axes=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
const a=new THREE.Vector3(),b=new THREE.Vector3(),ra=new THREE.Vector3(),rb=new THREE.Vector3(),cross=new THREE.Vector3();
const turn=new THREE.Quaternion(),delta=new THREE.Quaternion();
export class BankStructure {
  constructor(bank) {
    this.bank=bank;
    this.frames=bank.nodes.map(n=>{
      const members=n.bodies.map(id=>bank.bodies[id]).filter(b=>!b.fixed&&!b.content);
      const mass=members.reduce((s,b)=>s+b.mass,0);
      const rest=new THREE.Vector3();for(const b of members)rest.addScaledVector(b.origin,b.mass/mass);
      const inertia=new THREE.Vector3();
      for(const b of members){const r=b.origin.clone().sub(rest),s=b.size;inertia.x+=b.mass*(r.y*r.y+r.z*r.z+(s.y*s.y+s.z*s.z)/12);inertia.y+=b.mass*(r.x*r.x+r.z*r.z+(s.x*s.x+s.z*s.z)/12);inertia.z+=b.mass*(r.x*r.x+r.y*r.y+(s.x*s.x+s.y*s.y)/12);}
      return {rest,p:rest.clone(),q:new THREE.Quaternion(),v:new THREE.Vector3(),w:new THREE.Vector3(),mass,inv:1/mass,inertia:new THREE.Vector3(1/inertia.x,1/inertia.y,1/inertia.z),com:new THREE.Vector3(),active:false,oldP:rest.clone(),oldQ:new THREE.Quaternion()};
    });
    this.joints=[];
    for(const n of bank.nodes)for(const id of n.supports) {
      const body=bank.bodies[id],point=new THREE.Vector3(body.origin.x,.23+n.y,body.origin.z);
      let load=0;for(let k=n.id;k<bank.nodes.length;k+=9)load+=this.frames[k].mass*G;
      this.addJoint(n.id,n.below,point,id,null,'bearing',load/2.1);
    }
    // Only solid construction spanning adjacent bays can transfer lateral load.
    // Keep up to two widely separated physical welds per bay boundary. A court
    // void cannot acquire a fictional diaphragm from the node grid alone.
    const solid=bank.bodies.filter(b=>!b.fixed&&!b.content&&!['glass','joinery','vault-seam','paper','pier'].includes(b.role));
    const boxes=new Map(solid.map(b=>[b.id,bank.bounds(b)]));
    for(const n of bank.nodes)for(const other of n.neighbors)if(other>n.id) {
      const candidates=[];
      for(const x of solid.filter(b=>b.node===n.id))for(const y of solid.filter(b=>b.node===other)) {
        const xb=boxes.get(x.id),yb=boxes.get(y.id);
        if(!xb.clone().expandByScalar(.12).intersectsBox(yb))continue;
        const overlap=xb.clone().expandByScalar(.06).intersect(yb.clone().expandByScalar(.06));
        if(overlap.isEmpty())continue;
        const point=overlap.getCenter(new THREE.Vector3());
        candidates.push({x,y,point});
      }
      candidates.sort((a,b)=>b.point.y-a.point.y||a.x.id-b.x.id);
      const selected=[];
      for(const c of candidates)if(selected.every(s=>s.point.distanceTo(c.point)>1.6)) {
        selected.push(c);this.addJoint(n.id,other,c.point,c.x.id,c.y.id,'tie',(this.frames[n.id].mass+this.frames[other].mass)*G*.23);
        if(selected.length===2)break;
      }
    }
  }
  addJoint(i,j,point,body,other,kind,strength) {
    this.joints.push({i,j,a:point.clone().sub(this.frames[i].rest),b:j<0?point.clone():point.clone().sub(this.frames[j].rest),body,other,kind,strength,broken:false,strain:0,lambda:new THREE.Vector3()});
  }
  refreshMass() {
    for(const n of this.bank.nodes) {
      if(n.state===2)continue;
      const f=this.frames[n.id],inertia=new THREE.Vector3();f.mass=0;f.com.set(0,0,0);
      for(const id of n.bodies) {
        const b=this.bank.bodies[id];if(b.fixed||b.content||b.state!==0)continue;
        const r=b.origin.clone().sub(f.rest),s=b.size;f.mass+=b.mass;f.com.addScaledVector(r,b.mass);
        inertia.x+=b.mass*(r.y*r.y+r.z*r.z+(s.y*s.y+s.z*s.z)/12);inertia.y+=b.mass*(r.x*r.x+r.z*r.z+(s.x*s.x+s.z*s.z)/12);inertia.z+=b.mass*(r.x*r.x+r.y*r.y+(s.x*s.x+s.y*s.y)/12);
      }
      if(f.mass>0){f.com.multiplyScalar(1/f.mass);f.inv=1/f.mass;f.inertia.set(1/Math.max(.01,inertia.x),1/Math.max(.01,inertia.y),1/Math.max(.01,inertia.z));}
      else {n.state=2;f.active=false;}
    }
  }
  transform(id,out=new THREE.Matrix4()) {const f=this.frames[id];return out.compose(f.p,f.q,new THREE.Vector3(1,1,1)).multiply(new THREE.Matrix4().makeTranslation(-f.rest.x,-f.rest.y,-f.rest.z));}
  inverseInertia(f,v,out=new THREE.Vector3()) {return out.copy(v).applyQuaternion(turn.copy(f.q).invert()).multiply(f.inertia).applyQuaternion(f.q);}
  rotate(f,v) {const angle=v.length();if(angle>1e-12){delta.setFromAxisAngle(a.copy(v).multiplyScalar(1/angle),angle);f.q.premultiply(delta).normalize();}}
  weight(f,r,axis) {if(!f?.active)return 0;cross.crossVectors(r,axis);return f.inv+cross.dot(this.inverseInertia(f,cross));}
  correct(f,r,axis,amount) {if(!f?.active)return;f.p.addScaledVector(axis,amount*f.inv);const angular=this.inverseInertia(f,new THREE.Vector3().crossVectors(r,axis)).multiplyScalar(amount);this.rotate(f,angular);}
  held(j) {const bank=this.bank,x=bank.bodies[j.body],y=j.other==null?null:bank.bodies[j.other];return !j.broken&&bank.nodes[j.i].state!==2&&(j.j<0||bank.nodes[j.j].state!==2)&&x.state===0&&(!y||y.state===0);}
  solve(j,dt) {
    const f=this.frames[j.i],g=j.j<0?null:this.frames[j.j];
    if(!this.held(j)||!f.active&&!g?.active)return;
    const hp=Math.max(.05,Math.min(this.bank.bodies[j.body].hp,j.other==null?1:this.bank.bodies[j.other].hp));
    const compliance=(j.kind==='bearing'?2e-7:1.2e-6)/(hp*hp*hp),alpha=compliance/(dt*dt);
    for(let k=0;k<3;k++) {
      ra.copy(j.a).applyQuaternion(f.q);rb.copy(j.b);if(g)rb.applyQuaternion(g.q);
      a.copy(ra).add(f.p);b.copy(rb);if(g)b.add(g.p);
      const axis=axes[k],error=a.sub(b).dot(axis),w=this.weight(f,ra,axis)+this.weight(g,rb,axis);
      if(w===0)continue;
      const dl=(-error-alpha*j.lambda.getComponent(k))/(w+alpha);
      j.lambda.setComponent(k,j.lambda.getComponent(k)+dl);
      this.correct(f,ra,axis,dl);this.correct(g,rb,axis,-dl);
    }
  }
  wake(id) {const n=this.bank.nodes[id],f=this.frames[id];if(n.state===2)return;f.active=true;n.state=1;}
  step(dt) {
    const bank=this.bank;
    this.refreshMass();
    for(const n of bank.nodes) {
      if(n.state===2)continue;
      const capacity=n.supports.reduce((s,id)=>s+(bank.bodies[id].state===0?bank.bodies[id].hp**2:0),0)/4;
      n.support=capacity;
      if(capacity<.68)this.wake(n.id);
    }
    if(!this.frames.some(f=>f.active))return;
    // Reactions must be paid for by the rest of the construction. Once loaded,
    // solve all surviving carriers, including initially sound neighboring bays.
    // Treating those neighbors as infinite anchors would hide transferred load.
    for(const n of bank.nodes)if(n.state!==2)this.frames[n.id].active=true;
    const prior=new Map(bank.bodies.filter(b=>!b.fixed&&b.state===0&&!b.content).map(b=>[b.id,bank.bounds(b)]));
    // Four small solves keep stiff masonry bearings stable without unbounded
    // iterations. Multipliers are local to each substep; accumulated rupture
    // strain and rigid state are the persistent, captured quantities.
    const steps=4,h=dt/steps;
    for(let sub=0;sub<steps;sub++) {
      for(const n of bank.nodes) {
        const f=this.frames[n.id];if(!f.active||n.state===2)continue;
        f.oldP.copy(f.p);f.oldQ.copy(f.q);f.v.y-=G*h;
        const gravityTorque=new THREE.Vector3().crossVectors(f.com.clone().applyQuaternion(f.q),new THREE.Vector3(0,-f.mass*G,0));
        f.w.addScaledVector(this.inverseInertia(f,gravityTorque),h);f.p.addScaledVector(f.v,h);this.rotate(f,f.w.clone().multiplyScalar(h));
      }
      for(const j of this.joints)j.lambda.set(0,0,0);
      for(let iteration=0;iteration<5;iteration++)for(const j of this.joints)this.solve(j,h);
      for(const j of this.joints)if(this.held(j)) {
        const f=this.frames[j.i],g=j.j<0?null:this.frames[j.j];if(!f.active&&!g?.active)continue;
        const hp=Math.min(bank.bodies[j.body].hp,j.other==null?1:bank.bodies[j.other].hp);
        const force=j.lambda.length()/(h*h),capacity=j.strength*Math.max(.03,hp*hp);
        // Damage integrates overload, not elapsed collapse age. Quiet partial
        // wounds stop accumulating when neighboring construction carries them.
        j.strain=Math.max(0,j.strain+h*(force/capacity-1)*1.8);
        if(j.strain>1) {j.broken=true;bank.bodies[j.body].hp=Math.min(bank.bodies[j.body].hp,.18);if(j.kind==='bearing')this.wake(j.i);}
      }
      for(const n of bank.nodes) {
        const f=this.frames[n.id];if(!f.active||n.state===2)continue;
        f.v.copy(f.p).sub(f.oldP).multiplyScalar(1/h);
        delta.copy(f.q).multiply(turn.copy(f.oldQ).invert());if(delta.w<0)delta.set(-delta.x,-delta.y,-delta.z,-delta.w);
        const sin=Math.hypot(delta.x,delta.y,delta.z),angle=2*Math.atan2(sin,delta.w);
        f.w.set(delta.x,delta.y,delta.z).multiplyScalar(sin>1e-10?angle/(sin*h):0);
        f.v.multiplyScalar(Math.exp(-.12*h));f.w.multiplyScalar(Math.exp(-.3*h));
      }
    }
    const breaking=[];
    for(const n of bank.nodes) {
      const f=this.frames[n.id];if(!f.active||n.state===2)continue;
      n.drop=Math.max(0,f.rest.y-f.p.y);if(n.drop>.04||1-Math.abs(f.q.w)>.0003)n.state=1;const e=new THREE.Euler().setFromQuaternion(f.q);n.rx=e.x;n.rz=e.z;n.wx=f.w.x;n.wz=f.w.z;
      let bottom=Infinity,hit=null;
      for(const id of n.bodies) {const body=bank.bodies[id];if(body.state!==0||body.fixed||body.content)continue;const box=bank.bounds(body);if(box.min.y<bottom){bottom=box.min.y;hit=body;}}
      if(bottom<.23) {
        // A surviving lower edge is a contact, not an automatic command to
        // explode the whole bay. Off-centre ground reaction can become its
        // rolling bearing; overloaded masonry at that contact crumbles first.
        const m=bank.bodyMatrix(hit),local=hit.bounds,point=new THREE.Vector3();let low=Infinity;
        for(const x of [local.min.x,local.max.x])for(const y of [local.min.y,local.max.y])for(const z of [local.min.z,local.max.z]) {
          const corner=new THREE.Vector3(x,y,z).applyMatrix4(m);if(corner.y<low){low=corner.y;point.copy(corner);}
        }
        const r=point.clone().sub(f.p),speed=-new THREE.Vector3().crossVectors(f.w,r).add(f.v).y;
        if(speed>2.5) {f.p.y+=.23-bottom;breaking.push({n,hit,speed});}
        else {
          const w=this.weight(f,r,axes[1]),lambda=(.23-bottom)/w;
          this.correct(f,r,axes[1],lambda);
          const impulse=Math.max(0,speed)/w;
          f.v.y+=impulse*f.inv;f.w.add(this.inverseInertia(f,new THREE.Vector3().crossVectors(r,axes[1])).multiplyScalar(impulse));
          if(lambda/(dt*dt)>hit.mass*G*35&&!hit.fixed) {
            this.releasePiece(hit,f);hit.hp=Math.min(hit.hp,.18);
          }
        }
      }
    }
    for(const {n,hit,speed} of breaking)this.breakBay(n,hit,speed);
    this.contacts(prior,dt);
    bank.revision++;
  }
  contacts(prior,dt) {
    const bank=this.bank,grid=new Map(),bounds=new Map();
    const solid=bank.bodies.filter(b=>!['glass','paper'].includes(b.role));
    for(const b of solid) {
      const box=bank.bounds(b);bounds.set(b.id,box);
      for(let x=Math.floor(box.min.x/3);x<=Math.floor(box.max.x/3);x++)for(let z=Math.floor(box.min.z/3);z<=Math.floor(box.max.z/3);z++) {
        const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(b);
      }
    }
    const dealt=new Set();
    for(const piece of solid) {
      const n=bank.nodes[piece.node],f=this.frames[piece.node];
      if(piece.state!==0||piece.fixed||piece.content||n.state===2||!f.active||dealt.has(n.id)||f.v.lengthSq()+f.w.lengthSq()<.09)continue;
      const before=prior.get(piece.id),now=bank.bounds(piece);if(!before)continue;
      const entries=new Set();for(let x=Math.floor(now.min.x/3);x<=Math.floor(now.max.x/3);x++)for(let z=Math.floor(now.min.z/3);z<=Math.floor(now.max.z/3);z++)for(const b of grid.get(x+','+z)??[])entries.add(b);
      for(const other of entries) {
        if(other===piece||other.state===0&&!other.content&&!other.fixed&&other.node===piece.node||other.restsOn===piece.id||piece.restsOn===other.id)continue;
        const ob=bank.bounds(other),op=prior.get(other.id)??ob;
        if(!now.intersectsBox(ob)||!bank.solidContact(piece,other))continue;
        let axis=null,sign=0,depth=0;
        for(const k of [1,0,2]) {
          const dim=['x','y','z'][k];
          if(before.min[dim]>=op.max[dim]-.008&&now.min[dim]<ob.max[dim]-.008){axis=k;sign=1;depth=ob.max[dim]-now.min[dim];break;}
          if(k!==1&&before.max[dim]<=op.min[dim]+.008&&now.max[dim]>ob.min[dim]+.008){axis=k;sign=-1;depth=now.max[dim]-ob.min[dim];break;}
        }
        if(axis==null)continue;
        const normal=axes[axis].clone().multiplyScalar(sign),point=now.clone().intersect(ob).getCenter(new THREE.Vector3());
        const r=point.clone().sub(f.p),velocity=new THREE.Vector3().crossVectors(f.w,r).add(f.v);
        const g=other.state===0&&!other.fixed&&!other.content?this.frames[other.node]:null;
        const rg=g?point.clone().sub(g.p):new THREE.Vector3(),ov=g?new THREE.Vector3().crossVectors(g.w,rg).add(g.v):new THREE.Vector3(other.vx,other.vy,other.vz);
        const speed=-velocity.clone().sub(ov).dot(normal);if(speed<.2)continue;
        // Thin joinery/furnishings cannot become an immovable bank support.
        if(other.content&&speed>1.2)bank.hitContent(other,Math.min(160,speed*f.mass),velocity.clone().normalize());
        const wi=this.weight(f,r,normal),wo=g?this.weight(g,rg,normal):other.state===1?1/other.mass:0;
        const impulse=speed/(wi+wo),correction=depth/(wi+wo);
        this.correct(f,r,normal,correction);if(g)this.correct(g,rg,normal,-correction);else if(other.state===1){other.x-=normal.x*correction/other.mass;other.y-=normal.y*correction/other.mass;other.z-=normal.z*correction/other.mass;}
        f.v.addScaledVector(normal,impulse*f.inv);f.w.add(this.inverseInertia(f,new THREE.Vector3().crossVectors(r,normal)).multiplyScalar(impulse));
        if(g){g.v.addScaledVector(normal,-impulse*g.inv);g.w.add(this.inverseInertia(g,new THREE.Vector3().crossVectors(rg,normal)).multiplyScalar(-impulse));}
        else if(other.state===1){other.vx-=normal.x*impulse/other.mass;other.vy-=normal.y*impulse/other.mass;other.vz-=normal.z*impulse/other.mass;}
        if(speed>2.5) {
          this.breakBay(n,piece,speed);dealt.add(n.id);
          if(g&&bank.nodes[other.node].state!==2&&impulse>other.mass*5){this.breakBay(bank.nodes[other.node],other,speed);dealt.add(other.node);}
          else if(other.state===0&&!other.fixed&&!other.content)bank.damage(point,Math.min(110,impulse*.35),normal.clone().negate(),false);
          break;
        }
      }
      if(dealt.has(n.id))continue;
      // Neighbors keep their original storey solver. Bank motion reaches their
      // current envelopes and pays the contact impulse to the same district API.
      for(const floor of bank.sim.floors.filter(f=>!f.building.bank)) {
        const ob=new THREE.Box3(new THREE.Vector3(floor.x-floor.building.width/2,floor.y,floor.z-floor.building.depth/2),new THREE.Vector3(floor.x+floor.building.width/2,floor.y+floor.floor.height*floor.squash,floor.z+floor.building.depth/2));
        if(!now.intersectsBox(ob))continue;
        for(const dim of ['x','z','y']) {
          let sign=0,depth=0;if(before.min[dim]>=ob.max[dim]&&now.min[dim]<ob.max[dim]){sign=1;depth=ob.max[dim]-now.min[dim];}else if(dim!=='y'&&before.max[dim]<=ob.min[dim]&&now.max[dim]>ob.min[dim]){sign=-1;depth=now.max[dim]-ob.min[dim];}
          if(!sign)continue;
          const point=now.clone().intersect(ob).getCenter(new THREE.Vector3()),speed=Math.abs(f.v[dim]);f.p[dim]+=depth*sign;
          if(speed>1.2)bank.sim._damageFloor(floor,point,Math.min(130,speed*f.mass),f.v.clone().normalize(),false);
          this.breakBay(n,piece,speed);dealt.add(n.id);break;
        }
        if(dealt.has(n.id))break;
      }
    }
  }
  breakBay(n,hit,speed) {
    const bank=this.bank,f=this.frames[n.id],ids=n.bodies.filter(id=>{const b=bank.bodies[id];return b.state===0&&!b.fixed&&!b.content;});
    // Release uses the displayed rigid transform first. Piece momentum is the
    // carrier's velocity plus omega cross offset, with no collapse-direction kick.
    for(const id of ids)this.releasePiece(bank.bodies[id],f);
    n.state=2;f.active=false;
    bank.cohesion.assemble(ids.filter(id=>bank.cohesion.neighbors[id].length));
    const point=hit?bank.bounds(hit).getCenter(new THREE.Vector3()):f.p.clone();point.y=Math.max(.23,point.y);
    bank.sim.lastImpact.copy(point);bank.sim._emit('collapse',point,{buildingId:bank.recipe.building.id,floor:n.level,material:'stone'});bank.sim.crowdReaction=1;
  }
  releasePiece(body,f) {
    this.bank.release(body,new THREE.Vector3(),0);
    const r=new THREE.Vector3(body.x,body.y,body.z).sub(f.p),velocity=new THREE.Vector3().crossVectors(f.w,r).add(f.v);
    body.vx=velocity.x;body.vy=velocity.y;body.vz=velocity.z;body.wx=f.w.x;body.wy=f.w.y;body.wz=f.w.z;
  }
  capture() {
    return {frames:this.frames.map(f=>[...f.p,...f.q,...f.v,...f.w,Number(f.active)]),joints:this.joints.map(j=>[Number(j.broken),j.strain])};
  }
  restore(s) {s.frames.forEach((v,i)=>{const f=this.frames[i];f.p.fromArray(v);f.q.fromArray(v,3);f.v.fromArray(v,7);f.w.fromArray(v,10);f.active=!!v[13];});s.joints.forEach((v,i)=>{this.joints[i].broken=!!v[0];this.joints[i].strain=v[1];});}
}
