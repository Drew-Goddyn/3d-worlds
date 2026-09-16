import { sourceIdentity } from './source-identity.mjs';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import os from 'node:os';
const env={...process.env,AGENT_BROWSER_SESSION:'blind-build-01',AGENT_BROWSER_SOCKET_DIR:'/tmp/blind-build-01-browser'};
const endpoint=process.env.CDP_URL||execFileSync('agent-browser',['get','cdp-url'],{env,encoding:'utf8'}).trim();
const browser=await chromium.connectOverCDP(endpoint),context=browser.contexts()[0],page=context.pages().find(p=>p.url().includes('4173'))||await context.newPage();
const out=resolve('review/build-01/checks');await mkdir(out,{recursive:true});await mkdir(resolve('review/build-01/captures'),{recursive:true});await page.setViewportSize({width:1440,height:900});
const report={method:'Actual requestAnimationFrame wall intervals, no screenshots during performance samples. Workloads call the same History actions used by the UI. Long retention is separately accelerated and does not establish frame rate.',hardware:{platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0]?.model,logicalCores:os.cpus().length,totalMemoryGiB:os.totalmem()/1024**3},errors:[],samples:[]};page.on('pageerror',e=>report.errors.push(String(e)));
async function fresh(){await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.playground?.ready);}
async function start(){return page.evaluate(()=>performance.now());}
async function finish(name,from){const data=await page.evaluate(from=>({frames:playground.metrics.frames.filter(f=>f.wall>=from),stats:playground.stats(),environment:playground.environment()}),from);
 const sorted=data.frames.map(f=>f.ms).sort((a,b)=>a-b),percent=q=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))];report.samples.push({name,count:sorted.length,medianMs:percent(.5),p95Ms:percent(.95),p99Ms:percent(.99),maxMs:sorted.at(-1),over33ms:sorted.filter(x=>x>33.34).length,over50ms:sorted.filter(x=>x>50).length,meanWorkMs:data.frames.reduce((a,f)=>a+f.work,0)/data.frames.length,peakActive:Math.max(...data.frames.map(f=>f.active)),...data});console.log(name,report.samples.at(-1).medianMs,report.samples.at(-1).p95Ms);}
async function charge(ids){await page.evaluate(ids=>{for(const node of ids)playground.playback.act({type:'charge',node});playground.playback.act({type:'detonate'});},ids);}
await fresh();report.sourceIdentity=await sourceIdentity();report.environment=await page.evaluate(()=>playground.environment());
let t=await start();await page.waitForTimeout(4000);await finish('pristine-high',t);
t=await start();await charge([0,1,2,3,4,5]);await page.waitForTimeout(1400);await charge([24,25,26,27,28,29]);await page.waitForTimeout(1400);await charge([48,49,50,54,55,56]);await page.waitForTimeout(9000);await finish('three-building-collapse-high',t);
await page.click('#play');await page.evaluate(()=>playground.playback.history.seekTime(7));await page.click('#slow');await page.click('#play');t=await start();await page.waitForTimeout(4000);await finish('slow-motion-replay-high',t);
await page.click('#slow');await page.click('#rewind');t=await start();await page.waitForTimeout(3000);await finish('rewind-high',t);
await page.selectOption('#quality','low');await page.click('#play');t=await start();await page.waitForTimeout(4000);await finish('recorded-collapse-low',t);
// Entire-run history test advances the real simulation, with rendering paused between chunks.
await fresh();await page.click('#play');await page.evaluate(()=>playground.playback.history.seek(0));
const initial=await page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',playground.city.state.slice().buffer))).map(x=>x.toString(16).padStart(2,'0')).join(''));
const begin=Date.now();report.retention=await page.evaluate(async()=>{
 const {city:c,playback:p,view:v}=playground,h=p.history;p.mode='paused';
 const digest=async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',c.state.slice().buffer))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const advance=seconds=>{for(let i=0;i<seconds*60;i++)h.advance();};
 const charges=ids=>{for(const node of ids)h.action({type:'charge',node});h.action({type:'detonate'});};
 charges([0,1,2,3,4,5]);advance(4);charges([48,49,50,54,55,56]);advance(61);
 const early={frame:h.cursor,hash:await digest(),stats:playground.stats()};
 charges([24,25,26,27,28,29]);advance(3);charges([c.plan.nodes.find(n=>n.water).id]);advance(23);
 const late={frame:h.cursor,hash:await digest(),stats:playground.stats()},end=h.end,bytes=h.bytes;
 const probes=[];
 for(const f of [early.frame,400,late.frame,900,early.frame,late.frame]){h.seek(f);v.render(0);probes.push({frame:f,time:c.stats().time,hash:await digest(),stats:playground.stats()});}
 h.seek(late.frame);p.mode='paused';return {method:'Accelerated synchronous browser History.advance calls. 60 actual simulation steps per simulated second; no displayed-clock edits.',simulationSeconds:c.stats().time,wallTimingSeparate:true,early,late,probes,historyBytes:bytes,end,defaultCapacity:c.capacity};
});report.retention.wallExecutionMs=Date.now()-begin;
await page.screenshot({path:resolve('review/build-01/captures/28-over-90-seconds.png')});
await page.click('#reset-city');report.retention.resetFrames=[];
for(let i=0;i<7;i++){await page.waitForTimeout(850);const file=`29-full-history-reset-${i}.png`;await page.screenshot({path:resolve('review/build-01/captures',file)});report.retention.resetFrames.push({file:'captures/'+file,stats:await page.evaluate(()=>playground.stats())});}
const finalHash=await page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',playground.city.state.slice().buffer))).map(x=>x.toString(16).padStart(2,'0')).join(''));
report.retention.pristineHash=initial;report.retention.resetHash=finalHash;report.retention.exactReset=initial===finalHash;
report.retention.byteMeaning='Typed-array payload bytes for bidirectional lossless state deltas plus sparse checkpoints. Excludes JS object/array overhead, renderer memory, event trace and temporary allocations. No history eviction.';
await writeFile(resolve(out,'performance-retention.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({samples:report.samples.map(({frames,...rest})=>rest),retention:report.retention,errors:report.errors},null,2));await browser.close();
