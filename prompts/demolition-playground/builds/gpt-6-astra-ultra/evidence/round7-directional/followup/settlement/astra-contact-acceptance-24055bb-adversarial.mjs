import {registerHooks} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='/Users/Drew/.codex/worktrees/d794/3d-worlds';
const app=root+'/prompts/demolition-playground/builds/gpt-6-astra-ultra';
registerHooks({resolve(s,c,n){return s==='three'?{url:'file://'+app+'/vendor/three-0.180.0/three.module.js',shortCircuit:true}:n(s,c);}});
const THREE=await import('three'),{BankPhysics}=await import('file://'+app+'/src/bank-physics.js');
function fixture(specs) {
 const bodies=specs.map((s,id)=>{const size=new THREE.Vector3(...s.size),bounds=new THREE.Box3(size.clone().multiplyScalar(-.5),size.clone().multiplyScalar(.5));return {id,node:0,role:'stone',origin:new THREE.Vector3(...s.pos),mass:s.mass??1,size,bounds,parts:[{collisionBounds:bounds.clone()}],fixed:false};});
 const recipe={building:{id:0,x:0,z:0},batches:[],nodes:[{id:0,level:0,below:-1,x:0,y:0,z:0,bodies:bodies.map(b=>b.id),supports:[],neighbors:[]}],bodies};
 const sim={floors:[],buildingStates:[],time:0,tonnage:0,random:()=>.5,_emit(){},_emitDust(){},_affectProps(){}};
 const bank=new BankPhysics(recipe,sim);sim.bank=bank;bank.nodes[0].state=2;
 for(let i=0;i<bodies.length;i++){const b=bank.bodies[i];b.state=1;for(const k of ['vx','vy','vz','wx','wy','wz'])b[k]=specs[i][k]??0;}
 return bank;
}
const overlap=(bank)=>{const a=bank.bounds(bank.bodies[0]),b=bank.bounds(bank.bodies[1]);return ['x','y','z'].map(k=>Math.max(0,Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k]))).reduce((a,b)=>a*b,1);};
const state=(bank)=>bank.bodies.map(b=>({id:b.id,x:b.x,y:b.y,z:b.z,vx:b.vx,vy:b.vy,vz:b.vz,state:b.state,min:bank.bounds(b).min.toArray(),max:bank.bounds(b).max.toArray()}));
const results=[];
{
 const bank=fixture([{pos:[-.6,20,0],size:[1,1,1],vx:1},{pos:[.6,20,0],size:[1,1,1],vx:-1}]);
 const initial=state(bank),frames=[];
 for(let i=1;i<=90;i++){bank.sim.time=i/60;bank.step(1/60);frames.push({frame:i,overlapVolume:overlap(bank),bodies:state(bank)});}
 results.push({name:'lateral freely moving solid cubes',criterion:'No persistent solid interpenetration; contact must exchange momentum',initial,passed:Math.max(...frames.map(f=>f.overlapVolume))<.01,maxOverlapVolume:Math.max(...frames.map(f=>f.overlapVolume)),overlapFrames:frames.filter(f=>f.overlapVolume>.01).length,crossedThrough:bank.bodies[0].x>bank.bodies[1].x,frames});
}
{
 const bank=fixture([{pos:[0,10,0],size:[2,.02,2],vy:-1},{pos:[0,10.08,0],size:[.06,.06,.06],vy:-20}]);
 const initial=state(bank);bank.step(1/60);const after=state(bank);
 results.push({name:'fast fragment crosses freely moving thin plate',criterion:'A fast solid cannot pass completely through another current solid in one fixed step',initial,after,passed:after[1].min[1]>=after[0].max[1]-.002,crossedCompletely:after[1].max[1]<after[0].min[1]});
}
{
 const angle=-Math.PI/4;
 const h=(2*Math.abs(Math.sin(angle))+.1*Math.abs(Math.cos(angle)))/2;
 const lowY=.23+h;
 const cubeX=-.3;
 const surfaceY=lowY-cubeX+.1/(2*Math.cos(angle));
 const bank=fixture([{pos:[0,lowY,0],size:[2,.1,2],vx:10},{pos:[cubeX,surfaceY+.055,0],size:[.1,.1,.1]}]);
 bank.bodies[0].rz=angle;
 const energy=()=>bank.bodies.reduce((s,b)=>s+12.5*b.mass*bank.center(b).y+.5*b.mass*(b.vx*b.vx+b.vy*b.vy+b.vz*b.vz)+b.mass/24*((b.size.y*b.size.y+b.size.z*b.size.z)*b.wx*b.wx+(b.size.x*b.size.x+b.size.z*b.size.z)*b.wy*b.wy+(b.size.x*b.size.x+b.size.y*b.size.y)*b.wz*b.wz),0);
 const initial=state(bank),before=energy();
 bank.step(1/60);
 const after=energy();
 results.push({name:'moving slope contacts a free fragment while its own edge touches ground',criterion:'Passive contact cannot create mechanical energy by treating a translating body as infinite mass',initial,afterBodies:state(bank),beforeEnergy:before,afterEnergy:after,increase:after-before,passed:after<=before+.001});
}
const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const out={source,script:'/tmp/astra-contact-acceptance-24055bb-adversarial.mjs',results};
writeFileSync('/tmp/astra-contact-acceptance-24055bb-adversarial.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({...out,results:results.map(({frames,...r})=>r)},null,2));
