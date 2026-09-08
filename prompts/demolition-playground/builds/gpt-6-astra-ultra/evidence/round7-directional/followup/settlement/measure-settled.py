"""Native six-charge timing, or Chrome CPU trace; no recording or simulation override."""
import sys,time,json,importlib.util,subprocess
from pathlib import Path
sys.dont_write_bytecode=True
root=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('capture',root/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round7'
profile=False
c.call('open',sys.argv[3]);c.call('set','viewport',1440,900);c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);return true})()')
c.view([16,20,47],[-11,6.8,14]);c.call('click','#charge-tool')
c.js("(async()=>{const {Simulation}=await import('/src/simulation.js');const original=Simulation.prototype.render;Simulation.prototype.render=function(...args){window.observedSimulation=this;return original.apply(this,args)};return true})()")
points=[[-6.3,1.3,19.65]]
inputs=[{'target':p,'screen':c.world(p)} for p in points];charges=c.js('demolition.state().charges');assert len(charges)==1
settings=c.js("({quality:document.querySelector('#quality').value,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,userAgent:navigator.userAgent,audio:demolition.diagnostics.eventAudio.enabled})")
processes=subprocess.check_output(['ps','-eo','pid,%cpu,command'],text=True);external=[p.split()[:2] for p in processes.splitlines() if 'junction-certification-worker.ts' in p]
if profile:c.call('profiler','start','--categories','devtools.timeline,v8.execute,disabled-by-default-v8.cpu_profiler,disabled-by-default-devtools.timeline')
start=c.js('demolition.diagnostics.cursor');c.call('click','#detonate')
while c.js('demolition.diagnostics.cursor')<start+26:time.sleep(1)
initialBank=c.js('observedSimulation.bank.stats');assert initialBank['loose']==0 and initialBank['movingSections']==0,initialBank
c.js('''(()=>{window.timing={start:performance.now(),simStart:demolition.diagnostics.cursor,frames:[],samples:[]};let last=performance.now(),sample=0;function tick(now){const sim=demolition.diagnostics.cursor-timing.simStart;timing.frames.push({wall:now-timing.start,dt:now-last,sim});if(now-sample>500){sample=now;timing.samples.push({wall:now-timing.start,sim,bank:observedSimulation.bank.stats})}last=now;if(now-timing.start<8000)requestAnimationFrame(tick);else timing.end={wall:(now-timing.start)/1000,sim};}requestAnimationFrame(tick);return true})()''')
time.sleep(9)
if profile:c.call('profiler','stop',str(c.OUT/(c.NAME+'-profile.json')))
r=c.js('timing');r.update(inputs=inputs,charges=charges,settings=settings,recording=False,profiling=profile,initialBank=initialBank,interval='Fully settled one-right-charge wound after at least26 simulatedseconds',externalVerificationProcesses=external,bank=c.js('observedSimulation.bank.stats'))
for label,a,b in [('settled',500,8000)]:
 d=sorted(f['dt'] for f in r['frames'] if a<=f['wall']<=b)
 if d:r[label]={'meanMs':sum(d)/len(d),'p95Ms':d[min(len(d)-1,int(len(d)*.95))],'maxMs':max(d),'frames':len(d)}
(c.OUT/(c.NAME+'-timing.json')).write_text(json.dumps(r,indent=2));c.call('click','#play-pause');print(json.dumps({k:r.get(k) for k in ['end','settled','bank','settings','externalVerificationProcesses']}));c.call('close')
