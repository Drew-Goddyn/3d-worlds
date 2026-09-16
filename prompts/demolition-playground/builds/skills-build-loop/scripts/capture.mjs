import { G } from '../src/world.js';
import { sourceIdentity } from './source-identity.mjs';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve('review/build-01'),dir=resolve(root,'captures');await mkdir(dir,{recursive:true});await mkdir(resolve(root,'checks'),{recursive:true});
const env={...process.env,AGENT_BROWSER_SESSION:'blind-build-01',AGENT_BROWSER_SOCKET_DIR:'/tmp/blind-build-01-browser'};
const endpoint=process.env.CDP_URL||execFileSync('agent-browser',['get','cdp-url'],{env,encoding:'utf8'}).trim();
const browser=await chromium.connectOverCDP(endpoint),context=browser.contexts()[0],page=context.pages().find(p=>p.url().includes('4173'))||await context.newPage();
await page.setViewportSize({width:1440,height:900});
const evidence={method:'Playwright drives actual pointer, keyboard and form controls in an isolated agent-browser Chromium session. PNG sequences are timestamped samples of live runtime; no posed world transforms.',actions:[],captures:[],checks:[],errors:[],console:[],sequences:[]};
page.on('pageerror',e=>evidence.errors.push(String(e)));page.on('console',e=>{if(e.type()==='error'||e.type()==='warning')evidence.console.push({type:e.type(),text:e.text()});});
const state=()=>page.evaluate(G=>({stats:playground.stats(),mode:playground.playback.mode,camera:playground.view.camera.position.toArray(),target:playground.view.controls.target.toArray(),crane:{angle:playground.city.state[G.angle],length:playground.city.state[G.length],ball:Array.from(playground.city.state.slice(G.bx,G.bx+3)),velocity:Array.from(playground.city.state.slice(G.bvx,G.bvx+3))}}),G);
async function snap(name){const before=await state(),start=Date.now();await page.screenshot({path:resolve(dir,name+'.png')});const after=await state();evidence.captures.push({file:'captures/'+name+'.png',wallUTC:new Date(start).toISOString(),before,after});return after;}
async function action(name,fn){const before=await state();await fn();const after=await state();evidence.actions.push({name,before,after});}
async function fresh(){await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.playground?.ready);}
async function sequence(name,seconds,spacing=300){const started=Date.now(),files=[];let i=0;while(Date.now()-started<seconds*1000){const filename=`${name}-${String(i++).padStart(3,'0')}`;await snap(filename);files.push({file:`captures/${filename}.png`,elapsedMs:Date.now()-started});await page.waitForTimeout(spacing);}evidence.sequences.push({name,files,wallDurationMs:Date.now()-started});}
async function scrub(f){const range=page.locator('#timeline');await range.fill(String(Math.round(f)));await range.dispatchEvent('input');}
async function hash(){const bytes=await page.evaluate(()=>Array.from(new Uint8Array(playground.city.state.buffer)));return createHash('sha256').update(Buffer.from(bytes)).digest('hex');}
const mode=process.argv[2]||'ball';
await fresh();evidence.sourceIdentity=await sourceIdentity();evidence.environment=await page.evaluate(()=>playground.environment());
if(mode==='ball'){
 await snap('01-first-loaded-hero');
 await page.click('#play');const frozen=await hash();
 for(const [name,pos,target]of [
  ['02-bank-detail',[-35,23,46],[-19,9,19]],['03-brick-detail',[-51,23,15],[-29,8,-6]],['04-glass-detail',[35,38,18],[13,24,-11]],['05-water-rooftop',[-29,39,12],[-10,23,-14]]]){
  await page.evaluate(({pos,target})=>{playground.view.camera.position.set(...pos);playground.view.controls.target.set(...target);playground.view.controls.update();},{pos,target});await snap(name);
 }
 evidence.checks.push({name:'detail camera framing does not change city state',pass:await hash()===frozen,method:'Direct camera framing only; paused world hash unchanged.'});
 await page.click('#view');await page.click('#play');
 const ball=await page.evaluate(()=>{const v=playground.view,p=v.project(v.ball.position),e=v.camera.matrix.elements;const a=e[0],b=e[8],c=e[2],d=e[10],det=a*d-b*c;return {x:p.x,y:p.y,dx:240*b/det,dy:-240*a/det};});
 await action('Drag the hanging ball and release, using pointer events',async()=>{await page.mouse.move(ball.x,ball.y);await page.mouse.down();await page.mouse.move(ball.x+ball.dx,ball.y+ball.dy,{steps:14});await page.mouse.up();});
 await sequence('06-ball-strike',2.6,170);
 await action('Slow-motion button',()=>page.click('#slow'));await sequence('07-slow-collapse',3,240);
 await action('Camera orbit during slow motion',async()=>{await page.mouse.move(1090,510);await page.mouse.down();await page.mouse.move(1210,550,{steps:10});await page.mouse.up();});
 await page.click('#slow');await sequence('08-collapse-normal',5,350);
 await page.click('#view');await page.click('#play');const end=await page.evaluate(()=>playground.playback.history.end),saved=await hash();
 for(const [name,f]of [['09-scrub-back',.2],['10-scrub-forward',.7],['11-scrub-back-again',.35],['12-scrub-end',1]]){await action(name,()=>scrub(end*f));await snap(name);}
 evidence.checks.push({name:'scrub back and forward restores the saved numeric state',pass:await hash()===saved});
 const scrubFiles=[],scrubStarted=Date.now();for(const direction of ['back','forward'])for(let i=0;i<=12;i++){const fraction=direction==='back'?1-i/12:i/12;await scrub(end*fraction);const name=`12-timeline-${direction}-${String(i).padStart(2,'0')}`;await snap(name);scrubFiles.push({file:`captures/${name}.png`,elapsedMs:Date.now()-scrubStarted});}evidence.sequences.push({name:'Backward and forward timeline scrubbing',files:scrubFiles,wallDurationMs:Date.now()-scrubStarted});
 await action('Resume recorded future',async()=>{await scrub(end*.3);await page.click('#play');});await sequence('13-passive-replay',2,250);
 await action('Different action from a historical moment',async()=>{await scrub(end*.22);await page.click('#ball-tool');await page.locator('[data-hold="d"]').hover();await page.mouse.down();await page.waitForTimeout(500);await page.mouse.up();});await sequence('14-replacement-future',2,250);
 await action('Full rebuild using the reset-city button',()=>page.click('#reset-city'));await sequence('15-rebuild-reverse',5.8,350);
 await page.click('#view');await snap('16-restored-hero');
 evidence.checks.push({name:'reset-city reaches exact pristine numeric state',pass:await page.evaluate(()=>playground.city.state.every((v,i)=>Object.is(v,playground.city.initial[i])))});
 evidence.checks.push({name:'ball caused physical damage',pass:await page.evaluate(()=>playground.city.events.some(e=>e.cause==='ball'))});
}
if(mode==='charges'){
 await page.click('#charge-tool');
 await action('Invalid placement on an empty road',async()=>{await page.mouse.click(1240,710);});await snap('17-invalid-placement');
 const targets=await page.evaluate(()=>{const v=playground.view;return playground.city.plan.nodes.filter(n=>n.f===0&&[0,1,2].includes(n.b)).map(n=>({id:n.id,b:n.b,p:v.project(v.targetPosition(n.id))})).filter(n=>v.pick(n.p.x,n.p.y,'charges')===n.id&&n.p.y<700);});
 const selected=[];for(const b of [0,1,2])selected.push(...targets.filter(t=>t.b===b).slice(-2));
 for(const t of selected){await action(`Place charge on building ${t.b}, member ${t.id}`,()=>page.mouse.click(t.p.x,t.p.y));await snap(`18-charge-${selected.indexOf(t)+1}`);}
 evidence.checks.push({name:'manual placement accepted six charges',pass:await page.locator('#charge-count').textContent()==='6 / 6',targets:selected});
 await action('Fire the red plunger',()=>page.click('#detonate'));await sequence('19-staged-multi-building',6,220);
 await page.click('#slow');await sequence('20-multi-building-slow',3,300);await page.click('#slow');
 await action('Action camera toggle',()=>page.click('#action-cam'));await sequence('21-action-camera',2,350);await page.click('#view');
 await page.waitForTimeout(2000);await snap('22-settled-rubble');
 // Hold-to-slow and crane rotation / cable length use actual browser key events.
 await page.click('#ball-tool');await canvasFocus();
 let t0=await page.evaluate(()=>playground.city.stats().time);await page.keyboard.down('Space');await page.waitForTimeout(1200);await page.keyboard.up('Space');let t1=await page.evaluate(()=>playground.city.stats().time);
 evidence.checks.push({name:'Space hold advances about 0.12 simulation seconds during 1.2 wall seconds',delta:t1-t0,pass:t1-t0>.08&&t1-t0<.25});
 for(const key of ['a','d','w','s','ArrowUp']){await action(`Hold ${key}`,async()=>{await page.keyboard.down(key);await page.waitForTimeout(400);await page.keyboard.up(key);});}
 await page.click('#play');const paused=await hash();await action('Orbit, pan and zoom while paused',async()=>{await page.mouse.move(1130,460);await page.mouse.down();await page.mouse.move(1230,490,{steps:10});await page.mouse.up();await page.mouse.down({button:'right'});await page.mouse.move(1190,520,{steps:8});await page.mouse.up({button:'right'});await page.mouse.wheel(0,-150);});await page.click('#view');
 evidence.checks.push({name:'camera navigation and reset-view preserve paused city state',pass:await hash()===paused});
 evidence.checks.push({name:'reset-view returns exactly to the hero overview after orbit and pan',pass:await page.evaluate(()=>playground.view.camera.position.distanceTo({x:82,y:66,z:96})<1e-9&&playground.view.controls.target.distanceTo({x:-1,y:12,z:0})<1e-9)});
 for(const q of ['low','medium','high']){await page.selectOption('#quality',q);await snap(`23-quality-${q}`);evidence.checks.push({name:`${q} quality preserves authoritative state`,pass:await hash()===paused});}
}
async function canvasFocus(){await page.locator('#city').focus();}
if(mode==='water'){
 await page.click('#play');await page.evaluate(()=>{playground.view.camera.position.set(-27,36,12);playground.view.controls.target.set(-10,22,-14);playground.view.controls.update();});await page.click('#charge-tool');
 const p=await page.evaluate(()=>{const n=playground.city.plan.nodes.find(n=>n.water);return playground.view.project(playground.view.targetPosition(n.id));});
 await page.mouse.click(p.x,p.y);await snap('24-rooftop-charge');await page.click('#detonate');await sequence('25-water-burst',4,180);
 await page.click('#slow');await sequence('26-water-slow',2,200);await page.click('#slow');await page.waitForTimeout(6000);await snap('27-water-rubble');
 evidence.checks.push({name:'water changed debris momentum',pass:await page.evaluate(()=>playground.city.stats().waterImpulse>0),stats:await page.evaluate(()=>playground.stats())});
}
if(mode==='charges')for(const key of ['a','d','w','s','ArrowUp']){const a=evidence.actions.find(a=>a.name===`Hold ${key}`);const pass=['a','d'].includes(key)?Math.abs(a.after.crane.angle-a.before.crane.angle)>.01:['w','s'].includes(key)?Math.abs(a.after.crane.length-a.before.crane.length)>.1:a.after.stats.frames-a.before.stats.frames>Math.round((a.after.stats.time-a.before.stats.time)*60)+5;evidence.checks.push({name:`Actual ${key} control changes its physical crane state`,pass,before:a.before.crane,after:a.after.crane});}
evidence.final=await state();evidence.events=await page.evaluate(()=>playground.city.events);await writeFile(resolve(root,'checks',`browser-${mode}.json`),JSON.stringify(evidence,null,2));
console.log(JSON.stringify({mode,checks:evidence.checks,errors:evidence.errors,console:evidence.console,captures:evidence.captures.length,final:evidence.final},null,2));await browser.close();
