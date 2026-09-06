import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=process.argv[2]??'/tmp/bank-round5-verify-bafd8e32/prompts/demolition-playground/builds/gpt-6-astra-ultra';
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
const rows=[];
const bank=fixture([
  {pos:[0,4,0],size:[1,.4,1]}, {pos:[1,4,0],size:[1,.4,1]}, {pos:[2,4,0],size:[1,.4,1]},
  {pos:[1,5,0],size:[.3,.3,.3],group:'loose'},
]);
bank.cohesion.assemble([0,1,2]);bank.bodies[3].vy=-6;
for(let frame=0;frame<=20;frame++) {
  const a=bank.bounds(bank.bodies[1]),b=bank.bounds(bank.bodies[3]);
  rows.push({frame,sectionBottom:a.min.y,sectionTop:a.max.y,looseBottom:b.min.y,looseTop:b.max.y,solidOverlap:bank.solidContact(bank.bodies[1],bank.bodies[3]),section:bank.bodies[1].cluster,looseVy:bank.bodies[3].vy});
  bank.sim.time+=1/60;bank.step(1/60);
}
const output={case:'loose architectural piece falling onto a connected moving slab',solver:'unmodified BankPhysics and BankCohesion; minimal geometry fixture',initialSectionPieces:3,firstOverlap:rows.find(r=>r.solidOverlap),passedCompletelyThrough:rows.find(r=>r.looseTop<r.sectionBottom),rows};
const edgeBank=fixture([
  {pos:[2.9,6,0],size:[4,.4,.4]}, {pos:[2.9,6,.4],size:[4,.4,.4]}, {pos:[2.9,6,.8],size:[4,.4,.4]},
  {pos:[4.6,5,1.5],size:[.4,10,.3],fixed:true},
]);
edgeBank.cohesion.assemble([0,1,2]);edgeBank.cohesion.sections[0].vz=3;
const edgeRows=[];
for(let frame=0;frame<=40;frame++) {
  const target=edgeBank.bounds(edgeBank.bodies[3]),last=edgeBank.bounds(edgeBank.bodies[0]);
  edgeRows.push({frame,overlappingMembers:edgeBank.bodies.slice(0,3).filter(b=>edgeBank.solidContact(b,edgeBank.bodies[3])).map(b=>b.id),section:edgeBank.bodies[0].cluster,trailingEdge:last.min.z,obstacleFarEdge:target.max.z,passed:last.min.z>target.max.z});
  edgeBank.sim.time+=1/60;edgeBank.step(1/60);
}
const edge={case:'wide connected slab edge crosses a stationary solid in the adjacent spatial grid cell',movingCenterCell:[0,0],obstacleXCell:1,firstOverlap:edgeRows.find(r=>r.overlappingMembers.length),passedCompletelyThrough:edgeRows.find(r=>r.passed),rows:edgeRows};
console.log(JSON.stringify({movingContact:output,broadphaseEdge:edge},null,2));
if(output.passedCompletelyThrough||edge.passedCompletelyThrough)process.exitCode=1;
