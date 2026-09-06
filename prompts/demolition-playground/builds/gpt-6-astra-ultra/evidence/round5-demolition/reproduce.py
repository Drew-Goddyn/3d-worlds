import sys,time,json,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('capture',ROOT/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round5'
OUT=c.OUT;name=c.NAME
front=[16,20,47];target=[-11,6.8,14]
events=[]
for label,points in [('left',[[-15.7,1.3,19.65]]),('right',[[-6.3,1.3,19.65]]),('collapse',[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65],[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]])]:
 c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);return true})()');c.view(front,target);c.call('click','#charge-tool')
 if label=='left':c.shot('intact')
 row={'label':label,'inputs':[]};
 for p in points:row['inputs'].append({'worldTarget':p,'screen':c.world(p),'charges':c.js('demolition.state().charges')})
 c.start();t=time.monotonic();c.call('click','#detonate');row['detonateSeconds']=time.monotonic()-t
 for at in ([1,4,10] if label=='collapse' else [2,7]):
  time.sleep(max(0,at-(time.monotonic()-t)));c.shot(label+'-'+str(at));row[str(at)]={'wallSeconds':time.monotonic()-t,'diagnostics':c.js('demolition.diagnostics')}
 c.stop(label);c.call('click','#play-pause');c.view([-16,24,53],target);c.shot(label+'-angle');events.append(row)
 print(label,json.dumps(c.js('demolition.stats')),flush=True)
(OUT/(name+'-inputs.json')).write_text(json.dumps({'camera':{'position':front,'target':target},'scenarios':events},indent=2))
