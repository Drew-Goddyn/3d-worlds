import {registerHooks} from 'node:module';
import assert from 'node:assert/strict';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../../src/bank.js');
const {Simulation}=await import('../../src/simulation.js');
const {History}=await import('../../src/history.js');
function fixture(){const scene=new THREE.Scene(),b={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(b,scene);return new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);}
const sim=fixture();const pristine=sim.capture();
for(const [x,z]of [[-16,18.5],[-6,18.5],[-11,18.5],[-16,10],[-6,10],[-11,10]])assert.ok(sim.placeCharge(new THREE.Vector3(x,1,z),0,0));
sim.detonate();for(const dt of [.011,.029,.007,.056])sim.update(dt);
const middle=sim.capture(),owned=structuredClone(middle),dts=Array.from({length:240},(_,i)=>[.011,.029,.007,.056,.018][i%5]);
for(const dt of dts)sim.update(dt);const future=sim.capture();assert.deepEqual(middle,owned);
sim.restore(middle);for(const dt of dts)sim.update(dt);assert.deepEqual(sim.capture(),future);console.log('PASS variable-dt replay and immutable history');
const history=new History(60);history.record(middle.time,middle);history.record(future.time,future);
for(const t of [middle.time,.5,1,2,future.time]){const s=history.sample(t);sim.restore(s.a,s.b,s.alpha);assert.deepEqual(sim.capture(),s.a);}
sim.restore(future);assert.deepEqual(sim.capture(),future);console.log('PASS recorded future interpolation preserves exact resume state');
sim.restore(middle);sim.impact(new THREE.Vector3(-5,5,19),140,new THREE.Vector3(-1,0,0));for(const dt of dts)sim.update(dt);assert.notDeepEqual(sim.capture(),future);console.log('PASS alternative past action changes future');
sim.restore(pristine);
for(const n of sim.bank.nodes.filter(n=>n.level===0))sim.bank.damage(new THREE.Vector3(-11+n.x,2,14+n.z),220,new THREE.Vector3(0,-.2,0),true);
for(let i=0;i<1000;i++)sim.update(.02);
console.log('COLLAPSE',sim.bank.stats,'tonnage',sim.tonnage,'finite',sim.bank.bodies.every(b=>[b.x,b.y,b.z,b.vx,b.vy,b.vz,b.rx,b.ry,b.rz].every(Number.isFinite)));
const state=sim.capture();const totalMass=sim.bank.bodies.filter(b=>!b.fixed).reduce((s,b)=>s+b.mass,0);
for(let r=0;r<4;r++){
 const p=new THREE.Vector3(-11,1.5,14);sim.impact(p,150,new THREE.Vector3(1,0,0));for(let i=0;i<350;i++)sim.update(.02);
 console.log('REPEAT_RUBBLE_IMPACT',r,sim.bank.tonnage,'total mass',totalMass);
}
sim.restore(state);
let floating=[];for(const b of sim.bank.bodies.filter(b=>b.state===2)){
 const bb=sim.bank.bounds(b);let support=.23;
 for(const c of sim.bank.bodies){if(c===b)continue;const cb=sim.bank.bounds(c);if(b.x>cb.min.x+.03&&b.x<cb.max.x-.03&&b.z>cb.min.z+.03&&b.z<cb.max.z-.03&&cb.max.y<=bb.min.y+.02)support=Math.max(support,cb.max.y);}
 if(bb.min.y-support>.3)floating.push({id:b.id,role:b.role,bottom:bb.min.y,support,gap:bb.min.y-support});
}
console.log('UNSUPPORTED_SETTLED',floating.length,JSON.stringify(floating.slice(0,15)));
console.log('RUBBLE_HEIGHT',Math.max(...sim.bank.bodies.map(b=>sim.bank.bounds(b).max.y)));
for(let attack=0;attack<3;attack++){
 sim.impact(new THREE.Vector3(-11,1,14),150,new THREE.Vector3(1,0,0));for(let i=0;i<250;i++)sim.update(.02);
 let unsupported=[];
 for(const b of sim.bank.bodies.filter(b=>b.state===2)){
  const bb=sim.bank.bounds(b);let support=.23;
  for(const c of sim.bank.bodies){if(c===b)continue;const cb=sim.bank.bounds(c);if(b.x>cb.min.x+.03&&b.x<cb.max.x-.03&&b.z>cb.min.z+.03&&b.z<cb.max.z-.03&&cb.max.y<=bb.min.y+.02)support=Math.max(support,cb.max.y);}
  if(bb.min.y-support>.3)unsupported.push({id:b.id,role:b.role,bottom:bb.min.y,support,gap:bb.min.y-support});
 }
 console.log('AFTER_ATTACK_UNSUPPORTED',attack,unsupported.length,JSON.stringify(unsupported.slice(0,10)));
}
assert.ok(sim.bank.tonnage<=totalMass+1e-8,'settled bank mass can only score once despite repeated impacts');
console.log('PASS scored mass remains bounded after rubble re-impacts');
const rolling=new History(60);for(let i=0;i<1400;i++){sim.update(.05);rolling.record(sim.time,sim.capture());}
assert.ok(rolling.duration>=60-1e-8);assert.equal(sim.bank.bodies.length,1537);sim.restore(pristine);assert.deepEqual(sim.capture(),pristine);
console.log('PASS full minute retained and permanent pristine restored after eviction',rolling.duration);
