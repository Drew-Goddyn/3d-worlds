import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=process.argv[2]??'/tmp/bank-round5-verify-528d415e/prompts/demolition-playground/builds/gpt-6-astra-ultra';
registerHooks({resolve(s,c,n){if(s==='three')return {url:pathToFileURL(root+'/vendor/three-0.180.0/three.module.js').href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {BankPhysics}=await import(pathToFileURL(root+'/src/bank-physics.js').href);
function fixture(specs) {
  const body=(s,id)=>{const size=new THREE.Vector3(...s.size),bounds=new THREE.Box3(size.clone().multiplyScalar(-.5),size.clone().multiplyScalar(.5));return {id,node:0,role:s.role??'stone',origin:new THREE.Vector3(...s.pos),mass:1,size,bounds,parts:[{collisionBounds:bounds.clone()}],fixed:s.fixed??false,cohesion:s.group??'section'};};
  const recipe={building:{x:0,z:0,id:0},batches:[],nodes:[{id:0,x:0,z:0,y:0,level:0,ix:0,iz:0,bodies:specs.map((_,i)=>i),supports:[],neighbors:[]}],bodies:specs.map(body)};
  const sim={floors:[],buildingStates:[],time:0,tonnage:0,random:()=>.5,_emitDust(){},_affectProps(){}};
  const bank=new BankPhysics(recipe,sim);sim.bank=bank;bank.nodes[0].state=2;
  for(const b of bank.bodies)if(!b.fixed){b.state=1;b.vx=b.vy=b.vz=b.wx=b.wy=b.wz=0;}
  return bank;
}
const bank=fixture([
  {pos:[0,4,0],size:[1,.4,1]}, {pos:[1,4,0],size:[1,.4,1]}, {pos:[2,4,0],size:[1,.4,1]},
  {pos:[1,3,0],size:[.3,.3,.3],group:'loose'},
]);
bank.cohesion.assemble([0,1,2]);bank.cohesion.sections[0].vy=-6;
const rows=[];
for(let frame=0;frame<=20;frame++) {
  const slab=bank.bounds(bank.bodies[1]),loose=bank.bounds(bank.bodies[3]);
  rows.push({frame,sectionBottom:slab.min.y,sectionTop:slab.max.y,looseBottom:loose.min.y,looseTop:loose.max.y,overlap:bank.solidContact(bank.bodies[1],bank.bodies[3]),section:bank.bodies[1].cluster,sectionVy:bank.bodies[1].vy,looseVy:bank.bodies[3].vy,passed:slab.max.y<loose.min.y});
  bank.sim.time+=1/60;bank.step(1/60);
}
const out={case:'connected slab falls onto a loose airborne architectural piece',firstOverlap:rows.find(r=>r.overlap),passedCompletelyThrough:rows.find(r=>r.passed),rows};
console.log(JSON.stringify(out,null,2));
if(out.passedCompletelyThrough)process.exitCode=1;
