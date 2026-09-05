import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='three')return {url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return next(specifier,context);}});
const THREE=await import('three');
const {createBank}=await import('../src/bank.js');
const {Simulation}=await import('../src/simulation.js');
const {History}=await import('../src/history.js');
export function fixture(){const scene=new THREE.Scene(),b={id:0,name:'Mercantile Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(b,scene);const sim=new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);return sim;}
const advance=(sim,seconds)=>{for(let i=0;i<Math.round(seconds*60);i++)sim.update(1/60);};

test('a limited bank wound is local, remains standing, and changes with the hit location',()=>{
  const a=fixture(),b=fixture();
  a.impact(new THREE.Vector3(-5.1,2,18.7),80,new THREE.Vector3(-1,0,0));
  b.impact(new THREE.Vector3(-16.9,2,9.3),80,new THREE.Vector3(1,0,0));
  advance(a,3);advance(b,3);
  const damaged=sim=>sim.bank.bodies.filter(b=>b.hp<1).map(b=>b.id);
  assert.ok(damaged(a).length>0);assert.notDeepEqual(damaged(a),damaged(b));
  assert.ok(a.bank.bodies.some(b=>b.state>0),'physical source pieces must leave the wound');
  assert.ok(a.bank.nodes.filter(n=>n.state!==2).length>=20,'limited hit preserves most of the bank');
  assert.ok(a.bank.bodies.filter(b=>b.hp<1).every(b=>b.origin.distanceTo(new THREE.Vector3(-5.1,2,18.7))<6),'damage stays near hit');
});

test('bank support loss can peel one bay while leaving an independently supported bay intact',()=>{
  const sim=fixture();
  const corner=sim.bank.nodes[8];
  for(const id of corner.supports){const b=sim.bank.bodies[id];sim.bank.damage(b.origin,180,new THREE.Vector3(1,0,1),false);}
  advance(sim,6);
  assert.equal(corner.state,2,'unsupported corner must release');
  assert.equal(sim.bank.nodes[0].state,0,'opposite bay must remain standing');
  assert.ok(sim.bank.nodes[17].state>0,'bay above lost support must react');
});

test('bank charges, support, fragment motion and impact contacts replay exactly without snapshot aliasing',()=>{
  const sim=fixture(),pristine=sim.capture();
  for(const [x,z]of [[-16,18.5],[-6,18.5],[-11,18.5],[-16,10],[-6,10],[-11,10]])assert.ok(sim.placeCharge(new THREE.Vector3(x,1,z),0,0));
  sim.detonate();advance(sim,.2);
  const middle=sim.capture(),copy=structuredClone(middle);
  advance(sim,3);const future=sim.capture();
  assert.deepEqual(middle,copy,'future motion must not mutate history');
  sim.restore(middle);advance(sim,3);assert.deepEqual(sim.capture(),future);
  sim.restore(future,pristine,.5);assert.deepEqual(sim.capture(),future,'interpolated display cannot mutate resume state');
  sim.restore(pristine);assert.deepEqual(sim.capture(),pristine);
  assert.ok(sim.bank.bodies.every(b=>b.state===0&&b.hp===1));
});

test('extensive bank destruction settles into finite persistent architecture and retains a full minute',()=>{
  const sim=fixture(),pristine=sim.capture(),history=new History(60);
  for(const n of sim.bank.nodes.filter(n=>n.level===0))sim.bank.damage(new THREE.Vector3(-11+n.x,2,14+n.z),220,new THREE.Vector3(0,-.2,0),true);
  advance(sim,15);
  assert.ok(sim.bank.nodes.filter(n=>n.state===2).length>=18,'extensive structural damage must collapse the bank');
  const totalMass=sim.bank.bodies.filter(b=>!b.fixed).reduce((sum,b)=>sum+b.mass,0);
  const count=sim.bank.bodies.length,settled=sim.bank.bodies.filter(b=>b.state===2).length;
  assert.ok(settled>count*.6,`${settled}/${count} architectural pieces settled`);
  for(const b of sim.bank.bodies){assert.ok([b.x,b.y,b.z,b.rx,b.rz].every(Number.isFinite));assert.ok(sim.bank.bounds(b).min.y>=.22||b.fixed,'pieces stay above ground');}
  for(let hit=0;hit<3;hit++){sim.impact(new THREE.Vector3(-11,1.5,14),150,new THREE.Vector3(1,0,0));advance(sim,5);}
  assert.ok(sim.bank.tonnage<=totalMass+1e-8,'waking and resettling rubble must not award its mass twice');
  for(let i=0;i<1400;i++){sim.update(.05);history.record(sim.time,sim.capture());}
  assert.ok(history.duration>=60-1e-8);assert.equal(sim.bank.bodies.length,count,'major rubble cannot be recycled');
  sim.restore(pristine);assert.deepEqual(sim.capture(),pristine,'permanent pristine rebuild survives history eviction');
});


test('six normal bank charges can cause substantial failure without an easy-collapse override',()=>{
  const sim=fixture();
  for(const [x,z]of [[-16,19.6],[-11,19.6],[-6,19.6],[-16,8.4],[-11,8.4],[-6,8.4]])assert.ok(sim.placeCharge(new THREE.Vector3(x,1.3,z),0,0));
  sim.detonate();advance(sim,.2);
  assert.ok(sim.bank.nodes.filter(n=>n.level===2).every(n=>n.state!==2),'roof must wait for supporting bays to release');
  for(let i=0;i<500;i++)sim.update([.011,.029,.007,.056,.018][i%5]);
  assert.ok(sim.bank.nodes.filter(n=>n.state===2).length>=18,'native-strength charges must cause substantial collapse');
  assert.ok(sim.bank.stats.settled>1000,'major architecture settles under variable frame intervals');
  assert.equal(sim.bank.stats.loose,0,'settled rubble must stop twitching');
});
