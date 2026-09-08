import importlib.util,sys,time,json,subprocess
from pathlib import Path
sys.dont_write_bytecode=True
root=Path('/Users/Drew/.codex/worktrees/d794/3d-worlds/prompts/demolition-playground/builds/gpt-6-astra-ultra')
spec=importlib.util.spec_from_file_location('capture',root/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-contact-cost'
profile=len(sys.argv)>3 and sys.argv[3]=='profile'
c.call('open','http://127.0.0.1:4184');c.call('set','viewport',1440,900);c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);return true})()');c.view([16,20,47],[-11,6.8,14]);c.call('click','#charge-tool')
c.js("(async()=>{const {Simulation}=await import('/src/simulation.js');const original=Simulation.prototype.render;Simulation.prototype.render=function(...args){window.observedSimulation=this;return original.apply(this,args)};return true})()")
settings=c.js("({quality:document.querySelector('#quality').value,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,userAgent:navigator.userAgent,audio:demolition.diagnostics.eventAudio.enabled})")
def begin():
 c.js('''(()=>{window.contactTiming={start:performance.now(),simStart:demolition.diagnostics.cursor,frames:[],samples:[]};let last=performance.now(),sample=0;function tick(now){const sim=demolition.diagnostics.cursor-contactTiming.simStart;contactTiming.frames.push({wall:now-contactTiming.start,dt:now-last,sim});if(now-sample>500){sample=now;contactTiming.samples.push({wall:now-contactTiming.start,sim,bank:observedSimulation.bank.stats})}last=now;if(now-contactTiming.start<10000)requestAnimationFrame(tick);else contactTiming.end={wall:(now-contactTiming.start)/1000,sim};}requestAnimationFrame(tick);return true})()''')
begin();time.sleep(11);idle=c.js('contactTiming')
point=[-15.7,1.3,19.65];screen=c.world(point);charges=c.js('demolition.state().charges');assert len(charges)==1
if profile:c.call('profiler','start','--categories','devtools.timeline,v8.execute,disabled-by-default-v8.cpu_profiler,disabled-by-default-devtools.timeline')
begin();c.call('click','#detonate');time.sleep(11)
if profile:c.call('profiler','stop',str(c.OUT/(c.NAME+'-profile.json')))
active=c.js('contactTiming');c.call('click','#play-pause');c.shot('aftermath')
def summary(r,lo,hi):
 a=sorted(f['dt'] for f in r['frames'] if lo<=f['wall']<=hi)
 return {'frames':len(a),'meanMs':sum(a)/len(a),'fpsEquivalent':1000/(sum(a)/len(a)),'p95Ms':a[min(len(a)-1,int(len(a)*.95))],'maxMs':max(a)}
r={'runtimeCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'case':'One normal low front-left charge, full district, six-charge tool unchanged','input':{'target':point,'screen':screen,'charges':charges},'settings':settings,'profiled':profile,'recorded':False,'idle':idle,'active':active,'summaries':{'idle':summary(idle,1000,9000),'early':summary(active,500,4000),'lateBusy':summary(active,4000,10000)},'finalBank':c.js('observedSimulation.bank.stats')}
(c.OUT/(c.NAME+'-timing.json')).write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'summaries':r['summaries'],'advancement':active.get('end'),'bank':r['finalBank']},indent=2));c.call('close')
