"""Small fresh-browser baseline/candidate comparison, no video recorder.
Pass a baseline URL then candidate URL. Uses 240 requestAnimationFrame samples
per phase; captures JS heap where Chrome exposes it. Not a laptop benchmark.
"""
from playthrough import call,js,click_at,OUT
import json,sys
SAMPLE="""(async()=>{const dt=[];let p=performance.now();for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);const n=performance.now();dt.push(n-p);p=n;}dt.sort((a,b)=>a-b);const c=document.querySelector('#world'),gl=c.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {frames:dt.length,p50:dt[120],p95:dt[228],max:dt.at(-1),mean:dt.reduce((a,b)=>a+b)/dt.length,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),viewport:[innerWidth,innerHeight,devicePixelRatio],diagnostics:demolition.diagnostics,stats:demolition.stats}})()"""
if __name__=='__main__':
    results=[]
    for label,url in zip(['baseline','candidate'],sys.argv[1:]):
        call('close');call('open',url);call('set','viewport',1440,900)
        js('(async()=>{while(!window.demolition?.ready)await new Promise(requestAnimationFrame);return true})()')
        result={'label':label,'url':url,'pristine':js(SAMPLE)}
        # Same native bank swing used for the baseline motion inspection.
        click_at(591,534);result['bank_swing']=js(SAMPLE)
        call('click','#charge-tool');targets=[]
        for id,floor in [(1,0),(3,5)]:
            p=js(f'demolition.projectBuilding({id},{floor})');click_at(p['x'],p['y'])
            targets.append({'requestedBuilding':id,'requestedFloor':floor,'screen':p,'charges':js('demolition.state().charges')})
        call('click','#detonate');result['multi_building']=js(SAMPLE);result['targets']=targets
        call('click','#play-pause');results.append(result)
    (OUT/'performance.json').write_text(json.dumps(results,indent=2)+'\n')
    print(json.dumps([{k:({t:v[t] for t in ['p50','p95','mean','heap']} if isinstance(v,dict) and 'p50'in v else v) for k,v in r.items() if k not in ['targets']}for r in results]))
