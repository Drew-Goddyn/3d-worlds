import sys,json,time
sys.path.insert(0,'prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round2-bank')
from playthrough import *
checks=[]
for label,url in [('baseline','http://127.0.0.1:4176'),('final','http://127.0.0.1:4173')]:
 call('open',url);call('set','viewport',1440,900);js('(async()=>{for(let i=0;i<10;i++)await new Promise(requestAnimationFrame);return true})()')
 if label=='final':shot('final-overview')
 call('mouse','move',530,520);call('mouse','down','right');call('mouse','move',720,450);call('mouse','up','right');call('mouse','wheel',-900)
 js('(async()=>{for(let i=0;i<35;i++)await new Promise(requestAnimationFrame);return true})()');call('mouse','move',40,100);shot(label+'-matched-close')
# Native camera orbit/pan/zoom inspection after framing the bank.
view([13,18,43],[-11,6.8,14]);call('mouse','move',750,460);call('mouse','down');call('mouse','move',1020,460);call('mouse','up')
call('mouse','move',800,450);call('mouse','down','right');call('mouse','move',810,425);call('mouse','up','right');call('mouse','wheel',-80)
js('(async()=>{for(let i=0;i<35;i++)await new Promise(requestAnimationFrame);return true})()');call('mouse','move',40,100);shot('final-native-orbit')
for label,point in [('left',[-15.7,2,19.7]),('right',[-6.3,2,19.7])]:
 call('reload');view([-11,13,46],[-11,6,14]);start_video();start=js('demolition.diagnostics.cursor');screen=world_click(point)
 wait_sim(start+5);call('click','#play-pause');shot('final-ball-'+label);stop_video('final-ball-'+label+'-real-time.webm')
 checks.append({'action':'native ball '+label,'point':point,'screen':screen,'stats':js('demolition.stats'),'crane':js('demolition.diagnostics.crane')})
 # Native action camera has motion to follow at this point.
 if label=='right':
  call('click','#action-camera');time.sleep(1);shot('final-action-camera');checks.append({'action':'action camera','pressed':js('document.querySelector("#action-camera").getAttribute("aria-pressed")')});call('click','#action-camera')
call('reload');before=js('demolition.diagnostics.crane')
for action in ['left','down','swing']:
 r=js(f'document.querySelector(\'[data-crane="{action}"]\').getBoundingClientRect().toJSON()');call('mouse','move',round(r['x']+r['width']/2),round(r['y']+r['height']/2));call('mouse','down');time.sleep(.3);call('mouse','up')
checks.append({'action':'native crane hold controls','before':before,'after':js('demolition.diagnostics.crane')})
(OUT/'extra-native-controls.json').write_text(json.dumps(checks,indent=2)+'\n');print(json.dumps(checks))
