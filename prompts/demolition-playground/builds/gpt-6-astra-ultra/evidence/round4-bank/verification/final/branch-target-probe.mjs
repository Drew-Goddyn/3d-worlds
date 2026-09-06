import {registerHooks} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root='/Users/Drew/.codex/worktrees/80ca/3d-worlds/prompts/demolition-playground/builds/gpt-6-astra-ultra';
registerHooks({resolve(s,c,n){if(s==='three')return {url:`file://${root}/vendor/three-0.180.0/three.module.js`,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import(`file://${root}/src/bank.js`);
const {Simulation}=await import(`file://${root}/src/simulation.js`);
function fixture(){const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);return new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene);}
const advance=(s,n)=>{for(let i=0;i<n;i++)s.update(1/60);};

const sim=fixture(),b=sim.bank,pane=b.bodies.find(b=>b.role==='glass'&&b.attachments);
sim.placeCharge(pane.origin,0,2,pane.id);sim.detonate();advance(sim,60);const a=sim.capture();advance(sim,3);const next=sim.capture();
const results=[];
for(const body of b.bodies.filter(body=>body.role==='glass'&&body.state===1).slice(0,20)){
 sim.restore(a,next,.8);
 const batch=b.recipe.batches.find(batch=>batch.parts.some(part=>part.body===body.id)),part=batch.parts.find(part=>part.body===body.id);
 const point=new THREE.Vector3().fromBufferAttribute(batch.geometry.attributes.position,0).applyMatrix4(new THREE.Matrix4().compose(part.position,part.rotation,part.scale)).applyMatrix4(b.presentationMatrices[body.id]);
 // The native pointer handler picks the interpolated display, then branches
 // by restoring the preceding snapshot before it places the selected charge.
 sim.restore(a);
 const distanceToResumedBody=b.bounds(body).distanceToPoint(point),accepted=sim.placeCharge(point,0,b.nodes[body.node].level,body.id);
 results.push({selectedBody:body.id,selectedRole:body.role,point:point.toArray(),distanceToResumedBody,accepted,chargedBody:sim.charges.at(-1)?.bankBody,chargedRole:b.bodies[sim.charges.at(-1)?.bankBody]?.role});
}
const output={savedTime:a.time,nextTime:next.time,alpha:.8,attempts:results.length,mismatches:results.filter(r=>r.accepted&&r.selectedBody!==r.chargedBody),results};
writeFileSync('/tmp/astra-round4-verification/final/branch-target-probe.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
