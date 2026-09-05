import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import * as THREE from '../vendor/three-0.180.0/three.module.js';
import {History} from '../src/history.js';

// Independent invariant checks; imports use the exact locally vendored runtime.
registerHooks({resolve(specifier, context, next) {
  if(specifier==='three')return {url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};
  return next(specifier,context);
}});
const {Simulation}=await import('../src/simulation.js');
function makeSimulation() {
  const scene = new THREE.Scene();
  const b = {id:0,kind:'brick',x:0,z:0,width:10,depth:10,height:9,floors:[]};
  for(let i=0;i<3;i++) {
    const group=new THREE.Group();group.position.set(0,.23+i*3,0);scene.add(group);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(10,3,10),new THREE.MeshBasicMaterial());group.add(mesh);
    b.floors.push({group,index:i,y:group.position.y,height:3,columns:[{x:-4,z:-4},{x:4,z:-4},{x:-4,z:4},{x:4,z:4}],pieces:[{mesh,material:'brick'}]});
  }
  return new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);
}
function normalize(s){return JSON.parse(JSON.stringify(s,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v));}

test('rolling history retains at least 60 seconds and interpolates inside that window',()=>{
 const h=new History(60);
 for(let i=0;i<=3000;i++)h.record(i*.05,{time:i*.05});
 assert.ok(h.duration>=60,`${h.duration}s retained`);
 assert.ok(h.length<=1202,`${h.length} frames retained`);
 const s=h.sample(110.025);assert.ok(Math.abs(s.alpha-.5)<1e-8);assert.equal(s.a.time,110);
 h.truncate(110);assert.equal(h.end,110);h.record(110.05,{time:110.05,branch:true});assert.equal(h.sample(999).a.branch,true);
});

test('restoring a captured destruction state reproduces its exact future under identical inputs',()=>{
 const sim=makeSimulation();
 sim.impact(new THREE.Vector3(-4,1,4),110,new THREE.Vector3(1,0,.2));
 for(let i=0;i<37;i++)sim.update(1/60);
 const saved=sim.capture();
 for(let i=0;i<80;i++)sim.update(1/60);
 const first=normalize(sim.capture());
 sim.restore(saved);
 for(let i=0;i<80;i++)sim.update(1/60);
 assert.deepEqual(normalize(sim.capture()),first);
});

test('snapshot ownership is independent of future physics and supports exact restore',()=>{
 const sim=makeSimulation();sim.impact(new THREE.Vector3(-4,1,4),70,new THREE.Vector3(1,0,0));
 const saved=sim.capture(),before=normalize(saved);
 for(let i=0;i<120;i++)sim.update(1/60);
 assert.deepEqual(normalize(saved),before);
 sim.restore(saved);assert.deepEqual(normalize(sim.capture()),before);
});

test('six-charge limit and all staged detonation state survive rewind',()=>{
 const sim=makeSimulation();
 for(let i=0;i<6;i++)assert.equal(sim.placeCharge(new THREE.Vector3(-4,1,4),0,0),true);
 assert.equal(sim.placeCharge(new THREE.Vector3(-4,1,4),0,0),false);
 sim.detonate();const saved=sim.capture();
 assert.equal(saved.charges.length,6);
 assert.ok(saved.charges.every((c,i)=>!i||c.when>saved.charges[i-1].when));
 for(let i=0;i<120;i++)sim.update(1/60);
 assert.equal(sim.stats.charges,0);sim.restore(saved);assert.equal(sim.stats.charges,6);
 assert.deepEqual(sim.capture().charges,saved.charges);
});

test('a complete collapse retains finite supported positions and persistent settled debris',()=>{
 const sim=makeSimulation();
 for(const x of [-4,4])for(const z of [-4,4])sim.placeCharge(new THREE.Vector3(x,1,z),0,0);
 sim.detonate();
 for(let i=0;i<1200;i++)sim.update(1/60);
 const s=sim.capture();
 for(const field of ['floors','strengths','debris','dust'])assert.ok(Array.from(s[field]).every(Number.isFinite),field+' contains non-finite values');
 assert.ok(sim.floors.every(f=>f.y>=.22&&Math.abs(f.x)<100&&Math.abs(f.z)<100));
 assert.ok(sim.stats.collapsed>0);assert.ok(sim.stats.pieces>0);
 const count=sim.stats.pieces;for(let i=0;i<600;i++)sim.update(1/60);assert.equal(sim.stats.pieces,count);
});
