import sys,time,json,base64,importlib.util
sys.dont_write_bytecode=True
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('capture',root/'evidence/round3-hall/capture.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);c.SESSION='bank-round6'
out=c.OUT;name=c.NAME
# Duplicate the application's actual final output into a MediaStream destination.
# No microphone, generated soundtrack, or postproduction replacement audio.
def tap():
 c.js('''(()=>{const connect=AudioNode.prototype.connect;window.audioTaps=[];AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){let tap=audioTaps.find(t=>t.context===this.context);if(!tap){tap={context:this.context,node:this.context.createMediaStreamDestination()};const silent=this.context.createConstantSource();silent.offset.value=0;connect.call(silent,tap.node);silent.start();tap.silent=silent;audioTaps.push(tap);}connect.call(this,tap.node,...args);}return result;};return true})()''')
 c.call('click','#sound')
def start():
 return c.js('''(()=>{const video=document.querySelector('#world').captureStream(30);const audio=audioTaps[0].node.stream.getAudioTracks();window.chunks=[];window.recordInfo={wallStart:performance.now(),simStart:demolition.diagnostics.cursor,frames:[],audioTracks:audio.length};window.rec=new MediaRecorder(new MediaStream([...video.getTracks(),...audio]),{mimeType:'video/webm;codecs=vp9,pcm',videoBitsPerSecond:4500000,audioBitsPerSecond:128000});rec.ondataavailable=e=>chunks.push(e.data);rec.start();let last=performance.now();function tick(now){const d=demolition.diagnostics;recordInfo.frames.push({wall:(now-recordInfo.wallStart)/1000,dt:now-last,sim:d.cursor-recordInfo.simStart,mode:d.mode,events:d.eventCount,suppressed:d.suppressedEvents,voices:d.eventAudio?.voices,clouds:d.eventVisuals?.clouds,grains:d.eventVisuals?.grains});last=now;if(rec.state==='recording')requestAnimationFrame(tick);}requestAnimationFrame(tick);return recordInfo.wallStart})()''')
def stop(label):
 s=c.js('''(async()=>{recordInfo.wallEnd=performance.now();recordInfo.simEnd=demolition.diagnostics.cursor;await new Promise(r=>{rec.onstop=r;rec.stop()});const a=new Uint8Array(await new Blob(chunks).arrayBuffer());rec.stream.getVideoTracks().forEach(t=>t.stop());chunks=[];let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s)})()''');(out/(name+'-'+label+'.webm')).write_bytes(base64.b64decode(s));return c.js('recordInfo')
front=[16,20,47];target=[-11,6.8,14]
points={'left':[[-15.7,1.3,19.65]],'right':[[-6.3,1.3,19.65]],'collapse':[[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65],[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]}
if __name__=='__main__':
 rows=[]
 for label,ps in points.items():
  c.call('reload');c.js('(async()=>{while(!window.demolition)await new Promise(requestAnimationFrame);return true})()');tap();c.view(front,target);c.call('click','#charge-tool');row={'label':label,'inputs':[]}
  for p in ps:row['inputs'].append({'target':p,'screen':c.world(p),'charges':c.js('demolition.state().charges')})
  if label=='left':c.shot('intact')
  start();c.call('click','#detonate');t=time.monotonic();row['detonate']=c.js('({wall:(performance.now()-recordInfo.wallStart)/1000,sim:demolition.diagnostics.cursor})');
  time.sleep(15 if label=='collapse' else 9)
  if label=='collapse':
   row['secondAngleWall']=c.js('(performance.now()-recordInfo.wallStart)/1000');c.view([-16,24,53],target);time.sleep(3);c.call('click','#reset-view');row['districtWall']=c.js('(performance.now()-recordInfo.wallStart)/1000');time.sleep(3)
  row['recording']=stop(label);c.shot(label+'-settled');row['stats']=c.js('demolition.stats');rows.append(row);(out/(name+'-recordings.json')).write_text(json.dumps({'camera':{'position':front,'target':target},'scenarios':rows},indent=2));print(label,row['stats'],flush=True)
