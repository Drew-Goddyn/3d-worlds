// Diagnostic equal-progress comparison; this is not a browser frame-rate test.
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
const root=process.argv[2];if(!root)throw Error('Pass the absolute Astra application directory');
registerHooks({resolve(s,c,n){return s==='three'?{url:'file://'+root+'/vendor/three-0.180.0/three.module.js',shortCircuit:true}:n(s,c);}});
const THREE=await import('three'),{createBank}=await import(root+'/src/bank.js'),{Simulation}=await import(root+'/src/simulation.js');
const scene=new THREE.Scene(),b={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(b,scene);const s=new Simulation({buildings:[b],props:[],crowd:[],pigeons:[]},scene);
const inputs=[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65],[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]];
for(const p of inputs)if(!s.placeCharge(new THREE.Vector3(...p),0,0))throw Error('Charge rejected');s.detonate();
const samples=[];let wall=performance.now(),cpu=process.cpuUsage();
for(let i=1;i<=900;i++){s.update(1/60);if([300,600,900].includes(i)){const now=performance.now(),used=process.cpuUsage(cpu);samples.push({sim:s.time,wallMs:now-wall,cpuMs:(used.user+used.system)/1000,bank:s.bank.stats});wall=now;cpu=process.cpuUsage();}}
const snapshot=JSON.stringify(s.capture(),(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);
console.log(JSON.stringify({method:'Bank-only normal charge API; 900 fixed 1/60 updates; no browser, WebGL draw or recording; Simulation.update still refreshes scene state. CPU and wall time reported separately.',root,inputs,samples,snapshotSha256:createHash('sha256').update(snapshot).digest('hex')},null,2));
