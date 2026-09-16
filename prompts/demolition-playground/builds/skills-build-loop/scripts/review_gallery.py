from pathlib import Path
import json, html, shutil
root=Path(__file__).resolve().parent.parent
review=root/'review'/'build-01'
files=[];sequences=[];valid=set();checks=[]
for name in ['ball','charges','water']:
    data=json.loads((review/'checks'/f'browser-{name}.json').read_text())
    checks.extend(data['checks'])
    assert not data['errors'] and not any(c.get('pass') is False for c in data['checks'])
    for capture in data['captures']:
        valid.add(capture['file'])
        files.append({'file':capture['file'],'time':round(capture['before']['stats']['time'],3),'wallUTC':capture['wallUTC']})
    sequences.extend(data['sequences'])
perf=json.loads((review/'checks'/'performance-retention.json').read_text())
ret=perf['retention']
assert ret['exactReset']
for probe in ret['probes']:
    for moment in ['early','late']:
        if probe['frame']==ret[moment]['frame']:assert probe['hash']==ret[moment]['hash']
valid.add('captures/28-over-90-seconds.png')
files.append({'file':'captures/28-over-90-seconds.png','time':round(ret['simulationSeconds'],3)})
frames=[]
first_capture_time=(review/ret['resetFrames'][0]['file']).stat().st_mtime
for i,c in enumerate(ret['resetFrames']):
    valid.add(c['file']);files.append({'file':c['file'],'time':round(c['stats']['time'],3)})
    frames.append({'file':c['file'],'elapsedMs':round(((review/c['file']).stat().st_mtime-first_capture_time)*1000)})
sequences.append({'name':'Full 91-second history reset (sampled during the actual reset animation)','files':frames,'wallDurationMs':frames[-1]['elapsedMs'],'timestampMethod':'PNG file completion times'})
# Keep only final-take images in the immutable package; preserve superseded generated captures in scratch.
superseded=root/'.scratch'/'superseded-captures'
superseded.mkdir(parents=True,exist_ok=True)
for p in (review/'captures').glob('*.png'):
    if 'captures/'+p.name not in valid:shutil.move(str(p),str(superseded/p.name))
