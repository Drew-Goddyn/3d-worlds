import sys,time,importlib.util,json
sys.dont_write_bytecode=True
from pathlib import Path
spec=importlib.util.spec_from_file_location('record',str(Path(__file__).with_name('capture-audio.py')));r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r);c=r.c
out=c.OUT;result={'actions':[]}
def state():return c.js('demolition.diagnostics')
def mark(label):
 row={'action':label,'recordingWall':c.js('(performance.now()-recordInfo.wallStart)/1000'),'state':state()};result['actions'].append(row);return row

def scrub(t):
 d=c.js("(()=>{const e=document.querySelector('#timeline');return {min:+e.min,max:+e.max,r:e.getBoundingClientRect().toJSON()}})()");q=d['r'];c.click(q['x']+5+(q['width']-10)*(t-d['min'])/(d['max']-d['min']),q['y']+q['height']/2)

def reset():
 c.call('click','#reset-city');c.js("(async()=>{const end=performance.now()+20000;while(demolition.diagnostics.mode==='reset'&&performance.now()<end)await new Promise(requestAnimationFrame);return demolition.diagnostics.mode})()");assert state()['mode']=='live'

def pristine():
 return c.js("(()=>{const n=x=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);return {exactBank:n(demolition.state().bank)===n(pristineBank),events:demolition.state().eventTrack.events.length,resources:demolition.diagnostics.eventAudio,stats:demolition.stats}})()")
c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);window.pristineBank=structuredClone(demolition.historySample(0).a.bank);return true})()');r.tap();c.view(r.front,r.target);c.call('click','#charge-tool')
for p in r.points['collapse']:c.world(p)
origin=state()['cursor'];r.start();c.call('click','#detonate');mark('six charges');time.sleep(2.1);c.call('click','#slow-motion');mark('slow motion');time.sleep(4);c.call('click','#play-pause');mark('pause');c.shot('slow-inspection');c.call('click','#slow-motion');c.call('click','#rewind');mark('reverse');time.sleep(.9);c.call('click','#play-pause');mark('stop reverse');
# Choose a recorded pre-collapse frame using the actual range control.
scrub(origin+.15);mark('scrub');c.call('click','#play-pause');mark('retained replay');time.sleep(3.5);c.call('click','#play-pause')
# Seek after all six scheduled charges have fired, leaving room for a new action.
scrub(origin+1.4);row=mark('seek after the initial charges');row['retainedCharges']=c.js('demolition.historySample(demolition.diagnostics.cursor).a.charges');assert len(row['retainedCharges'])==0
previousEnd=row['state']['historyEnd'];screen=c.world([-8.7,14.8,17.15]);row=mark('new charge creates alternate future');row['acceptedCharges']=c.js('demolition.state().charges');row['target']=[-8.7,14.8,17.15];row['screen']=screen;row['discardedHistoryEnd']=previousEnd
assert len(row['acceptedCharges'])==1 and row['state']['historyEnd']<previousEnd
c.call('click','#detonate');time.sleep(4);mark('alternate future');c.shot('alternate-future');reset();mark('pristine rebuild');result['rebuild']=pristine();c.shot('rebuilt');result['recording']=r.stop('time-controls');assert result['rebuild']['exactBank'] and result['rebuild']['events']==0
(out/'native-checks.json').write_text(json.dumps(result,indent=2));print('transport complete',flush=True)
if '--transport-only' in sys.argv:sys.exit(0)
# Ordinary ball and native camera controls after the same shared presentation changes.
c.call('click','#ball-tool');c.view(r.front,r.target);c.world([-7,3,19.5]);time.sleep(5);result['ball']=c.js('demolition.stats');assert result['ball']['tonnage']>0;reset();c.call('mouse','move',720,430);c.call('mouse','down');c.call('mouse','move',820,470);c.call('mouse','up');c.call('mouse','wheel',-100);c.shot('camera');c.call('click','#reset-view');
# Repeated real demolitions and rebuilds: bounded work and no active tail leak.
result['cycles']=[]
for cycle in range(2):
 c.view(r.front,r.target);c.call('click','#charge-tool');
 for p in r.points['collapse']:c.world(p)
 c.call('click','#detonate');time.sleep(16);row={'after':state(),'stats':c.js('demolition.stats')};(out/'resource-observation.json').write_text(json.dumps(row,indent=2));assert row['after']['eventAudio']['voices']==0;assert row['after']['eventCount']==0;reset();row['rebuilt']=pristine();assert row['rebuilt']['exactBank'];result['cycles'].append(row)
 (out/'native-checks.json').write_text(json.dumps(result,indent=2));print('resource cycle',cycle,flush=True)
# History eviction at normal wall time, then permanent pristine reconstruction.
c.call('click','#charge-tool');c.world([-6.3,1.3,19.65]);c.call('click','#detonate');start=state()['cursor'];time.sleep(58)
while state()['cursor']<start+63:time.sleep(3)
result['rollingMinute']=state();reset();result['rebuildAfterEviction']=pristine();assert result['rebuildAfterEviction']['exactBank'] and result['rebuildAfterEviction']['events']==0
c.call('select','#quality','low');c.call('select','#quality','high');c.call('click','#sound');result['muted']=state();assert not result['muted']['eventAudio']['enabled'];c.call('click','#reset-view');c.shot('district');result['errors']=c.call('errors');result['console']=c.call('console');(out/'native-checks.json').write_text(json.dumps(result,indent=2));print('native complete',flush=True)
