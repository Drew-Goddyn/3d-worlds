// Repository-only fixed-step bank diagnostic; not native player footage.
import {registerHooks} from 'node:module';
import assert from 'node:assert/strict';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three'),{createBank}=await import('../../src/bank.js'),{Simulation}=await import('../../src/simulation.js');
const routes={front:[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65]],side:[[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]};routes.perturbed=routes.side.map((p,i)=>[p[0],p[1]+(i===1?.22:0),p[2]]);
const result={method:'Bank-only fixed 1/60 s updates, ordinary charge strength. No district or presentation. Not native player evidence.',routes:[]};
for(const [name,points]of Object.entries(routes)) {
 const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);const sim=new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene);
 for(const p of points)assert.ok(sim.placeCharge(new THREE.Vector3(...p),0,0));sim.detonate();const row={name,points,states:[]};let saved,copy,future;
 for(let i=0;i<480;i++) {
  sim.update(1/60);if(i===119){saved=sim.capture();copy=structuredClone(saved);}if(i===179)future=sim.capture();
  if([59,119,239,479].includes(i)){const st=sim.bank.structure;row.states.push({simulationSeconds:sim.time,stats:sim.bank.stats,bays:sim.bank.nodes.map(n=>{const f=st.frames[n.id];return {id:n.id,level:n.level,state:n.state,translation:f.p.clone().sub(f.rest).toArray(),angle:2*Math.acos(Math.min(1,Math.abs(f.q.w))),retainedConnected:st.members[n.id].filter(id=>sim.bank.bodies[id].state===0).length};}),roof:st.carriers.filter(n=>n.roof).map(n=>({id:n.id,state:n.state,translation:st.frames[n.id].p.clone().sub(st.frames[n.id].rest).toArray()}))});}
 }
 assert.deepEqual(saved,copy);sim.restore(saved);for(let i=0;i<60;i++)sim.update(1/60);assert.deepEqual(sim.capture(),future);row.restore='exact; saved snapshot unchanged';result.routes.push(row);
}
console.log(JSON.stringify(result,null,2));
