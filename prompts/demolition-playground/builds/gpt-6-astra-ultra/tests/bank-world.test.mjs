import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../src/bank.js');
const {Simulation}=await import('../src/simulation.js');
function fixture(){const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);return new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene);}
const advance=(sim,n)=>{for(let i=0;i<n;i++)sim.update(1/60);};

test('the court is an actual full-height void and galleries retain occupied depth',()=>{
  const sim=fixture(),b=sim.bank;
  assert.equal(b.bodies.filter(b=>b.role==='slab').some(s=>b.bounds(s).containsPoint(new THREE.Vector3(-11,4.3,16))),false);
  assert.equal(b.bodies.filter(b=>b.role==='slab').some(s=>b.bounds(s).containsPoint(new THREE.Vector3(-11,8.6,16))),false);
  for(const role of ['gallery','stair','vault-rib','vault-door','counter'])assert.ok(b.bodies.some(b=>b.role===role),role);
  const original=sim.capture();advance(sim,180);assert.deepEqual(b.capture().bodies,original.bank.bodies,'no spontaneous settling in the intact architecture');
});

test('floor fracture plates tile their complete load-bearing bay without overlap or lost material',()=>{
  const b=fixture().bank;
  let area=0;
  for(const batch of b.recipe.batches.filter(b=>Array.isArray(b.material))) {
    const p=batch.geometry.attributes.position;
    for(let i=0;i<p.count;i+=3) {
      if([0,1,2].some(j=>Math.abs(p.getY(i+j)-.19)>1e-6))continue;
      const ax=p.getX(i),az=p.getZ(i),bx=p.getX(i+1),bz=p.getZ(i+1),cx=p.getX(i+2),cz=p.getZ(i+2);
      area+=Math.abs((bx-ax)*(cz-az)-(bz-az)*(cx-ax))/2;
    }
  }
  assert.ok(Math.abs(area-4*11/3)<1e-5,`plate area ${area} must equal its bay area`);
});

test('a removed vault rib releases its own glazing but leaves remote supported roof intact',()=>{
  const sim=fixture(),b=sim.bank,rib=b.bodies.find(b=>b.role==='vault-rib');
  const attached=b.bodies.filter(p=>p.attachments?.includes(rib.id)&&p.minimumAttachments===2);
  const remote=b.bodies.find(p=>p.attachments&&!p.attachments.includes(rib.id)&&p.origin.distanceTo(rib.origin)>4);
  assert.ok(attached.length>0);assert.ok(remote);
  b.release(rib,new THREE.Vector3(-1,-.2,0),1);advance(sim,1);
  assert.ok(attached.every(p=>p.state===1));assert.equal(remote.state,0);
  assert.ok(b.bodies.filter(p=>p.role==='counter').every(p=>p.state===0),'roof connection loss cannot launch contents remotely');
});

test('roof attachment failure, retained ribs and new past actions restore exact independent futures',()=>{
  const sim=fixture(),b=sim.bank,pristine=sim.capture(),rib=b.bodies.find(b=>b.role==='vault-rib');
  b.damage(rib.origin,170,new THREE.Vector3(-1,-.2,0),true);advance(sim,20);
  const mid=sim.capture(),copy=structuredClone(mid);advance(sim,90);const future=sim.capture();
  sim.restore(mid);advance(sim,90);assert.deepEqual(sim.capture(),future);
  sim.restore(mid);b.damage(new THREE.Vector3(-5,6,17),120,new THREE.Vector3(1,0,0),true);advance(sim,90);
  assert.notDeepEqual(sim.capture(),future);assert.deepEqual(mid,copy);
  sim.restore(pristine);assert.deepEqual(sim.capture(),pristine);
});

test('a charge belongs to the selected roof pane and to settled rubble on a later intervention',()=>{
  const sim=fixture(),b=sim.bank,pane=b.bodies.find(b=>b.role==='glass'&&b.attachments);
  assert.ok(sim.placeCharge(pane.origin,0,b.nodes[pane.node].level,pane.id));
  assert.equal(sim.charges[0].bankBody,pane.id);
  const before=sim.capture();b.release(pane,new THREE.Vector3(1,0,0),2);advance(sim,40);
  assert.ok(b.chargePoint(sim.charges[0]).distanceTo(pane.origin)>.1,'charge follows the actual falling pane');
  sim.restore(before);assert.ok(b.chargePoint(sim.charges[0]).distanceTo(pane.origin)<1e-8);
  b.release(pane,new THREE.Vector3(1,0,0),2);
  b.release(b.bodies[pane.attachments[0]],new THREE.Vector3(1,0,0),2);advance(sim,900);
  const rubble=b.bodies.find(p=>p.state===2&&!p.content&&p.role!=='glass');
  assert.ok(rubble);const point=b.bounds(rubble).getCenter(new THREE.Vector3());
  assert.ok(sim.placeCharge(point,0,b.nodes[rubble.node].level,rubble.id));
  assert.equal(sim.charges.at(-1).bankBody,rubble.id);
  const snapshot=sim.capture();sim.detonate();advance(sim,120);const future=sim.capture();
  sim.restore(snapshot);sim.detonate();advance(sim,120);assert.deepEqual(sim.capture(),future);
});

test('street-level roof debris remains chargeable outside its original storey volume',()=>{
  const sim=fixture(),b=sim.bank,pane=b.bodies.find(p=>p.role==='glass'&&p.attachments);
  assert.ok(sim.placeCharge(pane.origin,0,2,pane.id));sim.detonate();advance(sim,900);
  const rubble=b.bodies.filter(p=>p.state===2&&!p.content&&b.nodes[p.node].level===2&&b.bounds(p).max.y<1.5);
  assert.ok(rubble.length>=6);
  for(const part of rubble.slice(0,6)) {
    const point=b.bounds(part).getCenter(new THREE.Vector3());
    assert.ok(sim.placeCharge(point,0,2,part.id),`roof-owned body ${part.id} at street level`);
    assert.equal(sim.charges.at(-1).bankBody,part.id);
  }
  assert.equal(sim.placeCharge(b.bounds(rubble[0]).getCenter(new THREE.Vector3()),0,2,rubble[0].id),false,'six-charge limit remains enforced');
});

test('a charge keeps its selected piece and local point when branching an interpolated replay',()=>{
  const sim=fixture(),b=sim.bank,pane=b.bodies.find(p=>p.role==='glass'&&p.attachments);
  sim.placeCharge(pane.origin,0,2,pane.id);sim.detonate();advance(sim,60);
  const earlier=sim.capture();advance(sim,3);const later=sim.capture();
  const falling=b.bodies.filter(p=>p.state===1&&p.role==='glass');assert.ok(falling.length>10);
  for(const part of falling) {
    sim.restore(earlier,later,.8);
    const displayed=part.bounds.getCenter(new THREE.Vector3()).applyMatrix4(b.presentationMatrices[part.id]);
    const anchor=b.anchorCharge(part.id,displayed);
    sim.restore(earlier);
    assert.ok(sim.placeCharge(b.chargePoint(anchor),0,b.nodes[part.node].level,part.id));
    const placed=sim.charges.at(-1);assert.equal(placed.bankBody,part.id);
    assert.ok(Math.hypot(placed.x-anchor.x,placed.y-anchor.y,placed.z-anchor.z)<1e-8);
  }
});
