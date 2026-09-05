"""Native-input capture. Requires the existing local agent-browser CLI.
Run from repository root with Astra served at 127.0.0.1:4173.
Camera framing uses the documented diagnostic view helper; all demolition
and time-control actions use real pointer/keyboard/range input.
"""
import json, subprocess, time
from pathlib import Path
OUT=Path(__file__).resolve().parent
SESSION='bank-round2'
def call(*args):
    p=subprocess.run(['agent-browser','--session',SESSION,'--json',*map(str,args)],capture_output=True,text=True,check=True)
    result=json.loads(p.stdout)
    if not result['success']:raise RuntimeError(result)
    return result.get('data',{})
def js(code):return call('eval',code).get('result')
def shot(name):call('screenshot',str(OUT/(name+'.png')))
def click_at(x,y):
    call('mouse','move',round(x),round(y));call('mouse','down');call('mouse','up')
def world_click(point):
    p=js('demolition.projectPoint('+','.join(map(str,point))+')')
    click_at(p['x'],p['y'])
    return p
def view(p,t):
    js(f'demolition.view({json.dumps(p)},{json.dumps(t)})')
    js('(async()=>{for(let i=0;i<8;i++)await new Promise(requestAnimationFrame);return true})()')
def wait_sim(t):
    js(f'(async()=>{{while(demolition.diagnostics.cursor<{t})await new Promise(requestAnimationFrame);return demolition.stats}})()')
def start_video():
    js("""(()=>{window.bankVideoChunks=[];window.bankVideoRecorder=new MediaRecorder(document.querySelector('#world').captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:4500000});bankVideoRecorder.ondataavailable=e=>bankVideoChunks.push(e.data);bankVideoRecorder.start();return true})()""")
def stop_video(name):
    import base64
    data=js("""(async()=>{await new Promise(r=>{bankVideoRecorder.onstop=r;bankVideoRecorder.stop()});const a=new Uint8Array(await new Blob(bankVideoChunks,{type:'video/webm'}).arrayBuffer());let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s)})()""")
    (OUT/name).write_bytes(base64.b64decode(data))
def scrub(t):
    info=js("(()=>{const e=document.querySelector('#timeline');return {min:+e.min,max:+e.max,rect:e.getBoundingClientRect().toJSON()}})()")
    r=info['rect'];click_at(r['x']+5+(r['width']-10)*(t-info['min'])/(info['max']-info['min']),r['y']+r['height']/2)
    return js('demolition.diagnostics')
if __name__=='__main__':
    call('reload');view([16,20,47],[-11,6.8,14]);shot('final-intact-close')
    start_video();call('click','#charge-tool');clicks=[]
    for point in [[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65],[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]:
        clicks.append({'world':point,'screen':world_click(point),'inventory':js('demolition.state().charges')})
    shot('final-charges-placed');start=js('demolition.diagnostics.cursor');call('click','#detonate')
    frames=[]
    for t in [.4,1.5,3,6,12]:
        wait_sim(start+t);shot('final-charges-'+str(t).replace('.','-')+'s')
        frames.append({'after':t,'stats':js('demolition.stats'),'time':js('demolition.diagnostics.cursor')})
    call('click','#play-pause');stop_video('final-charges-real-time.webm')
    # Actual range clicks retain recorded history. Compare each exact source
    # snapshot to the saved frame selected by the player's timeline cursor.
    start_video();timeline=[]
    for t in [start+1,start+7,start+.2]:
        d=scrub(t)
        result=js("(()=>{const a=demolition.state(),b=demolition.historySample(demolition.diagnostics.cursor).a;const norm=s=>JSON.stringify(s,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v);return {sameRecordedBank:norm(a.bank)===norm(b.bank),sameRecordedCharges:norm(a.charges)===norm(b.charges),cursor:demolition.diagnostics.cursor}})()")
        timeline.append(result)
    scrub(start+1.4);call('click','#slow-motion');call('click','#play-pause');wait_sim(start+3.6);call('click','#play-pause');shot('final-slow-replay')
    call('click','#slow-motion');call('click','#rewind');time.sleep(1.5);call('click','#play-pause');shot('final-rewind')
    endBefore=js('demolition.diagnostics.historyEnd');scrub(start-.25);call('click','#ball-tool')
    branchClick=world_click([-16,2,19.6]);branch=js('demolition.diagnostics');wait_sim(branch['cursor']+4);shot('final-alternate-future')
    call('click','#reset-city')
    js("(async()=>{while(demolition.diagnostics.mode==='reset')await new Promise(requestAnimationFrame);return true})()")
    shot('final-rebuilt');rebuilt=js("(()=>{const s=demolition.state();return {stats:demolition.stats,bankPristine:Array.from(s.bank.bodies).every((v,i)=>i%17!==12||v===1),charges:s.charges.length,historyStart:demolition.diagnostics.historyStart}})()")
    stop_video('final-time-controls-real-time.webm')
    (OUT/'native-playthrough.json').write_text(json.dumps({'camera':{'position':[16,20,47],'target':[-11,6.8,14]},'clicks':clicks,'start':start,'frames':frames,'timeline':timeline,'branch':{'previousEnd':endBefore,'afterAction':branch,'screen':branchClick},'rebuilt':rebuilt},indent=2)+'\n')
    print(json.dumps({'frames':frames,'timeline':timeline,'rebuilt':rebuilt}))
