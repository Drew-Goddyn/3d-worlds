import { sourceIdentity } from './source-identity.mjs';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
await mkdir('review/build-01/checks',{recursive:true});
const env={...process.env,AGENT_BROWSER_SESSION:'blind-build-01',AGENT_BROWSER_SOCKET_DIR:'/tmp/blind-build-01-browser'};
const endpoint=process.env.CDP_URL||execFileSync('agent-browser',['get','cdp-url'],{env,encoding:'utf8'}).trim();
const browser=await chromium.connectOverCDP(endpoint),page=browser.contexts()[0].pages().find(p=>p.url().includes('4173'));
await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.playground?.ready);await page.click('#play');
const result=await page.evaluate(async()=>{
 const {city:c,playback:p,view:v}=playground,h=p.history;p.mode='paused';h.seek(0);
 const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(x=>x.toString(16).padStart(2,'0')).join('');
 async function signature(){v.render(0);v.scene.updateMatrixWorld(true);const data=[];let instances=0;
  v.scene.traverse(o=>{if(o.isMesh||o.isLine){data.push(o.id,o.visible?1:0,...o.matrixWorld.elements);if(o.isInstancedMesh){data.push(o.count,...o.instanceMatrix.array.slice(0,o.count*16));instances+=o.count;if(o.geometry.attributes.opacity)data.push(...o.geometry.attributes.opacity.array.slice(0,o.count));}else if(o.isLine)data.push(...o.geometry.attributes.position.array);if(o.material?.opacity!==undefined)data.push(o.material.opacity);if(o.material?.emissiveIntensity!==undefined)data.push(o.material.emissiveIntensity);if(o.material?.uniforms?.uTime)data.push(o.material.uniforms.uTime.value);}});
  return {worldHash:await digest(c.state.slice().buffer),visibleInputHash:await digest(new Float32Array(data).buffer),renderedInstances:instances,stats:playground.stats()};
 }
 const pristine=await signature();for(const node of [0,1,2,3,4,5])h.action({type:'charge',node});h.action({type:'detonate'});
 const saved=[];for(let i=0;i<1400;i++){h.advance();if(i===239){for(const node of [48,49,50,54,55,56])h.action({type:'charge',node});h.action({type:'detonate'});}if([60,180,420,900,1399].includes(i))saved.push({frame:h.cursor,signature:await signature()});}
 const comparisons=[];for(const savedFrame of [...saved].reverse().concat(saved)){h.seek(savedFrame.frame);const actual=await signature();comparisons.push({frame:savedFrame.frame,time:c.stats().time,worldExact:actual.worldHash===savedFrame.signature.worldHash,visibleInputsExact:actual.visibleInputHash===savedFrame.signature.visibleInputHash,expected:savedFrame.signature,actual});}
 h.seek(0);const restored=await signature();return {method:'Accelerated actual application simulation and fixed-camera rendering. SHA-256 over all world state bytes and over Float32 GPU inputs: rendered instance matrices/counts, object world matrices/visibility, cable vertices, dust opacities/time and beacon intensity. Includes facade group motion, particles, water tank, crowd and pigeons. Does not compare final GPU pixels or establish visual taste.',comparisons,pristine,restored,pristineWorldExact:pristine.worldHash===restored.worldHash,pristineVisibleExact:pristine.visibleInputHash===restored.visibleInputHash,createdFragmentsAtEnd:saved.at(-1).signature.stats.createdFragments,poolCapacity:c.capacity};
});
result.sourceIdentity=await sourceIdentity();
await writeFile('review/build-01/checks/render-restoration.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({comparisons:result.comparisons.map(c=>({frame:c.frame,world:c.worldExact,visible:c.visibleInputsExact})),pristineWorld:result.pristineWorldExact,pristineVisible:result.pristineVisibleExact,createdFragmentsAtEnd:result.createdFragmentsAtEnd,poolCapacity:result.poolCapacity},null,2));await browser.close();
