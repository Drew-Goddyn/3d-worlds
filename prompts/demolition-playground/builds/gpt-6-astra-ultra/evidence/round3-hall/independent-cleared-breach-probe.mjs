import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s.startsWith('three/addons/'))return {url:new URL('../../vendor/three-0.180.0/addons/'+s.slice(13),import.meta.url).href,shortCircuit:true};if(s==='three')return {url:new URL('../../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../../src/bank.js');
const {Simulation}=await import('../../src/simulation.js');
const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);const sim=new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene),bank=sim.bank;
const advance=s=>{for(let i=0;i<s*60;i++)sim.update(1/60);};
const {Crane}=await import('../../src/crane.js');
const table=bank.bodies.find(b=>b.role==='table'),path=new THREE.Box3(new THREE.Vector3(table.x-1.71,1.29,16),new THREE.Vector3(table.x+1.71,4.81,23));
const removed=[];
for(const b of bank.bodies)if(!b.fixed&&!b.content&&bank.bounds(b).intersectsBox(path)){bank.release(b,new THREE.Vector3(),0);b.x+=100;removed.push({id:b.id,role:b.role});}
const crane=new Crane(scene),city={buildings:[building]};
crane.yaw=crane.goalYaw=Math.atan2(table.z-crane.base.z,table.x-crane.base.x);crane.reach=crane.goalReach=Math.hypot(table.x-crane.base.x,table.z-crane.base.z);crane.length=crane.goalLength=39;crane.updateAnchor();crane.ballPosition.set(table.x,3.11,20);crane.velocity.set(0,0,-8);
const hits=[],original=bank.hitContent.bind(bank);
bank.hitContent=(b,p,d)=>{hits.push({role:b.role,id:b.id,power:p,ball:crane.ballPosition.toArray()});return original(b,p,d);};
for(let i=0;i<45;i++)crane.update(1/60,city,sim);
console.log(JSON.stringify({setup:'Synthetic cleared breach: moved architectural obstacles along swept sphere corridor; preserved furnishings; normal Crane.update with actual ball radius. Does not certify user demolition path.',radius:crane.ball.geometry.parameters.radius,removed,hits,tableState:table.state,ball:crane.ballPosition.toArray()},null,2));
