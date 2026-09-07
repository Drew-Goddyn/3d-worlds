import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {writeFileSync} from 'node:fs';
const root='file:///tmp/astra-round6-checkpoint/verification-worktree/prompts/demolition-playground/builds/gpt-6-astra-ultra/';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('vendor/three-0.180.0/three.module.js',root).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import(new URL('src/bank.js',root));
const {Simulation}=await import(new URL('src/simulation.js',root));
function fixture(){const scene=new THREE.Scene(),bank={id:0,name:'Mercantile Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(bank,scene);return new Simulation({buildings:[bank],props:[],crowd:[],pigeons:[]},scene);}
function invariant(sim){
 const bank=sim.bank;
 for(const b of bank.bodies){assert.ok([b.x,b.y,b.z,b.rx,b.ry,b.rz,b.vx,b.vy,b.vz,b.wx,b.wy,b.wz,b.hp,b.state,b.cluster].every(Number.isFinite));if(b.cluster>=0){assert.equal(b.state,1);assert.equal(bank.cohesion.sections[b.cluster].state,1);}}
 assert.ok(bank.cohesion.sections.length <= bank.bodies.length);
 for(const [id,s] of bank.cohesion.sections.entries())if(s.state===1)assert.ok(bank.bodies.filter(b=>b.cluster===id).length>=3);
 const owners=bank.recipe.batches.flatMap(b=>b.parts.map(p=>p.body));assert.ok(owners.every(id=>bank.bodies[id]));
 return {bodyCount:bank.bodies.length,renderedPartCount:owners.length,sectionSlots:bank.cohesion.sections.length,connectedPieces:bank.stats.connectedPieces};
}
const a=fixture(),pristine=structuredClone(a.capture()),initial=invariant(a);
for(const [x,z] of [[-15.7,19.65],[-11,19.65],[-6.3,19.65],[-4.8,10],[-4.8,14],[-4.8,17.8]])assert.ok(a.placeCharge(new THREE.Vector3(x,1.3,z),0,0));a.detonate();
let mid;
for(let i=0;i<300;i++){a.update(1/60);invariant(a);if(a.bank.stats.connectedPieces>50){mid=structuredClone(a.capture());break;}}
assert.ok(mid,'ordinary charge strength must produce connected flight');
const midState=invariant(a),frozen=structuredClone(mid),b=fixture();b.restore(mid);assert.deepEqual(b.capture(),mid);
for(let i=0;i<180;i++){const dt=[.007,.016,.041,.059,.01][i%5];a.update(dt);b.update(dt);assert.deepEqual(a.capture(),b.capture());invariant(a);invariant(b);}
assert.deepEqual(mid,frozen,'fresh restore and continuation cannot mutate input snapshot');
const end=structuredClone(a.capture());b.restore(end,pristine,.5);assert.deepEqual(b.capture(),end,'interpolated presentation leaves hidden resume state intact');
b.restore(pristine);assert.deepEqual(b.capture(),pristine);const restored=invariant(b);assert.equal(restored.bodyCount,initial.bodyCount);assert.equal(restored.renderedPartCount,initial.renderedPartCount);
const output={status:'PASS',scope:'Independent Node-only bank fixture; no native/browser claim',input:'Six ordinary-strength front/right charges, then mixed frame deltas',snapshotTime:mid.time,midState,initial,restored,checks:{freshInstanceSnapshotRestore:true,exactFutureAcross180MixedDeltaFrames:true,immutableSnapshot:true,interpolatedPresentationDoesNotMutateResumeState:true,pristineRebuildExact:true,finiteMotion:true,uniqueSectionMembership:true,persistentRenderOwnership:true,boundedSectionAllocation:true}};
writeFileSync('/tmp/astra-round6-checkpoint/verification/fresh-state-proof.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
