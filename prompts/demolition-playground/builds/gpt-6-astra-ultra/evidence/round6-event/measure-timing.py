import sys,time,json,importlib.util
sys.dont_write_bytecode=True
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('capture',root/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round6'
c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);return true})()');c.call('click','#sound');c.view([16,20,47],[-11,6.8,14]);c.call('click','#charge-tool')
points=[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65],[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]
inputs=[{'target':p,'screen':c.world(p)} for p in points]
c.js('''(()=>{window.timing={start:performance.now(),simStart:demolition.diagnostics.cursor,frames:[]};let last=performance.now();function tick(now){timing.frames.push({wall:now-timing.start,dt:now-last,sim:demolition.diagnostics.cursor-timing.simStart});last=now;if(now-timing.start<14000)requestAnimationFrame(tick);else timing.end={wall:(now-timing.start)/1000,sim:demolition.diagnostics.cursor-timing.simStart};}requestAnimationFrame(tick);return true})()''')
c.call('click','#detonate');time.sleep(15)
r=c.js('timing');r['inputs']=inputs;r['diagnostics']=c.js('demolition.diagnostics');
for label,a,b in [('all',0,14000),('collapse',500,6000),('settled',9000,14000)]:
 d=sorted(f['dt'] for f in r['frames'] if a<=f['wall']<=b);r[label]={'meanMs':sum(d)/len(d),'p95Ms':d[int(len(d)*.95)],'maxMs':max(d),'frames':len(d)}
(Path(sys.argv[1])/(sys.argv[2]+'-timing.json')).write_text(json.dumps(r,indent=2));print(json.dumps({k:v for k,v in r.items() if k not in ['frames','inputs','diagnostics']}))
