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
const specs=[{pos:[-.6,20,0],size:[1,1,1],vx:1},{pos:[.6,20,0],size:[1,1,1],vx:-1}];
const bank=fixture(specs),pristine=bank.capture(),pristineCopy=structuredClone(pristine);
for(let i=0;i<10;i++)bank.step(1/60);
const snapshot=bank.capture(),copy=structuredClone(snapshot);
for(let i=0;i<80;i++)bank.step(1/60);
const future=bank.capture();
const fresh=fixture(specs);fresh.restore(snapshot);for(let i=0;i<80;i++)fresh.step(1/60);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
results.push({name:'fresh continuation from a moving lateral contact state',passed:same(future,fresh.capture())});
results.push({name:'captured past remains immutable after continuation',passed:same(snapshot,copy)});
bank.restore(pristine);
results.push({name:'pristine body state restores exactly after contact and continuation',passed:same(bank.capture(),pristineCopy)});
const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const out={source,results,limits:'Synthetic bank fixture only; native simulation event history, rolling minute, retained future and permanent rebuild remain subject to the unchanged full suite and native inspection.'};
writeFileSync('/tmp/astra-contact-acceptance-24055bb-restoration.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
