import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s.startsWith('three/addons/'))return {url:new URL('../../vendor/three-0.180.0/addons/'+s.slice(13),import.meta.url).href,shortCircuit:true};if(s==='three')return {url:new URL('../../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../../src/bank.js');
const {Simulation}=await import('../../src/simulation.js');
const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);const sim=new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene),bank=sim.bank;
const advance=s=>{for(let i=0;i<s*60;i++)sim.update(1/60);};
const {Crane}=await import('../../src/crane.js');
const crane=new Crane(scene),hits=[];let phase='setup';
const original=bank.hitContent.bind(bank);bank.hitContent=(b,p,d)=>{hits.push({phase,time:sim.time,id:b.id,role:b.role,ball:crane.ballPosition.toArray(),content:[b.x,b.y,b.z],power:p});return original(b,p,d);};
const city={buildings:[building]},contacts=[];const sphereHit=bank.sphereHit.bind(bank);bank.sphereHit=(p,r)=>{const hit=sphereHit(p,r);if(hit)contacts.push({time:sim.time,role:hit.body.role,id:hit.body.id,powerBeforeTransfer:Math.min(150,26+crane.velocity.length()*5)});return hit;};
for(let i=0;i<1200;i++){if(i%240===0)crane.aimAt(new THREE.Vector3(-14.7,2,17.15),2.1);phase='crane';crane.update(1/60,city,sim);phase='world';sim.update(1/60);}
console.log(JSON.stringify({radius:crane.ball.geometry.parameters.radius,hits,contacts,stats:bank.stats,ball:crane.ballPosition.toArray()},null,2));
