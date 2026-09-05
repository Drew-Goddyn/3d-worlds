import json,subprocess,time,base64,sys
from pathlib import Path
OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True);NAME=sys.argv[2]
SESSION='bank-round3'
def call(*args):
 p=subprocess.run(['agent-browser','--session',SESSION,'--json',*map(str,args)],capture_output=True,text=True,check=True);r=json.loads(p.stdout)
 if not r['success']:raise RuntimeError(r)
 return r.get('data',{})
def js(c):return call('eval',c).get('result')
def click(x,y):
 call('mouse','move',round(x),round(y));call('mouse','down');call('mouse','up')
def world(p):
 s=js('demolition.projectPoint('+','.join(map(str,p))+')');click(s['x'],s['y']);return s
def shot(n):call('screenshot',str(OUT/(NAME+'-'+n+'.png')))
def view(p,t):js(f'demolition.view({json.dumps(p)},{json.dumps(t)})')
def start():js("(()=>{window.chunks=[];window.rec=new MediaRecorder(document.querySelector('#world').captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:5000000});rec.ondataavailable=e=>chunks.push(e.data);rec.start();return performance.now()})()")
def stop(n):
 s=js("(async()=>{await new Promise(r=>{rec.onstop=r;rec.stop()});const a=new Uint8Array(await new Blob(chunks).arrayBuffer());rec.stream.getTracks().forEach(t=>t.stop());chunks=[];let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s)})()")
 (OUT/(NAME+'-'+n+'.webm')).write_bytes(base64.b64decode(s))
if __name__=='__main__':
 call('open',sys.argv[3] if len(sys.argv)>3 else 'http://127.0.0.1:4173');call('reload');time.sleep(1);view([-9,5,35],[-11,2.1,15])
 # Passive contact tracing delegates unchanged arguments to the original
 # method. It never injects an impulse or alters simulation/history state.
 js("(async()=>{window.hallContacts=[];const {BankPhysics}=await import('/src/bank-physics.js');const original=BankPhysics.prototype.hitContent;if(original)BankPhysics.prototype.hitContent=function(b,p,d){const row={time:this.sim.time,id:b.id,role:b.role,power:p,directBall:new Error().stack.includes('Crane.update'),before:[b.x,b.y,b.z,b.state]};const result=original.call(this,b,p,d);row.after=[b.x,b.y,b.z,b.state];if(hallContacts.length<4096)hallContacts.push(row);return result;};return true})()")
 # Native crane-button holds lower the ball and bring it around to the street.
 holds=[]
 for name,seconds in [('left',1.5),('down',1.5)]:
  r=js('document.querySelector('+json.dumps('[data-crane="'+name+'"]')+').getBoundingClientRect().toJSON()')
  call('mouse','move',round(r['x']+r['width']/2),round(r['y']+r['height']/2));call('mouse','down');time.sleep(seconds);call('mouse','up')
  holds.append({'button':name,'requestedSeconds':seconds,'crane':js('demolition.diagnostics.crane')})
 time.sleep(6);shot('intact');start();t=time.monotonic();events=[]
 for delay,p in [(1,[-7,2,19.5]),(10,[-7.5,1.6,13.45]),(19,[-15,2,19.5])]:
  time.sleep(max(0,delay-(time.monotonic()-t)));s=world(p);events.append({'videoSeconds':time.monotonic()-t,'point':p,'screen':s,'state':js('demolition.diagnostics')})
  if delay==10:shot('first-breach')
 time.sleep(max(0,29-(time.monotonic()-t)));shot('breached');stop('native');call('click','#play-pause')
 d=js("(()=>{const e=document.querySelector('#timeline');return {min:+e.min,max:+e.max,r:e.getBoundingClientRect().toJSON()}})()")
 targetTime=events[0]['state']['cursor']+5;r=d['r'];click(r['x']+5+(r['width']-10)*(targetTime-d['min'])/(d['max']-d['min']),r['y']+r['height']/2)
 view([-3,5,23],[-11,1.8,14]);shot('second-angle')
 (OUT/(NAME+'-inputs.json')).write_text(json.dumps({'camera':{'position':[-9,5,35],'target':[-11,2.1,15]},'holds':holds,'events':events,'contactTrace':js('window.hallContacts||[]'),'end':js('demolition.diagnostics')},indent=2))
 print(json.dumps({'end':js('demolition.stats'),'events':[(e['videoSeconds'],e['point']) for e in events]}))