for f in valid:assert (review/f).exists(), f
render=json.loads((review/'checks'/'render-restoration.json').read_text())
assert render['pristineWorldExact'] and render['pristineVisibleExact']
assert all(c['worldExact'] and c['visibleInputsExact'] for c in render['comparisons'])
data=json.dumps({'sequences':sequences,'files':files}).replace('</',r'<\/')
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Build 01 · Runtime evidence</title><style>
body{font:14px system-ui,sans-serif;background:#192b2c;color:#eae8cf;margin:24px auto;max-width:1440px;padding:0 20px}h1{font-size:24px;font-weight:550}p{max-width:900px;line-height:1.5;color:#b8c6bd}select,button{font:inherit;padding:9px;background:#e9e6cd;color:#263d3a;border:0;border-radius:5px}nav{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:16px 0}input{flex:1;min-width:200px}#main{display:block;width:100%;aspect-ratio:1.6;object-fit:contain;background:#0e1718;border-radius:8px}#stamp{font:12px monospace;color:#bdc9be;margin:10px 0}#stills{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}a{color:#d6dbc2}#stills img{width:100%;border-radius:5px}#stills a{font-size:11px;text-decoration:none}h2{margin-top:32px}</style>
<h1>Build 01 · Actual application captures</h1><p>Timestamped PNG samples from the running playground. Each sequence is a separate labelled take. Playback shows the captured samples at their recorded spacing, with no interpolated frames. This is evidence of interactions and states, not a continuous 60 fps movie. Close-detail stills use camera-only framing.</p>
<nav><select id="sequence" aria-label="Capture sequence"></select><button id="play">Play samples</button><input id="frame" aria-label="Captured frame" type="range" min="0" value="0"></nav><img id="main" alt="Actual playground runtime capture"><div id="stamp"></div><h2>Detail and comparison stills</h2><div id="stills"></div>
<script>const data=DATA;const select=document.querySelector('#sequence'),range=document.querySelector('#frame'),main=document.querySelector('#main'),stamp=document.querySelector('#stamp');let index=0,timer=null;const meta=new Map(data.files.map(f=>[f.file,f]));
data.sequences.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.name;select.append(o)});
function show(i){const s=data.sequences[Number(select.value)];index=Math.max(0,Math.min(i,s.files.length-1));range.max=s.files.length-1;range.value=index;const f=s.files[index],m=meta.get(f.file);main.src=f.file;stamp.textContent=`${f.file} · simulation ${m?.time??'?'}s · captured sample ${index+1}/${s.files.length} · take elapsed ${(f.elapsedMs/1000).toFixed(2)}s`;}
function stop(){clearTimeout(timer);timer=null;document.querySelector('#play').textContent='Play samples'}
function step(){const s=data.sequences[Number(select.value)];if(index>=s.files.length-1){stop();return;}const delay=Math.max(40,s.files[index+1].elapsedMs-s.files[index].elapsedMs);timer=setTimeout(()=>{show(index+1);step()},delay)}
select.onchange=()=>{stop();show(0)};range.oninput=()=>{stop();show(Number(range.value))};document.querySelector('#play').onclick=()=>{if(timer){stop();return;}if(index>=data.sequences[Number(select.value)].files.length-1)show(0);document.querySelector('#play').textContent='Pause';step()};
for(const f of data.files){if(/-\\d{3}\\.png$/.test(f.file)||/timeline-/.test(f.file))continue;const a=document.createElement('a');a.href=f.file;a.target='_blank';const im=document.createElement('img');im.src=f.file;im.loading='lazy';im.alt=f.file;a.append(im,document.createTextNode(f.file+' · '+f.time+'s'));document.querySelector('#stills').append(a)}show(0);
</script></html>'''.replace('DATA',data)
(review/'GALLERY.html').write_text(page)
lines=['Measured on **Apple M2 Pro, 10 logical cores, 32 GiB RAM**, using **HeadlessChrome 149 / ANGLE Metal**, **1440×900**, **DPR 1**, high detail unless labelled low. These are requestAnimationFrame wall intervals; physical-display presentation was not measured.','', '| Interval | Frames | Median | p95 | Worst | Frames >50 ms |','| --- | ---: | ---: | ---: | ---: | ---: |']
for s in perf['samples']:lines.append(f"| {s['name']} | {s['count']} | {s['medianMs']:.1f} ms | {s['p95Ms']:.1f} ms | {s['maxMs']:.1f} ms | {s['over50ms']} |")
lines+=['',f"The separately accelerated retention run advanced **{ret['simulationSeconds']:.0f} simulation seconds** in **{ret['wallExecutionMs']} ms** of browser execution. It created **{ret['late']['stats']['createdFragments']:,} fragment identities** in **{ret['defaultCapacity']:,} slots**, ended with **{ret['late']['stats']['sleeping']} sleeping structural members**, and retained **{ret['historyBytes']:,} bytes ({ret['historyBytes']/1024**2:.1f} MiB)** of history payload. The earliest and latest saved moments matched their hashes after seeking, and full reset matched the pristine-state hash exactly."]
index=(review/'INDEX.md').read_text().replace('{{MEASUREMENTS}}','\n'.join(lines))
(review/'INDEX.md').write_text(index)
summary={'browserChecks':len(checks),'browserChecksPassed':sum(c.get('pass') is True for c in checks),'renderRoundTrips':len(render['comparisons']),'renderRoundTripsPassed':sum(c['worldExact'] and c['visibleInputsExact'] for c in render['comparisons']),'fullResetExact':ret['exactReset'],'captures':len(valid),'sequences':len(sequences),'runtimeSourceSHA256':perf['sourceIdentity']['sha256']}
(review/'checks'/'package-validation.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
