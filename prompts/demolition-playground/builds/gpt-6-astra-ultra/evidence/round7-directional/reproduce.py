"""Native charge/camera capture; reuses the existing canvas recorder. Repository-only."""
import sys,time,json,importlib.util
sys.dont_write_bytecode=True
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('capture',root/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round7'
url=sys.argv[3];names=sys.argv[4].split(',') if len(sys.argv)>4 else ['front','side','clean-side','collapse']
front=[16,20,47];target=[-11,6.8,14]
points={'front':[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65]],'side':[[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]],'left':[[-15.7,1.3,19.65]],'right':[[-6.3,1.3,19.65]]};points['collapse']=points['front']+points['side'];points['perturbed']=[p[:] for p in points['side']];points['perturbed'][1][1]+=.22
rows=[]
c.call('open',url);c.call('set','viewport',1440,900)
for name in names:
 c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);return true})()');c.view(front,target);c.call('click','#charge-tool')
 c.js('''(async()=>{const {Simulation}=await import('/src/simulation.js');const render=Simulation.prototype.render;Simulation.prototype.render=function(...args){const r=render.apply(this,args);window.observedSimulation=this;if(window.cleanInspection)this.dustMesh.visible=false;return r;};const {EventVisuals}=await import('/src/event-visuals.js');const ev=EventVisuals.prototype.render;EventVisuals.prototype.render=function(...args){const r=ev.apply(this,args);this.root.visible=!window.cleanInspection;return r;};return true})()''')
 clean=name.startswith('clean-');c.js('window.cleanInspection='+str(clean).lower())
 route=name.removeprefix('clean-');inputs=[{'target':p,'screen':c.world(p),'accepted':c.js('demolition.state().charges')} for p in points[route]]
 assert len(inputs[-1]['accepted'])==len(inputs)
 c.shot(name+'-before');c.start();c.js('''(()=>{window.motionTrace={wallStart:performance.now(),simStart:demolition.diagnostics.cursor,frames:[]};window.tracing=true;function tick(now){if(!tracing)return;motionTrace.frames.push({wall:(now-motionTrace.wallStart)/1000,sim:demolition.diagnostics.cursor-motionTrace.simStart});requestAnimationFrame(tick)}requestAnimationFrame(tick);return true})()''')
 start=time.monotonic();c.call('click','#detonate');detonate=time.monotonic()-start;states=[]
 for at in [1,2,4,8,12]:
  time.sleep(max(0,at-(time.monotonic()-start)));states.append({'wall':time.monotonic()-start,'state':c.js('demolition.diagnostics'),'bank':c.js('observedSimulation.bank.stats')});
  if at in [2,4,12]:c.shot(name+'-'+str(at))
 c.js('window.tracing=false');c.stop(name);c.call('click','#play-pause');c.view([-16,24,53],target);c.shot(name+'-aftermath')
 rows.append({'name':name,'presentation':'muted; only dust and event clouds/grit/lights hidden' if clean else 'ordinary district; application sound muted','physicalNeighbors':'all enabled','camera':{'position':front,'target':target},'inputs':inputs,'detonateWall':detonate,'states':states,'timing':c.js('motionTrace')});print(name,flush=True)
 (c.OUT/(c.NAME+'-recordings.json')).write_text(json.dumps(rows,indent=2))
