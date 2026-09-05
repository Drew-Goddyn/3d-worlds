import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s==='three')return {url:new URL('../../vendor/three-0.180.0/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import('../../src/bank.js');
const {Simulation}=await import('../../src/simulation.js');
const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);const sim=new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene),bank=sim.bank;
const advance=s=>{for(let i=0;i<s*60;i++)sim.update(1/60);};
const table=bank.bodies.find(b=>b.role==='table');
const book=bank.bodies.filter(b=>b.role==='masonry').sort((a,b)=>a.size.length()-b.size.length())[0];
const describe=b=>({id:b.id,role:b.role,state:b.state,x:b.x,y:b.y,z:b.z,bounds:bank.bounds(b)});
bank.release(book,new THREE.Vector3(),0);book.x=table.x;book.z=table.z;book.y=bank.bounds(table).max.y-book.bounds.min.y;advance(5);
const before={table:describe(table),book:describe(book)};
for(let i=0;i<6;i++){bank.hitContent(table,150,new THREE.Vector3(-1,0,0));advance(5);}
const after={table:describe(table),book:describe(book)};
console.log(JSON.stringify({before,after,bookUnchanged:JSON.stringify(before.book)===JSON.stringify(after.book)},null,2));
