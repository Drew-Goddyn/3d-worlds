"""Native persistence, later intervention and support inspection; reuses existing capture."""
import sys,time,json,importlib.util
from pathlib import Path
sys.dont_write_bytecode=True
root=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('capture',root/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round7'
def mode(target):
 if c.js('demolition.diagnostics.mode')!=target:
  if ':4183' in sys.argv[3]:c.call('focus','#play-pause');c.call('press','Enter')
  else:c.call('click','#play-pause')
 actual=c.js('(async()=>{await new Promise(requestAnimationFrame);return demolition.diagnostics.mode})()')
 assert actual==target,(target,actual)
route=sys.argv[4] if len(sys.argv)>4 else 'left'
points={'left':[[-15.7,1.3,19.65]],'right':[[-6.3,1.3,19.65]],'single-side':[[-4.8,1.3,14]],'side':[[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]}
c.call('open',sys.argv[3]);c.call('set','viewport',1440,900);c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);return true})()');c.view([16,20,47],[-11,6.8,14]);c.call('click','#charge-tool')
c.js("(async()=>{const {Simulation}=await import('/src/simulation.js');const original=Simulation.prototype.render;Simulation.prototype.render=function(...args){window.observedSimulation=this;return original.apply(this,args)};return true})()")
c.js("window.inspectSupport=bank=>({stats:bank.stats,allFinite:bank.bodies.every(b=>[b.x,b.y,b.z,b.rx,b.ry,b.rz].every(Number.isFinite)),raisedReleasedGlass:bank.bodies.filter(b=>b.role==='glass'&&b.state>0&&b.y>b.origin.y+.4).map(b=>({id:b.id,state:b.state,y:b.y,originalY:b.origin.y})),moving:bank.bodies.filter(b=>b.state===1).map(b=>({id:b.id,role:b.role,y:b.y,sleep:b.sleep})),settled:bank.bodies.filter(b=>b.state===2).length});true")
def retain_bank(label):
 data=c.js("""(()=>{const bank=observedSimulation.bank,b=bank.recipe.building;return JSON.stringify({recipe:{building:{id:b.id,x:b.x,z:b.z,width:b.width,depth:b.depth,height:b.height,storeys:b.storeys,storeyHeight:b.storeyHeight},nodes:bank.recipe.nodes,bodies:bank.recipe.bodies,batches:[]},bank:bank.capture(),simulationTime:observedSimulation.time,diagnostics:demolition.diagnostics},(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v)})()""")
 path=c.OUT/(c.NAME+'-'+route+'-'+label+'-bank.json');path.write_text(data);return path.name
result={'route':route,'url':sys.argv[3],'viewport':[1440,900],'camera':{'position':[16,20,47],'target':[-11,6.8,14]},'ordinaryDistrict':True,'samples':[],'settings':c.js("({quality:document.querySelector('#quality').value,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,userAgent:navigator.userAgent,audio:demolition.diagnostics.eventAudio.enabled})")}
result['inputs']=[{'point':p,'screen':c.world(p)} for p in points[route]];result['charges']=c.js('demolition.state().charges');assert len(result['charges'])==len(points[route])
start=c.js('demolition.diagnostics.cursor');wall=time.monotonic();c.call('click','#detonate')
for at in [5,15,25]:
 while c.js('demolition.diagnostics.cursor')<start+at:time.sleep(1)
 mode('paused');data=c.js('inspectSupport(observedSimulation.bank)');data.update(observedAfter=start,wallElapsed=time.monotonic()-wall,elapsedSim=c.js('demolition.diagnostics.cursor')-start);result['samples'].append(data);c.shot(route+'-'+str(at)+'s')
 if at==25:data['exactBankState']=retain_bank('25s')
 mode('live');print(route,at,flush=True)
mode('paused');c.view([-2,9,23],[-10,6,15.5]);c.shot(route+'-support-angle');result['supportAngle']={'position':[-2,9,23],'target':[-10,6,15.5]}
# Native retained replay: slider seek followed by play, then re-inspect the same aftermath.
end=c.js('demolition.diagnostics.cursor');d=c.js("(()=>{const e=document.querySelector('#timeline');return {min:+e.min,max:+e.max,r:e.getBoundingClientRect().toJSON()}})()");q=d['r'];t=end-3;c.click(q['x']+5+(q['width']-10)*(t-d['min'])/(d['max']-d['min']),q['y']+q['height']/2);mode('live')
while c.js('demolition.diagnostics.cursor')<end:time.sleep(.5)
mode('paused');result['afterReplay']=c.js('inspectSupport(observedSimulation.bank)');c.shot(route+'-replayed');result['afterReplay']['exactBankState']=retain_bank('replayed')
if route!='side':
 c.view([16,20,47],[-11,6.8,14]);points=[[-11,1.3,19.65],[-6.3,1.3,19.65]] if route=='left' else [[-6.3,1.3,19.65]];c.start();result['later']={'before':c.js('observedSimulation.bank.stats'),'inputs':[{'point':p,'screen':c.world(p)} for p in points],'charges':c.js('demolition.state().charges')};assert len(result['later']['charges'])==len(points)
 before=c.js('demolition.diagnostics.cursor');c.call('click','#detonate');time.sleep(13);mode('paused');result['later']['elapsedSim']=c.js('demolition.diagnostics.cursor')-before;result['later']['after']=c.js('observedSimulation.bank.stats');c.stop(route+'-later-cut');c.shot(route+'-later-cut');result['later']['exactBankState']=retain_bank('later-cut');result['later']['support']=c.js('inspectSupport(observedSimulation.bank)')
result['beforeRebuild']=c.js('demolition.diagnostics');c.call('click','#reset-city')
while c.js('demolition.diagnostics.mode')=='reset':time.sleep(.5)
mode('paused');result['afterRebuild']=c.js('demolition.diagnostics');result['rebuiltBank']=c.js('observedSimulation.bank.stats');assert result['rebuiltBank']['settled']==0 and result['rebuiltBank']['loose']==0 and result['rebuiltBank']['failedBays']==0;c.shot(route+'-rebuilt')
(c.OUT/(c.NAME+'-'+route+'-inspection.json')).write_text(json.dumps(result,indent=2));print('complete',flush=True);c.call('close')
