import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return s==='three'?{url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true}:n(s,c);}});
const THREE=await import('three'),{BankPhysics}=await import('../src/bank-physics.js'),{createBank}=await import('../src/bank.js'),{Simulation}=await import('../src/simulation.js');
function small(specs) {
  const bodies=specs.map((s,id)=>{const size=new THREE.Vector3(...s.size),bounds=new THREE.Box3(size.clone().multiplyScalar(-.5),size.clone().multiplyScalar(.5));return {id,node:s.node??0,role:'stone',origin:new THREE.Vector3(...s.pos),mass:s.mass??1,size,bounds,parts:[{collisionBounds:bounds.clone()}],fixed:false};});
  const recipe={building:{id:0,x:0,z:0},batches:[],nodes:Array.from({length:Math.max(...bodies.map(b=>b.node))+1},(_,id)=>({id,level:0,below:-1,x:0,y:0,z:0,bodies:bodies.filter(b=>b.node===id).map(b=>b.id),supports:[],neighbors:[]})),bodies};
  const sim={floors:[],buildingStates:[],time:0,tonnage:0,random:()=>.5,lastImpact:new THREE.Vector3(),_emit(){},_emitDust(){},_affectProps(){}};
  const bank=new BankPhysics(recipe,sim);sim.bank=bank;return bank;
}
function fixture(){const scene=new THREE.Scene(),b={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(b,scene);return new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);}
const advance=(s,n)=>{for(let i=0;i<n;i++)s.update(1/60);};

test('a heavy contact damages the struck block without releasing the entire supported receiving bay',()=>{
  const bank=small([{node:0,pos:[0,4.2,0],size:[1,1,1],mass:10},{node:1,pos:[0,3.4,0],size:[1,.4,1],mass:.1},{node:1,pos:[1,3.4,0],size:[1,.4,1],mass:10}]),st=bank.structure;
  for(const n of bank.nodes){st.frames[n.id].active=true;st.addJoint(n.id,-1,st.frames[n.id].rest,n.id, null,'bearing',1000);}
  const f=st.frames[0],prior=new Map(bank.bodies.map(b=>[b.id,bank.bounds(b)]));f.v.y=-5;f.p.y-=.3;
  st.contacts(prior,1/60);
  assert.ok(bank.bodies[1].hp<1,'the real struck member takes damage');
  assert.equal(bank.bodies[2].state,0,'an untouched connected member keeps its carrier');
  assert.notEqual(bank.nodes[1].state,2,'single-piece mass cannot decide whole-bay fracture');
  assert.ok(st.frames[1].v.y<0,'the receiving construction still pays the transferred momentum');
});

test('court piers cannot borrow a distant surviving footing after their actual connecting construction is removed',()=>{
  const s=fixture(),bank=s.bank,ids=[1084,1264],targets=ids.map(id=>bank.bodies[id]);
  const parts=b=>b.parts.map(p=>p.collisionBounds.clone().applyMatrix4(bank.bodyMatrix(b)));
  const surfaces=targets.flatMap(parts);
  const connected=bank.bodies.filter(b=>!b.fixed&&!b.content&&!ids.includes(b.id)&&parts(b).some(p=>surfaces.some(q=>p.clone().expandByScalar(.18).intersectsBox(q))));
  assert.ok(connected.length>0);
  for(const b of connected)bank.release(b,new THREE.Vector3(),0);
  assert.equal(bank.bodies[359].state,0,'the obsolete below-carrier still has its pier');
  const before=targets.map(b=>bank.bounds(b).min.y),past=s.capture(),copy=structuredClone(past);
  advance(s,1);
  for(let i=0;i<ids.length;i++){assert.equal(targets[i].state,1,'detached pillar must leave its old carrier immediately');assert.ok(targets[i].vy<0&&bank.bounds(targets[i]).min.y<before[i],'gravity must move the detached pillar');}
  advance(s,119);
  for(const b of targets)if(b.state===2){const bottom=bank.bounds(b).min.y;assert.ok(bottom<=.25||bank.bodies.some(other=>other!==b&&other.state!==1&&other.parts.some(p=>{const q=p.collisionBounds.clone().applyMatrix4(bank.bodyMatrix(other));return b.x>=q.min.x&&b.x<=q.max.x&&b.z>=q.min.z&&b.z<=q.max.z&&Math.abs(q.max.y-bottom)<.045;})),'a fallen pillar may stop only on a current solid surface');}
  assert.equal(bank.nodes[0].state,0,'distant independent support stays intact');
  const fresh=fixture();fresh.restore(past);advance(fresh,120);assert.deepEqual(fresh.capture(),s.capture());assert.deepEqual(past,copy);
});

test('settled pieces need a path to ground and cannot keep each other asleep through a tolerance cycle',()=>{
  const specs=[0,1].map(()=>({pos:[0,5,0],size:[.3,.02,.3]})),bank=small(specs);
  bank.nodes[0].state=2;for(const b of bank.bodies)b.state=2;
  const past=bank.capture(),copy=structuredClone(past);
  for(let i=0;i<60;i++)bank.step(1/60);
  for(const b of bank.bodies)assert.ok(b.y<2,'an unsupported cycle falls under gravity');
  const fresh=small(specs);fresh.restore(past);for(let i=0;i<60;i++)fresh.step(1/60);assert.deepEqual(fresh.capture(),bank.capture());assert.deepEqual(past,copy);
});
