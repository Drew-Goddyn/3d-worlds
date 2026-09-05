import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../../src/bank.js');
const {Simulation}=await import('../../src/simulation.js');
const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);const sim=new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene),bank=sim.bank;
const advance=s=>{for(let i=0;i<s*60;i++)sim.update(1/60);};
console.log(JSON.stringify([2.5,3,3.05].map(y=>({y,hit:bank.sphereHit(new THREE.Vector3(-14.7,y,17.15),1.7)?.body.role})),null,2));
