import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
const suffix='prompts/demolition-playground/builds/gpt-6-astra-ultra/';
const candidate='/tmp/astra-round6-verification/checkout/'+suffix;
const baseline='/tmp/astra-round6-verification/baseline/'+suffix;
registerHooks({resolve(s,c,n){if(s==='three')return {url:'file://'+candidate+'vendor/three-0.180.0/three.module.js',shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const [{Simulation:CandidateSimulation},{Simulation:BaselineSimulation},{createBank:candidateBank},{createBank:baselineBank}]=await Promise.all([import(candidate+'src/simulation.js'),import(baseline+'src/simulation.js'),import(candidate+'src/bank.js'),import(baseline+'src/bank.js')]);
function fixture(Simulation,createBank){const scene=new THREE.Scene(),b={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(b,scene);return new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);}
function structure(sim){const captured=sim.capture();delete captured.eventTrack;return captured;}
function hash(v){return createHash('sha256').update(JSON.stringify(v,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v)).digest('hex');}
const routes={local:[[-15.7,19.65]],large:[[-15.7,19.65],[-11,19.65],[-6.3,19.65],[-4.8,10],[-4.8,14],[-4.8,17.8]]};
for(const [name,points]of Object.entries(routes)){
 const a=fixture(CandidateSimulation,candidateBank),b=fixture(BaselineSimulation,baselineBank),pristine=a.capture();
 assert.deepEqual(structure(a),structure(b));
 for(const [x,z]of points)for(const s of [a,b])assert.ok(s.placeCharge(new THREE.Vector3(x,1.3,z),0,0));
 a.detonate();b.detonate();let peakEvents=0,blasts=new Set(),kinds=new Set();const checkpoints=[];
 for(let i=0;i<900;i++){
  a.update(1/60);b.update(1/60);peakEvents=Math.max(peakEvents,a.eventTrack.events.length);
  for(const e of a.eventTrack.events){kinds.add(e.type);if(e.type==='blast')blasts.add(e.id);}
  if([0,30,90,180,300,600,899].includes(i)){assert.deepEqual(structure(a),structure(b),name+' differs at frame '+i);checkpoints.push({frame:i,sha256:hash(structure(a)),seed:a.seed,events:a.eventTrack.events.length});}
 }
 assert.equal(blasts.size,points.length,'ordinary staged blasts must have presentation births');
 const final=a.capture(),saved=structuredClone(final);a.restore(pristine);assert.deepEqual(a.capture(),pristine);a.restore(final);assert.deepEqual(a.capture(),saved);
 console.log(JSON.stringify({route:name,steps:900,step:1/60,structuralEquality:'exact',peakEvents,suppressedEvents:final.eventTrack.suppressed,blasts:blasts.size,kinds:[...kinds],retainedBodies:a.bank.bodies.length,checkpoints}));
}
