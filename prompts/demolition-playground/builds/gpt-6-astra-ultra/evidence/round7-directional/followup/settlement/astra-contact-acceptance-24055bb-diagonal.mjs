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
 const bank=fixture([{pos:[0,10,0],size:[.06,.06,.06]},{pos:[.12,10,.12],size:[.06,.06,.06],vx:-20,vz:-20}]);
 const initial=state(bank);bank.step(1/60);const after=state(bank);
 const gravity=-12.5/60, contactImpulse=Math.hypot(after[0].vx,after[0].vy-gravity,after[0].vz);
 results.push({name:'fast diagonal fragment crosses a freely falling solid along both horizontal axes',initial,after,contactImpulse,passed:contactImpulse>1e-6,trajectory:'Both cube centers coincide at 0.006 s during this 1/60 s step; final projected intervals no longer overlap on x or z.'});
}
{
 const bank=fixture([{pos:[0,10,0],size:[.02,.1,2],vy:-1},{pos:[.08,10.08,0],size:[.06,.06,.06],vx:-10,vy:-20}]);
 const initial=state(bank);bank.step(1/60);const after=state(bank);
 const gravity=-12.5/60,contactImpulse=Math.hypot(after[0].vx,after[0].vy-(-1+gravity),after[0].vz);
 results.push({name:'falling diagonal fragment crosses thin vertical member along x and y',initial,after,contactImpulse,passed:contactImpulse>1e-6,trajectory:'At t=.005 s the fragment center reaches x=.03 and y=9.98 while the member spans x +/-.01 and y 9.945..10.045; their interiors intersect.'});
}
const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const out={source,results};
writeFileSync('/tmp/astra-contact-acceptance-24055bb-diagonal.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
