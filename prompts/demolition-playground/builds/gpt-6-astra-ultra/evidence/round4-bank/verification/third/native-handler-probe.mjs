import {registerHooks} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root='/Users/Drew/.codex/worktrees/80ca/3d-worlds/prompts/demolition-playground/builds/gpt-6-astra-ultra';
registerHooks({resolve(s,c,n){if(s==='three')return {url:`file://${root}/vendor/three-0.180.0/three.module.js`,shortCircuit:true};return n(s,c);}});
const THREE=await import('three');
const {createBank}=await import(`file://${root}/src/bank.js`);
const {Simulation}=await import(`file://${root}/src/simulation.js`);
function fixture(){const scene=new THREE.Scene(),building={id:0,name:'Bank',kind:'stone',x:-11,z:14,width:12,depth:11,height:12.9,storeys:3,storeyHeight:4.3,floors:[]};createBank(building,scene);return new Simulation({buildings:[building],props:[],crowd:[],pigeons:[]},scene);}
const advance=(s,n)=>{for(let i=0;i<n;i++)s.update(1/60);};

const {readFileSync}=await import('node:fs');const {runInNewContext}=await import('node:vm');const {createHash}=await import('node:crypto');
const source=readFileSync(root+'/src/main.js','utf8');
const pickSource=source.slice(source.indexOf('function pick(event){'),source.indexOf("canvas.addEventListener('pointerdown'"));
const branchSource=source.slice(source.indexOf('function branch(){'),source.indexOf('function toggleRewind(){'));
const handlerSource=source.slice(source.indexOf("canvas.addEventListener('pointerup'"),source.indexOf("canvas.addEventListener('contextmenu'"));
assert.ok(pickSource&&branchSource&&handlerSource);
const sim=fixture(),b=sim.bank,pane=b.bodies.find(b=>b.role==='glass'&&b.attachments);
sim.placeCharge(pane.origin,0,2,pane.id);sim.detonate();advance(sim,60);const a=sim.capture();advance(sim,3);const next=sim.capture();
const results=[];
for(const body of b.bodies.filter(body=>body.role==='glass'&&body.state===1).slice(0,20)){
 sim.restore(a,next,.8);
 const batch=b.recipe.batches.find(batch=>batch.parts.some(part=>part.body===body.id)),instanceId=batch.parts.findIndex(part=>part.body===body.id),part=batch.parts[instanceId];
 const local=new THREE.Vector3().fromBufferAttribute(batch.geometry.attributes.position,0).applyMatrix4(new THREE.Matrix4().compose(part.position,part.rotation,part.scale));
 const point=local.clone().applyMatrix4(b.presentationMatrices[body.id]);
 const hit={object:batch.mesh,instanceId,point};let handler,recorded=0,truncated=null;
 const context={THREE,simulation:sim,city:sim.city,camera:{},pointer:new THREE.Vector2(),hitGroups:[b.recipe.root],
   canvas:{style:{},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),addEventListener:(name,cb)=>{assert.equal(name,'pointerup');handler=cb;}},
   raycaster:{setFromCamera(){},intersectObjects(){return [hit];}},pointerDown:{x:50,y:50,button:0},tool:'charge',resetting:false,
   cursor:a.time+(next.time-a.time)*.8,history:{end:next.time,sample:()=>({a,b:next,timeA:a.time}),truncate:t=>{truncated=t;}},
   crane:{restore(){}},rewinding:true,paused:true,recordAccumulator:7,sound(){},toast(){},$:()=>({hidden:false}),record(){recorded++;},updateUI(){}};
 runInNewContext(pickSource+'\n'+branchSource+'\n'+handlerSource,context);
 handler({clientX:50,clientY:50});const charge=sim.charges.at(-1);
 const localError=charge?Math.hypot(charge.x-local.x,charge.y-local.y,charge.z-local.z):null;
 const result={selectedBody:body.id,accepted:!!charge,chargedBody:charge?.bankBody,localError,truncated,recorded};results.push(result);
 assert.equal(charge?.bankBody,body.id);assert.ok(localError<1e-9);assert.equal(truncated,a.time);assert.equal(recorded,1);assert.equal(sim.time,a.time);assert.equal(context.recordAccumulator,0);
}
const output={source:'src/main.js',nativePickAndBranchAndPointerHandlerExecuted:true,raycastInput:'exact rendered mesh vertex supplied as a hit; no browser runtime',snippetSha256:createHash('sha256').update(pickSource+branchSource+handlerSource).digest('hex'),savedTime:a.time,nextTime:next.time,alpha:.8,attempts:results.length,wrongAttachments:results.filter(r=>r.selectedBody!==r.chargedBody).length,maximumLocalError:Math.max(...results.map(r=>r.localError)),results};
writeFileSync('/tmp/astra-round4-verification/third/native-handler-probe.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
