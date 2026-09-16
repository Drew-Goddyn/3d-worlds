import {connect,fresh} from './round3-browser.mjs';
import {sourceIdentity} from './source-identity.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const [phase,scene]=process.argv.slice(2),{browser,page}=await connect(),root=resolve('review/build-03'),captures=resolve(root,'captures');
await mkdir(captures,{recursive:true});await mkdir(resolve(root,'checks'),{recursive:true});
const data={sourceIdentity:await sourceIdentity(),browserLaunchArgs:process.env.AGENT_BROWSER_ARGS||'',scene,phase,startedUTC:new Date().toISOString(),method:'Actual whole-viewport pointer, keyboard and range controls. Initial camera framing uses the camera API; physical state is never posed. Fixed cameras during motion segments. No added overlays or speed editing.',actions:[],stills:[],errors:[],checks:[]};page.on('pageerror',e=>data.errors.push(String(e)));
const state=()=>page.evaluate(()=>({wall:performance.now(),time:playground.playback.time,stats:playground.stats(),mode:playground.playback.mode,speed:playground.playback.speed,camera:playground.view.camera.position.toArray(),target:playground.view.controls.target.toArray()}));
async function action(name,fn){const before=await state();await fn();data.actions.push({name,before,after:await state()});}
async function click(id){await action('Click '+id,()=>page.click('#'+id));}
async function shot(name){await page.screenshot({path:resolve(captures,name+'.png')});data.stills.push({file:name+'.png',state:await state()});}
async function frame(pos,target){await page.evaluate(({pos,target})=>{const v=playground.view;v.controls.enableDamping=false;v.controls.update();v.camera.position.set(...pos);v.controls.target.set(...target);v.controls.update();v.controls.enableDamping=true;},{pos,target});await page.waitForTimeout(100);}
async function place(id){
 const target=await page.evaluate(id=>{const v=playground.view,p=v.project(v.targetPosition(id));return {...p,picked:v.pick(p.x,p.y,'charges'),canvas:document.elementFromPoint(p.x,p.y)?.id==='city'};},id);
 if(target.picked!==id||!target.canvas){
  const n=await page.evaluate(id=>playground.city.plan.nodes[id],id);
  await action('Camera framing to expose the selected structural target',()=>frame([n.x+(n.ix===0?-22:22),n.y+14,n.z+(n.iz===0?-23:23)],[n.x,n.y,n.z]));
  const next=await page.evaluate(id=>{const v=playground.view,p=v.project(v.targetPosition(id));return {...p,picked:v.pick(p.x,p.y,'charges'),canvas:document.elementFromPoint(p.x,p.y)?.id==='city'};},id);
  Object.assign(target,next);if(target.picked!==id||!target.canvas)throw Error(`Target ${id} occluded by ${target.picked}`);
 }
 const beforeCount=await page.evaluate(()=>playground.city.events.filter(e=>e.kind==='charge-placed').length);
 await action('Place charge on member '+id,()=>page.mouse.click(target.x,target.y));
 const placed=await page.evaluate(()=>playground.city.events.filter(e=>e.kind==='charge-placed'));if(placed.length!==beforeCount+1||placed.at(-1).node!==id)throw Error('Actual click did not place charge '+id);
}
async function scrub(time){await action('Scrub to simulation time '+time,async()=>{await page.locator('#timeline').fill(String(time));await page.locator('#timeline').dispatchEvent('input');});}
async function swing(){const b=await page.evaluate(()=>{const v=playground.view,p=v.project(v.ball.position),e=v.camera.matrix.elements;const a=e[0],b=e[8],c=e[2],d=e[10],det=a*d-b*c;return {x:p.x,y:p.y,dx:240*b/det,dy:-240*a/det};});await action('Drag ball to impart swing momentum',async()=>{await page.mouse.move(b.x,b.y);await page.mouse.down();await page.mouse.move(b.x+b.dx,b.y+b.dy,{steps:14});await page.mouse.up();});}
if(phase==='prepare'){
 await fresh(page);await click('play');await page.evaluate(()=>playground.playback.scrub(0));data.environment=await page.evaluate(()=>playground.environment());
 if(scene==='temporal'){
  await shot('01-pristine-hero');
  await click('view');
 }else if(scene==='collapse'){
  await click('charge-tool');for(const id of [48,49,50,54,55,56])await place(id);await frame([64,44,47],[18,17,-11]);await click('play');
 }else if(scene==='tank'){
  await frame([-42,36,30],[-10,13,-14]);await click('charge-tool');await place(196);await click('play');
 }
}else{
 data.environment=await page.evaluate(()=>playground.environment());const start=await page.evaluate(()=>performance.now());
 if(scene==='temporal'){
  await page.waitForTimeout(600);await click('play');await swing();await page.waitForTimeout(950);await click('slow');
  const from=await page.evaluate(()=>performance.now());await page.waitForTimeout(6000);const to=await page.evaluate(()=>performance.now());data.fixedSlowSegment={from,to,wallSeconds:(to-from)/1000};
  await click('play');await shot('02-player-strike-slow');await click('play');await click('slow');await page.waitForTimeout(5000);
  data.beforeTransportEvents=await page.evaluate(()=>playground.city.events.slice());await click('rewind');await page.waitForTimeout(1900);await click('play');await page.waitForTimeout(1400);await scrub(.513);const old=await page.evaluate(()=>playground.playback.history.end);
  await click('ball-tool');await action('Hold D from the interpolated past',async()=>{await page.locator('[data-hold="d"]').hover();await page.mouse.down();await page.waitForTimeout(420);await page.mouse.up();});
  data.checks.push({name:'accepted historical control replaces future',pass:await page.evaluate(end=>playground.playback.history.end<end&&playground.playback.history.branchCount>0,old)});
  await page.waitForTimeout(1000);await click('reset-city');await page.waitForTimeout(1800);await click('view');await shot('09-restored-hero');
  data.checks.push({name:'exact pristine reset',pass:await page.evaluate(()=>playground.city.state.every((v,i)=>Object.is(v,playground.city.initial[i])))});
 }else if(scene==='collapse'){
  await page.waitForTimeout(500);await click('detonate');await click('ball-tool');await page.waitForTimeout(900);await click('slow');await page.waitForTimeout(2000);await click('play');await shot('03-connected-collapse');await click('play');await click('slow');await page.waitForTimeout(9200);await click('play');await shot('04-supported-remnant');
  data.partial=await page.evaluate(()=>({stats:playground.stats(),foundations:[51,52,53].map(id=>({id,mode:playground.city.state[playground.city.no(id)+13],columnHealth:playground.city.state[playground.city.jointBase+playground.city.plan.nodes[id].vertical]}))}));
  await click('charge-tool');for(const id of [51,52,53])await place(id);await frame([64,44,47],[18,17,-11]);await click('detonate');await click('ball-tool');
  await page.waitForFunction(()=>playground.city.plan.nodes.filter(n=>n.b===2).every(n=>playground.city.state[playground.city.no(n.id)+13]===2),{},{timeout:24000});await page.waitForTimeout(7500);await click('play');await action('Camera inspection of settled rubble',()=>frame([47,22,28],[18,5,-11]));await shot('05-complete-tower-rubble');await click('view');await shot('06-whole-city-after');
  data.checks.push({name:'remaining supported foundations deliberately removed; all 99 tower bays resting; neighboring structure physically fails',pass:await page.evaluate(()=>playground.city.plan.nodes.filter(n=>n.b===2).every(n=>playground.city.state[playground.city.no(n.id)+13]===2)&&playground.city.events.some(e=>e.kind==='support-failure'&&e.building===6)&&playground.city.events.some(e=>e.kind==='neighbor-contact'))});
 }else if(scene==='tank'){
  await page.waitForTimeout(500);await click('detonate');await click('ball-tool');await page.waitForTimeout(120);await click('slow');await page.waitForTimeout(3500);await click('play');await shot('07-tank-rupture');await click('play');await click('slow');await page.waitForTimeout(2400);await click('play');const supportedTank=await page.evaluate(()=>{const v=playground.view,g=v.waterGroup;g.updateMatrixWorld(true);return {position:g.localToWorld(v.camera.position.clone().set(-1.2,4,10)).toArray(),target:g.localToWorld(v.camera.position.clone().set(0,-.7,0)).toArray()};});await action('Close inspection of tank contact before support removal',()=>frame(supportedTank.position,supportedTank.target));await shot('10-tank-supported-contact');await page.waitForTimeout(1200);
  await click('charge-tool');for(const id of [147,148,149,150,151,152])await place(id);await click('detonate');await click('ball-tool');await page.waitForTimeout(2200);
  await click('charge-tool');for(const id of [153,154,155])await place(id);await click('detonate');await click('ball-tool');await page.waitForTimeout(18000);await click('play');const tank=await page.evaluate(()=>{const v=playground.view,g=v.waterGroup;g.updateMatrixWorld(true);return {position:g.localToWorld(v.camera.position.clone().set(-1.2,5,7)).toArray(),target:g.localToWorld(v.camera.position.clone().set(0,-.7,0)).toArray()};});await action('Camera inspection through the ruptured tank shell',()=>frame(tank.position,tank.target));await shot('08-tank-contact-and-wreckage');
  await page.waitForTimeout(1600);data.checks.push({name:'tank detaches, ruptures, loses roof support, and water affects debris',pass:await page.evaluate(()=>['tank-detached','water-burst','tank-support-lost'].every(k=>playground.city.events.some(e=>e.kind===k))&&playground.stats().waterImpulse>0)});
 }
 data.trace=await page.evaluate(start=>({frames:playground.metrics.frames.filter(f=>f.wall>=start),events:playground.city.events,stats:playground.stats(),tank:Array.from(playground.city.state.slice(playground.city.tankBase,playground.city.tankBase+18)),buildingModes:playground.city.plan.buildings.map(b=>({building:b.name,standing:b.nodes.filter(id=>playground.city.state[playground.city.no(id)+13]===0).length,moving:b.nodes.filter(id=>playground.city.state[playground.city.no(id)+13]===1).length,resting:b.nodes.filter(id=>playground.city.state[playground.city.no(id)+13]===2).length}))}),start);
 if(data.fixedSlowSegment){const {from,to}=data.fixedSlowSegment,frames=data.trace.frames.filter(f=>f.wall>=from&&f.wall<=to);data.fixedSlowSegment.frames=frames;data.fixedSlowSegment.poseChanges=frames.slice(1).filter((f,i)=>f.ball.some((v,k)=>v!==frames[i].ball[k])).length;data.fixedSlowSegment.comparisons=frames.length-1;}
}
await writeFile(resolve(root,'checks',`capture-${scene}-${phase}.json`),JSON.stringify(data,null,2));console.log(JSON.stringify({scene,phase,checks:data.checks,errors:data.errors,slow:data.fixedSlowSegment&&{poseChanges:data.fixedSlowSegment.poseChanges,comparisons:data.fixedSlowSegment.comparisons}},null,2));await browser.close();
