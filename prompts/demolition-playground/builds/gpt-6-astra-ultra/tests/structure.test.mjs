import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../src/bank.js');
const {Simulation}=await import('../src/simulation.js');
const {BankPhysics}=await import('../src/bank-physics.js');
function fixture(){const scene=new THREE.Scene(),b={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(b,scene);return new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);}
const advance=(s,n)=>{for(let i=0;i<n;i++)s.update(1/60);};
const routes={front:[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65]],side:[[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]};
function cut(s,points){for(const p of points)assert.ok(s.placeCharge(new THREE.Vector3(...p),0,0));s.detonate();}

test('intact bearings and the hinged vault carry their actual gravity load without a hidden pristine anchor',()=>{
  const s=fixture(),b=s.bank;b.structure.wake(0);advance(s,180);
  assert.equal(b.nodes.filter(n=>n.state===2).length,0);
  for(const f of b.structure.frames){assert.ok(f.p.distanceTo(f.rest)<.025,'loaded intact construction remains at equilibrium');assert.ok(Math.abs(f.q.w)>.9999);}
  assert.equal(b.bodies.filter(p=>p.state>0).length,0,'gravity alone must not rupture an intact roof');
});

test('equal front and side cuts carry upper construction on different support-driven paths, including a perturbed placement',()=>{
  const observations=[];
  for(const [name,points]of [...Object.entries(routes),['perturbed',routes.side.map((p,i)=>[p[0],p[1]+(i===1?.22:0),p[2]])]]) {
    const s=fixture(),b=s.bank;cut(s,points);let dx=0,dz=0,carried=0,coherent=0;
    for(let i=0;i<300;i++) {
      const n=b.nodes[name==='front'?25:23],ids=b.structure.members[n.id].filter(id=>b.bodies[id].state===0),pair=ids.length>1?[ids[0],ids.at(-1)]:null;
      const point=id=>new THREE.Vector3().setFromMatrixPosition(b.bodyMatrix(b.bodies[id]));
      const before=pair?point(pair[0]).distanceTo(point(pair[1])):0;s.update(1/60);
      if(pair&&pair.every(id=>b.bodies[id].state===0)){assert.ok(Math.abs(point(pair[0]).distanceTo(point(pair[1]))-before)<1e-8,'carried architecture cannot stretch');if(b.structure.frames[n.id].v.length()>.3)coherent++;}
      for(const node of b.nodes.filter(n=>n.level===2&&n.state!==2)){const f=b.structure.frames[node.id];dx=Math.max(dx,Math.abs(f.p.x-f.rest.x));dz=Math.max(dz,Math.abs(f.p.z-f.rest.z));if(f.v.length()>.3)carried=Math.max(carried,b.structure.members[node.id].filter(id=>b.bodies[id].state===0).length);}
    }
    observations.push({name,dx,dz});assert.ok(carried>20&&coherent>10,'recognizable upper construction must move while still connected');
  }
  assert.ok(observations[0].dz>1&&observations[0].dz>observations[0].dx*2);
  for(const o of observations.slice(1))assert.ok(o.dx>1&&o.dx>o.dz*2,'side-cut direction survives an ordinary placement perturbation');
});

test('a loaded vault, broken connections and a later cut resume exactly in a fresh simulation without mutating the past',()=>{
  const s=fixture();cut(s,routes.side);advance(s,105);const past=s.capture(),copy=structuredClone(past);
  advance(s,150);const future=s.capture();const fresh=fixture();fresh.restore(past);advance(fresh,150);assert.deepEqual(fresh.capture(),future);
  fresh.restore(past);const b=fresh.bank,part=b.bodies.find(p=>p.state===0&&p.role==='pier'&&b.nodes[p.node].level===1);
  const point=b.bounds(part).getCenter(new THREE.Vector3());assert.ok(fresh.placeCharge(point,0,1,part.id));fresh.detonate();advance(fresh,150);assert.notDeepEqual(fresh.capture(),future);assert.deepEqual(past,copy);
});

test('supported construction transfers a contact impulse to a falling section owner without stretching its members',()=>{
  const specs=[{node:0,pos:[0,4.2,0],size:[1,1,1]},{node:1,pos:[-.99,3.4,0],size:[1,.4,1]},{node:1,pos:[0,3.4,0],size:[1,.4,1]},{node:1,pos:[.99,3.4,0],size:[1,.4,1]}];
  const bodies=specs.map((s,id)=>{const size=new THREE.Vector3(...s.size),bounds=new THREE.Box3(size.clone().multiplyScalar(-.5),size.clone().multiplyScalar(.5));return {id,node:s.node,role:'stone',origin:new THREE.Vector3(...s.pos),mass:1,size,bounds,parts:[{collisionBounds:bounds.clone()}],fixed:false,cohesion:'lower'};});
  const recipe={building:{x:0,z:0,id:0},batches:[],nodes:[0,1].map(id=>({id,x:0,z:0,y:0,level:id,ix:0,iz:0,bodies:bodies.filter(b=>b.node===id).map(b=>b.id),supports:[],neighbors:[]})),bodies};
  const sim={floors:[],buildingStates:[],time:0,tonnage:0,random:()=>.5,_emitDust(){},_affectProps(){},_emit(){}};
  const bank=new BankPhysics(recipe,sim);sim.bank=bank;bank.nodes[1].state=2;for(const b of bank.bodies.slice(1))b.state=1;bank.cohesion.assemble([1,2,3]);
  const f=bank.structure.frames[0];f.active=true;f.v.y=-2;const prior=new Map(bank.bodies.map(b=>[b.id,bank.bounds(b)]));f.p.y-=.3;
  const separation=bank.bodies[3].x-bank.bodies[1].x;bank.structure.contacts(prior,1/60);const section=bank.cohesion.sections[0],velocity=section.vy;
  assert.ok(velocity<0,'the actual section owner receives momentum');for(const b of bank.bodies.slice(1))assert.equal(b.vy,velocity);
  bank.cohesion.step(1/60,new Map());assert.ok(Math.abs(section.vy-(velocity-12.5/60))<1e-10);assert.equal(bank.bodies[3].x-bank.bodies[1].x,separation);
  for(const b of bank.bodies.slice(1))assert.equal(b.vy,section.vy);
});

test('a roof-only cut wakes the surviving half-arch through its lost crown connection',()=>{
  const s=fixture(),b=s.bank,left=b.bodies.find(b=>b.role==='vault-rib'&&b.origin.x< -11),right=b.bodies.find(b=>b.role==='vault-rib'&&b.origin.x> -11&&b.origin.z===left.origin.z);
  b.release(left,new THREE.Vector3(),0);advance(s,30);
  const f=b.structure.frames[b.structure.owner[right.id]];
  assert.ok(f.active||right.state>0,'the surviving roof responds without a masonry cut');
  assert.ok(f.p.distanceTo(f.rest)>.1,'loss of the crown must produce actual roof movement');
});
