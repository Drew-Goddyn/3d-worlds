"""Selected real controls; repository-only. Reuses the established recorder."""
import sys,time,json,importlib.util
sys.dont_write_bytecode=True
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('capture',root/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round7'
result={'actions':[]};front=[16,20,47];target=[-11,6.8,14]
def state():return c.js('demolition.diagnostics')
def mark(label):
 row={'action':label,'state':state()};result['actions'].append(row);return row
def scrub(t):
 d=c.js("(()=>{const e=document.querySelector('#timeline');return {min:+e.min,max:+e.max,r:e.getBoundingClientRect().toJSON()}})()");q=d['r'];c.click(q['x']+5+(q['width']-10)*(t-d['min'])/(d['max']-d['min']),q['y']+q['height']/2)
def reset():
 c.call('click','#reset-city');c.js("(async()=>{while(demolition.diagnostics.mode==='reset')await new Promise(requestAnimationFrame);return true})()");assert state()['mode']=='live'
def pristine():
 return c.js("(()=>{const n=x=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);return {exactBank:n(demolition.historySample(demolition.diagnostics.historyStart).a.bank)===n(pristineBank),events:demolition.state().eventTrack.events.length}})()")
def save(): (c.OUT/'native-checks.json').write_text(json.dumps(result,indent=2))
c.call('open',sys.argv[3]);c.call('set','viewport',1440,900);c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);window.pristineBank=structuredClone(demolition.historySample(0).a.bank);return true})()');c.view(front,target);c.call('click','#charge-tool')
points=[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65]]
result['initialInputs']=[{'target':p,'screen':c.world(p)} for p in points];assert len(c.js('demolition.state().charges'))==3
origin=state()['cursor'];c.start();c.call('click','#detonate');mark('three front charges');time.sleep(2);c.call('click','#slow-motion');mark('slow motion');time.sleep(2);c.call('click','#play-pause');mark('pause');c.shot('slow-inspection');c.call('click','#slow-motion');c.call('click','#rewind');mark('reverse');time.sleep(.6);c.call('click','#play-pause');mark('stop reverse')
scrub(origin+.15);mark('scrub');c.call('click','#play-pause');mark('retained replay');time.sleep(3);c.call('click','#play-pause')
scrub(origin+1.4);row=mark('seek after initial charges');assert len(c.js('demolition.historySample(demolition.diagnostics.cursor).a.charges'))==0
previousEnd=row['state']['historyEnd'];p=[-15.7,6.4,19.65];screen=c.world(p);row=mark('later charge on altered construction creates alternate future');row['target']=p;row['screen']=screen;row['acceptedCharges']=c.js('demolition.state().charges');row['discardedHistoryEnd']=previousEnd
assert len(row['acceptedCharges'])==1 and row['state']['historyEnd']<previousEnd
c.call('click','#detonate');time.sleep(5);mark('alternate future');c.shot('alternate-future');reset();result['rebuild']=pristine();assert result['rebuild']['exactBank'] and result['rebuild']['events']==0;c.shot('rebuilt');c.stop('time-controls');save();print('transport complete',flush=True)
c.call('click','#ball-tool');c.view(front,target);c.world([-7,3,19.5]);time.sleep(5);result['ball']=c.js('demolition.stats');assert result['ball']['tonnage']>0;reset()
c.call('mouse','move',720,430);c.call('mouse','down');c.call('mouse','move',820,470);c.call('mouse','up');c.call('mouse','wheel',-100);c.shot('camera');c.call('click','#reset-view');c.call('select','#quality','low');c.call('select','#quality','high')
c.view(front,target);c.call('click','#charge-tool');c.world([-6.3,1.3,19.65]);c.call('click','#detonate');start=state()['cursor'];save();print('rolling minute running',flush=True)
while state()['cursor']<start+63:time.sleep(5)
result['rollingMinute']=state();assert result['rollingMinute']['historyStart']>0 and result['rollingMinute']['historyEnd']-result['rollingMinute']['historyStart']>=60-.1
reset();result['rebuildAfterEviction']=pristine();assert result['rebuildAfterEviction']['exactBank'] and result['rebuildAfterEviction']['events']==0
assert not state()['eventAudio']['enabled'];c.call('click','#reset-view');c.shot('district');result['errors']=c.call('errors');result['console']=c.call('console');save();print('native complete',flush=True)
