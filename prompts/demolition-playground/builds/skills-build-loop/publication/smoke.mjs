import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

// Run against this entry after its documented npm ci/start commands.
// The isolated agent-browser session is supplied by the caller.
const url=process.env.SMOKE_URL||'http://127.0.0.1:4176';
const endpoint=execFileSync('agent-browser',['get','cdp-url'],{encoding:'utf8'}).trim();
const browser=await chromium.connectOverCDP(endpoint);
const context=browser.contexts()[0],page=context.pages()[0];
const report={purpose:'Publication-path smoke test; not a performance benchmark or another build round.',url,browserLaunchArgs:process.env.AGENT_BROWSER_ARGS||'',checks:[],pageErrors:[],failedRequests:[],externalRequests:[],httpErrors:[]};
const check=(name,pass)=>{report.checks.push({name,pass:!!pass});assert(pass,name);};
page.on('pageerror',e=>report.pageErrors.push(String(e)));
page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),failure:r.failure()?.errorText}));
page.on('request',r=>{if(new URL(r.url()).origin!==new URL(url).origin)report.externalRequests.push(r.url());});
page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url(),status:r.status()});});
try{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(url);await page.waitForFunction(()=>window.playground?.ready&&playground.metrics.frames.length>4);
 report.environment=await page.evaluate(()=>playground.environment());
 report.initial=await page.evaluate(()=>({stats:playground.stats(),buildings:playground.city.plan.buildings.length,canvas:[document.querySelector('#city').width,document.querySelector('#city').height],errorVisible:!document.querySelector('#error').hidden}));
 check('Initial procedural scene and WebGL canvas render',report.initial.buildings===7&&report.initial.stats.parts===21870&&report.initial.stats.drawCalls>0&&!report.initial.errorVisible);
 check('Pinned local Three imports and no remote runtime requests',report.environment.three==='0.180.0'&&report.externalRequests.length===0);
 if(process.env.SMOKE_SCREENSHOT)await page.screenshot({path:process.env.SMOKE_SCREENSHOT});
 await page.click('#play');check('Pause control',await page.evaluate(()=>playground.playback.mode==='paused'));
 await page.click('#slow');check('Slow control selects 10 percent',await page.evaluate(()=>playground.playback.speed===.1));
 await page.click('#slow');
 await page.selectOption('#quality','low');check('Quality selector changes rendering',await page.evaluate(()=>playground.view.quality==='low'));
 await page.selectOption('#quality','high');
 await page.click('#action-cam');check('Action camera toggle',await page.evaluate(()=>playground.view.actionCamera));
 await page.click('#view');check('Reset view restores ordinary camera',await page.evaluate(()=>!playground.view.actionCamera));
 await page.click('#charge-tool');check('Charge placement mode',await page.getAttribute('#charge-tool','aria-pressed')==='true');
 const target=await page.evaluate(()=>{const p=playground;for(const n of p.city.plan.nodes){const q=p.view.project(p.view.targetPosition(n.id));if(q.x>0&&q.y>0&&q.x<innerWidth&&q.y<innerHeight&&document.elementFromPoint(q.x,q.y)?.id==='city'&&p.view.pick(q.x,q.y,'charges')===n.id)return{id:n.id,x:q.x,y:q.y};}return null;});
 assert(target,'Visible structural target available');await page.mouse.click(target.x,target.y);
 check('Actual canvas click places a charge',await page.evaluate(id=>playground.city.events.some(e=>e.kind==='charge-placed'&&e.node===id),target.id));
 await page.click('#detonate');await page.waitForFunction(()=>playground.city.events.some(e=>e.kind==='charge-fired'));
 check('Detonate control reaches simulation',await page.evaluate(()=>playground.city.events.some(e=>e.kind==='detonation-armed')));
 await page.click('#ball-tool');await page.click('#play');
 const end=await page.evaluate(()=>playground.playback.history.timeAt(playground.playback.history.end));
 const middle=Number((end/2).toFixed(3));await page.locator('#timeline').fill(String(middle));await page.locator('#timeline').dispatchEvent('input');
 check('Timeline accepts historical inspection',await page.evaluate(t=>Math.abs(playground.playback.time-t)<1e-8,middle));
 await page.click('#play');await page.waitForTimeout(180);await page.click('#rewind');
 const from=await page.evaluate(()=>playground.playback.time);await page.waitForTimeout(120);
 check('Rewind moves the playhead backward',await page.evaluate(t=>playground.playback.time<t,from));
 await page.click('#reset-city');await page.waitForFunction(()=>playground.city.state.every((v,i)=>Object.is(v,playground.city.initial[i])));
 check('Rebuild reaches the recorded pristine world',await page.evaluate(()=>playground.city.state.every((v,i)=>Object.is(v,playground.city.initial[i]))));
 check('No page, network or HTTP errors',!report.pageErrors.length&&!report.failedRequests.length&&!report.httpErrors.length);
 check('Runtime uses only the local app origin',!report.externalRequests.length);
 report.status='pass';
}catch(error){report.status='fail';report.failure=String(error);throw error;}
finally{
 await writeFile(process.env.SMOKE_REPORT||'publication/evidence/publication-smoke.json',JSON.stringify(report,null,2)+'\n');
 await browser.close();
 console.log(JSON.stringify({status:report.status,checks:report.checks,failure:report.failure},null,2));
}
