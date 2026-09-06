import sys,time,json,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('capture',ROOT/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round4'
OUT=c.OUT;result={}
def save(): (OUT/'native-checks.json').write_text(json.dumps(result,indent=2))
def state():return c.js('demolition.diagnostics')
def summary():return c.js('demolition.stats')
def scrub(t):
 d=c.js("(()=>{const e=document.querySelector('#timeline');return {min:+e.min,max:+e.max,r:e.getBoundingClientRect().toJSON()}})()")
 r=d['r'];c.click(r['x']+5+(r['width']-10)*(t-d['min'])/(d['max']-d['min']),r['y']+r['height']/2)
 return c.js("(()=>{const s=demolition.state(),a=demolition.historySample(demolition.diagnostics.cursor).a,n=x=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);return {cursor:demolition.diagnostics.cursor,exactBank:n(s.bank)===n(a.bank),exactCharges:n(s.charges)===n(a.charges),mode:demolition.diagnostics.mode}})()")
def reset():
 c.call('click','#reset-city');c.js("(async()=>{const end=performance.now()+16000;while(demolition.diagnostics.mode==='reset'&&performance.now()<end)await new Promise(requestAnimationFrame);return demolition.diagnostics.mode})()")
 assert state()['mode']=='live'
def measure():
 return c.js("(async()=>{let p=performance.now();const t=[];for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);const n=performance.now();t.push(n-p);p=n;}const a=t.slice().sort((x,y)=>x-y),gl=document.querySelector('#world').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {meanMs:t.reduce((x,y)=>x+y)/t.length,p95Ms:a[Math.floor(a.length*.95)],maxMs:a.at(-1),heapBytes:performance.memory?.usedJSHeapSize,stats:demolition.stats,diagnostics:demolition.diagnostics,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight,devicePixelRatio]}})()")
c.view([16,20,47],[-11,6.8,14]);d=state();end=d['historyEnd'];start=d['historyStart']
c.js('window.bankPristine=structuredClone(demolition.historySample(0).a.bank)')
c.start();result['scrubs']=[scrub(end-3),scrub(end-8),scrub(start+.3)]
assert all(s['exactBank'] and s['exactCharges'] for s in result['scrubs'])
c.call('click','#slow-motion');c.call('click','#play-pause');t=state()['cursor'];time.sleep(3);result['slowReplay']={'from':t,'to':state()['cursor']};c.call('click','#play-pause');c.call('click','#slow-motion')
scrub(end-5);c.call('click','#rewind');t=state()['cursor'];time.sleep(2);c.call('click','#play-pause');result['rewind']={'from':t,'to':state()['cursor']};c.shot('rewind')
scrub(start+.3);result['branchBefore']=state();c.call('click','#charge-tool');result['branchClick']=c.world([-16.4,6.3,19.6]);result['branchAfterClick']=state();assert result['branchAfterClick']['historyEnd']<end
c.call('click','#detonate');time.sleep(4);result['branchOutcome']=summary();c.shot('alternate-future');reset()
result['pristineRebuild']=c.js("(()=>{const n=x=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);return {exactBank:n(demolition.state().bank)===n(bankPristine),stats:demolition.stats}})()")
assert result['pristineRebuild']['exactBank'];c.shot('rebuilt');c.stop('time-controls');save();print('time controls',json.dumps(result['pristineRebuild']),flush=True)
c.call('click','#reset-view');c.shot('district');result['intactPerformance']=measure()
# Native high intervention, then another charge on the actual exposed remains.
c.view([16,20,47],[-11,6.8,14]);c.call('click','#charge-tool');c.start();video=time.monotonic();result['roofProgression']=[]
for label,p in [('roof',[-8.7,14.8,17.15]),('gallery',[-5.3,7.6,17.6])]:
 row={'label':label,'point':p,'screen':c.world(p),'videoSeconds':time.monotonic()-video,'charges':c.js('demolition.state().charges')}
 assert row['charges'];c.call('click','#detonate');time.sleep(6);row['after']=summary();c.shot('progression-'+label);result['roofProgression'].append(row)
c.stop('roof-progression');result['progressionPerformance']=measure();save();print('roof progression',json.dumps(summary()),flush=True)
# Keep the original pristine separate from the rolling minute; ordinary time runs.
t0=state()['cursor']
while state()['cursor']<t0+62:
 time.sleep(5)
result['rollingMinute']=state();assert result['rollingMinute']['historyEnd']-result['rollingMinute']['historyStart']>=59.9
reset();result['rebuildAfterEviction']=c.js("(()=>{const n=x=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);return {exactBank:n(demolition.state().bank)===n(bankPristine),stats:demolition.stats}})()")
assert result['rebuildAfterEviction']['exactBank'];save();print('rolling minute restored',flush=True)
# Two substantial front/side sets, normal native pointer clicks. Camera changes only framing.
result['repeatedPlay']=[]
for cycle in range(2):
 c.call('click','#charge-tool');c.view([16,20,47],[-11,6.8,14]);row={'cycle':cycle,'inputs':[]}
 for p in [[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65]]:row['inputs'].append({'point':p,'screen':c.world(p),'charges':c.js('demolition.state().charges')})
 c.view([16,20,47],[-11,6.8,14])
 for p in [[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]:row['inputs'].append({'point':p,'screen':c.world(p),'charges':c.js('demolition.state().charges')})
 assert c.js('demolition.state().charges.length')==6
 c.view([16,20,47],[-11,6.8,14]);
 if cycle==0:c.start()
 c.call('click','#detonate');time.sleep(12)
 if cycle==0:c.shot('full-collapse');c.stop('full-collapse')
 row['measurement']=measure();result['repeatedPlay'].append(row);reset();save();print('repeat',cycle,json.dumps(row['measurement']['stats']),flush=True)
# Original neighboring building, ball, camera, and quality control smoke checks.
c.call('click','#reset-view');c.call('click','#charge-tool');result['neighbor']={'before':summary(),'click':c.world([-24,2,20.1]),'charges':c.js('demolition.state().charges.length')};assert result['neighbor']['charges']==1
c.call('click','#detonate');time.sleep(6);result['neighbor']['after']=summary();c.shot('neighbor');assert result['neighbor']['after']['tonnage']>0
c.call('click','#action-camera');time.sleep(1);c.call('click','#reset-view');c.call('select','#quality','medium');c.call('select','#quality','high');reset();c.call('click','#ball-tool');result['ball']={'screen':c.world([-7,3,19.5])};time.sleep(5);result['ball']['after']=summary();assert result['ball']['after']['tonnage']>0
reset();c.call('mouse','move',720,440);c.call('mouse','down');c.call('mouse','move',805,475);c.call('mouse','up');c.call('mouse','wheel',-100);c.shot('native-orbit');c.call('click','#reset-view');result['finalPerformance']=measure()
result['errors']=c.call('errors');result['console']=c.call('console');(OUT/'native-checks.json').write_text(json.dumps(result,indent=2));print('complete',json.dumps(summary()),flush=True)
