import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {BankPhysics}=await import('../src/bank-physics.js');
function fixture(specs) {
  const body=(s,id)=>{const size=new THREE.Vector3(...s.size),bounds=new THREE.Box3(size.clone().multiplyScalar(-.5),size.clone().multiplyScalar(.5));return {id,node:0,role:s.role??'stone',origin:new THREE.Vector3(...s.pos),mass:1,size,bounds,parts:[{collisionBounds:bounds.clone()}],fixed:s.fixed??false,cohesion:s.group??'section'};};
  const recipe={building:{x:0,z:0,id:0},batches:[],nodes:[{id:0,x:0,z:0,y:0,level:0,ix:0,iz:0,bodies:specs.map((_,i)=>i),supports:[],neighbors:[]}],bodies:specs.map(body)};
  const sim={floors:[],buildingStates:[],time:0,tonnage:0,random:()=>.5,_emitDust(){},_affectProps(){}};
  const bank=new BankPhysics(recipe,sim);sim.bank=bank;bank.nodes[0].state=2;
  for(const b of bank.bodies)if(!b.fixed){b.state=1;b.vx=b.vy=b.vz=b.wx=b.wy=b.wz=0;}
  return bank;
}

test('loose masonry transfers impact into a connected falling floor instead of crossing it',()=>{
  const bank=fixture([{pos:[0,4,0],size:[1,.4,1]},{pos:[1,4,0],size:[1,.4,1]},{pos:[2,4,0],size:[1,.4,1]},{pos:[1,5,0],size:[.3,.3,.3],group:'loose'}]);
  bank.cohesion.assemble([0,1,2]);bank.bodies[3].vy=-6;let transferred=false;
  for(let i=0;i<21;i++){
    bank.sim.time+=1/60;bank.step(1/60);
    assert.ok(bank.bounds(bank.bodies[3]).min.y>=bank.bounds(bank.bodies[1]).max.y-.01,'the incoming piece cannot pass through the moving floor');
    if(bank.bodies[3].vy-bank.bodies[1].vy>-3)transferred=true;
  }
  assert.ok(transferred,'contact must exchange momentum');
});
test('a connected floor edge collides across a spatial-cell boundary',()=>{
  const bank=fixture([{pos:[2.9,6,0],size:[4,.4,.4]},{pos:[2.9,6,.4],size:[4,.4,.4]},{pos:[2.9,6,.8],size:[4,.4,.4]},{pos:[4.6,5,1.5],size:[.4,10,.3],fixed:true}]);
  bank.cohesion.assemble([0,1,2]);bank.cohesion.sections[0].vz=3;
  for(let i=0;i<40;i++){bank.sim.time+=1/60;bank.step(1/60);}
  assert.ok(bank.bounds(bank.bodies[0]).min.z<bank.bounds(bank.bodies[3]).max.z,'the whole slab cannot pass through the obstacle');
  assert.ok(bank.bodies.slice(0,3).some(b=>b.cluster<0),'the real edge contact must fracture construction');
});
for(const lowerSection of [false,true])test(lowerSection?'two connected sections exchange impact without crossing':'a connected falling floor transfers impact to loose airborne rubble',()=>{
  const specs=[{pos:[0,4,0],size:[1,.4,1]},{pos:[1,4,0],size:[1,.4,1]},{pos:[2,4,0],size:[1,.4,1]}];
  if(lowerSection)for(let x=0;x<3;x++)specs.push({pos:[x,3,0],size:[1,.4,1],group:'lower'});
  else specs.push({pos:[1,3,0],size:[.3,.3,.3],group:'loose'});
  const bank=fixture(specs);bank.cohesion.assemble([0,1,2]);if(lowerSection)bank.cohesion.assemble([3,4,5]);bank.cohesion.sections[0].vy=-6;
  const struck=bank.bodies[lowerSection?4:3];let impact=false;
  for(let i=0;i<21;i++){
    bank.sim.time+=1/60;bank.step(1/60);
    assert.ok(bank.bounds(bank.bodies[1]).max.y>=bank.bounds(struck).min.y,'connected construction cannot pass completely through the struck piece');
    if(struck.vy < -12.5*(i+1)/60-1)impact=true; // faster than gravity-only free fall
  }
  assert.ok(impact,'the receiving construction must take the contact impulse');
});
