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
const out={};
{
const sim=fixture(),b=sim.bank,pane=b.bodies.find(b=>b.role==='glass'&&b.attachments);
out.initialRoofCharge={body:pane.id,accepted:sim.placeCharge(pane.origin,0,b.nodes[pane.node].level,pane.id)};
sim.detonate();advance(sim,900);
const candidates=b.bodies.filter(b=>b.state===2&&!b.fixed&&!b.content&&sim.bank.nodes[b.node].level===2).sort((a,c)=>b.bounds(a).getCenter(new THREE.Vector3()).y-b.bounds(c).getCenter(new THREE.Vector3()).y);
out.roofRubble=[]; const settled=sim.capture(), targets=[];
for(const body of candidates.slice(0,10)) {
  const batch=b.recipe.batches.find(batch=>batch.parts.some(part=>part.body===body.id));
  const part=batch.parts.find(part=>part.body===body.id);
  const partMatrix=new THREE.Matrix4().compose(part.position,part.rotation,part.scale);
  const point=new THREE.Vector3().fromBufferAttribute(batch.geometry.attributes.position,0).applyMatrix4(partMatrix).applyMatrix4(b.bodyMatrix(body));
  targets.push({body,point}); sim.restore(settled);
  out.roofRubble.push({id:body.id,role:body.role,state:body.state,level:b.nodes[body.node].level,point:point.toArray(),nearestFloorFound:!!sim._nearestFloor(point,0,b.nodes[body.node].level),accepted:sim.placeCharge(point,0,b.nodes[body.node].level,body.id)});
}
assert.equal(out.roofRubble.length,10);assert.ok(out.roofRubble.every(r=>r.accepted),'all ten independently attempted current surfaces must accept a charge');
sim.restore(settled);
for(const {body,point} of targets.slice(0,6)){assert.ok(sim.placeCharge(point,0,2,body.id));assert.equal(sim.charges.at(-1).bankBody,body.id);assert.ok(b.chargePoint(sim.charges.at(-1)).distanceTo(point)<1e-9);}
assert.equal(sim.charges.length,6);assert.equal(sim.placeCharge(targets[6].point,0,2,targets[6].body.id),false);out.sixChargeLimitPreserved=true;
const charged=sim.capture(),copy=structuredClone(charged);sim.detonate();advance(sim,120);const future=sim.capture();assert.equal(sim.charges.length,0);sim.restore(charged);sim.detonate();advance(sim,120);assert.deepEqual(sim.capture(),future);assert.deepEqual(charged,copy);out.rubbleChargeDetonationReplayAndImmutability=true;
out.afterRoofCharge={bodies:b.bodies.length,stats:b.stats};
}
{
const high=fixture(),low=fixture();low.setQuality('low');
for(const s of [high,low]){const pane=s.bank.bodies.find(b=>b.role==='glass'&&b.attachments);s.placeCharge(pane.origin,0,2,pane.id);s.detonate();advance(s,120);}
assert.deepEqual(high.capture(),low.capture());out.bankQualityIndependence=true;
const mid=high.capture(),immutable=structuredClone(mid);advance(high,90);const expected=high.capture();high.restore(mid);advance(high,90);assert.deepEqual(high.capture(),expected);assert.deepEqual(mid,immutable);out.roofReplayAndImmutability=true;
}
writeFileSync('/tmp/astra-round4-verification/final/probe.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
