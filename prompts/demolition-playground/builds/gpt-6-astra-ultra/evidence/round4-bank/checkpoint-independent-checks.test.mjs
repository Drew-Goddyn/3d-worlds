import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
const root='/Users/Drew/.codex/worktrees/80ca/3d-worlds/prompts/demolition-playground/builds/gpt-6-astra-ultra/';
registerHooks({resolve(s,c,next){
  if(s==='three') return {url:pathToFileURL(root+'vendor/three-0.180.0/three.module.js').href,shortCircuit:true};
  if(s.startsWith('three/addons/'))return {url:pathToFileURL(root+'vendor/three-0.180.0/addons/'+s.slice(13)).href,shortCircuit:true};
  return next(s,c);
}});
const THREE=await import('three');
const {createBank}=await import(pathToFileURL(root+'src/bank.js'));
const {Simulation}=await import(pathToFileURL(root+'src/simulation.js'));
const {Crane}=await import(pathToFileURL(root+'src/crane.js'));
function fixture(){
  const scene=new THREE.Scene();
  const b={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};
  createBank(b,scene);
  const city={buildings:[b],props:[],crowd:[],pigeons:[]};
  return {scene,city,sim:new Simulation(city,scene)};
}
test('retained furnishing identities and support ownership are finite, unique and acyclic',()=>{
  const {sim}=fixture(), bank=sim.bank;
  assert.equal(new Set(bank.bodies.map(b=>b.id)).size,bank.bodies.length);
  for(const b of bank.bodies){
    assert.equal(bank.bodies[b.id],b);
    assert.ok(bank.nodes[b.node].bodies.includes(b.id));
    assert.ok(Number.isFinite(b.mass)&&b.mass>0);
    assert.ok(b.parts.length>0);
    assert.ok(!bank.bounds(b).isEmpty());
    for(const p of b.parts){assert.equal(p.body,b.id);assert.ok(!p.collisionBounds.isEmpty());}
    const owners=new Set([b.id]); let cur=b;
    while(cur.restsOn!=null){assert.ok(bank.bodies[cur.restsOn]);assert.ok(!owners.has(cur.restsOn));owners.add(cur.restsOn);cur=bank.bodies[cur.restsOn];}
  }
  const counts=Object.fromEntries(['counter','table','chair','cabinet','equipment','paper','glass'].map(role=>[role,bank.bodies.filter(b=>b.role===role).length]));
  console.log(JSON.stringify({retained:bank.bodies.length,contents:bank.bodies.filter(b=>b.content).length,counts}));
});
test('native crane contact and complete crane-plus-bank snapshot replay remain exact',()=>{
  const {scene,city,sim}=fixture(), crane=new Crane(scene), bank=sim.bank;
  const initial={simulation:sim.capture(),crane:crane.capture()};
  const table=bank.bodies.find(b=>b.role==='table');
  crane.yaw=crane.goalYaw=Math.atan2(table.z-crane.base.z,table.x-crane.base.x);
  crane.reach=crane.goalReach=Math.hypot(table.x-crane.base.x,table.z-crane.base.z);
  crane.length=crane.goalLength=39.9;crane.updateAnchor();
  crane.ballPosition.set(table.x,2.1,table.z+.3);crane.velocity.set(0,0,-8);
  const frame=dt=>{crane.update(dt,city,sim);sim.update(dt);};
  frame(1/60);assert.ok(table.state>0,'crane contact must move the table');
  const saved={simulation:sim.capture(),crane:crane.capture()},owned=structuredClone(saved);
  const run=()=>{for(let i=0;i<50;i++)frame([.011,.023,.016,.027][i%4]);};
  run();const expected={simulation:sim.capture(),crane:crane.capture()};
  assert.deepEqual(saved,owned);
  sim.restore(saved.simulation);crane.restore(saved.crane);run();
  assert.deepEqual({simulation:sim.capture(),crane:crane.capture()},expected);
  assert.ok(Array.from(expected.simulation.bank.bodies).every(Number.isFinite));
  sim.restore(initial.simulation);crane.restore(initial.crane);
  assert.deepEqual({simulation:sim.capture(),crane:crane.capture()},initial);
});
test('ordinary district target height remains three metres while hall aim can reach two-point-one',()=>{
  const crane=new Crane(new THREE.Scene()), point=new THREE.Vector3(-11,.4,19);
  crane.aimAt(point);assert.equal(crane.aim.y,3);assert.equal(crane.goalLength,39);
  crane.aimAt(point,2.1);assert.equal(crane.aim.y,2.1);assert.equal(crane.goalLength,39.9);
  crane.control('down',10);assert.equal(crane.goalLength,39.9);
  crane.control('up',10);assert.equal(crane.goalLength,8);
});
