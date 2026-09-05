"""Continue the native candidate capture with time controls, collapse and a neighbor.
Run after capture.py in the same bank-round3 browser session. No state injection.
"""
import sys,time,json
from pathlib import Path
sys.argv=['inspect',str(Path(__file__).resolve().parent),'candidate']
from capture import call,js,click,world,shot,view,start,stop,OUT

def scrub(t):
 d=js("(()=>{const e=document.querySelector('#timeline');return {min:+e.min,max:+e.max,r:e.getBoundingClientRect().toJSON()}})()")
 r=d['r'];click(r['x']+5+(r['width']-10)*(t-d['min'])/(d['max']-d['min']),r['y']+r['height']/2)
 return js("(()=>{const s=demolition.state(),a=demolition.historySample(demolition.diagnostics.cursor).a,n=x=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);return {diagnostics:demolition.diagnostics,exactBank:n(s.bank)===n(a.bank),exactCharges:n(s.charges)===n(a.charges)}})()")
def measure():
 return js("(async()=>{const t=[];let p=performance.now();for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);const n=performance.now();t.push(n-p);p=n;}const a=t.slice().sort((x,y)=>x-y);return {meanMs:t.reduce((x,y)=>x+y)/t.length,p95Ms:a[Math.floor(a.length*.95)],maxMs:a.at(-1),heap:performance.memory?.usedJSHeapSize,diagnostics:demolition.diagnostics,userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight,devicePixelRatio]}})()")
result={};
if js('demolition.diagnostics.mode')=='live':call('click','#play-pause')
view([-9,5,35],[-11,2.1,15]);d=js('demolition.diagnostics');end=d['historyEnd'];begin=max(d['historyStart']+.2,end-24)
start();result['scrubs']=[scrub(begin+7),scrub(begin+15),scrub(begin+2)]
call('click','#slow-motion');call('click','#play-pause');time.sleep(4);call('click','#play-pause');shot('slow-replay');call('click','#slow-motion');call('click','#rewind');time.sleep(2);call('click','#play-pause');shot('rewind')
scrub(begin+4);call('click','#ball-tool');result['branchBefore']=js('demolition.diagnostics');result['branchInput']=world([-15,2,19.5]);time.sleep(3);result['branchAfter']=js('demolition.diagnostics')
call('click','#reset-city');js("(async()=>{while(demolition.diagnostics.mode==='reset')await new Promise(requestAnimationFrame);return true})()");shot('rebuilt');result['rebuilt']=js("(()=>{const s=demolition.state();return {stats:demolition.stats,allPristine:Array.from(s.bank.bodies).every((v,i)=>i%17!==12||v===1),charges:s.charges.length}})()");stop('time-controls');result['intactPerformance']=measure()
# Same six real charge positions used for the accepted structural check.
view([16,20,47],[-11,6.8,14]);start();call('click','#charge-tool');result['charges']=[]
for p in [[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65],[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]:
 result['charges'].append({'point':p,'screen':world(p),'count':js('demolition.state().charges.length')})
call('click','#detonate');t=time.monotonic();result['collapse']=[]
for seconds in [1,3,7,13]:
 time.sleep(max(0,seconds-(time.monotonic()-t)));shot('collapse-'+str(seconds));result['collapse'].append({'seconds':time.monotonic()-t,'stats':js('demolition.stats')})
stop('collapse');view([1,6,29],[-10,2,14]);shot('collapse-angle');result['collapsePerformance']=measure()
# Orbit, pan, zoom are genuine pointer/wheel operations.
call('mouse','move',800,420);call('mouse','down');call('mouse','move',950,460);call('mouse','up');call('mouse','down','right');call('mouse','move',900,450);call('mouse','up','right');call('mouse','wheel',0,-120);shot('native-camera')
call('click','#reset-city');js("(async()=>{while(demolition.diagnostics.mode==='reset')await new Promise(requestAnimationFrame);return true})()");view([16,20,47],[-11,6.8,14]);call('click','#charge-tool')
result['neighbor']=[]
for p in [[-24,1.8,20.05],[-22,1.8,20.05],[-26,1.8,20.05]]:result['neighbor'].append({'input':world(p),'count':js('demolition.state().charges.length')})
call('click','#detonate');time.sleep(8);shot('neighbor');result['neighborPerformance']=measure();result['errors']=call('errors');result['console']=call('console')
(OUT/'native-inspection.json').write_text(json.dumps(result,indent=2));print(json.dumps({'rebuilt':result['rebuilt'],'collapse':result['collapse'],'scrubs':[x['exactBank'] for x in result['scrubs']]}))
