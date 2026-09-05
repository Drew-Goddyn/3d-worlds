"""One additional 240-frame sample during the demonstrated six-charge event.
Run against candidate at port 4173 after performance.py. No video capture.
"""
from playthrough import call,js,view,world_click,wait_sim,shot,OUT
from performance import SAMPLE
import json
call('open','http://127.0.0.1:4173');view([16,20,47],[-11,6.8,14]);call('click','#charge-tool')
for point in [[-15.7,1.3,19.65],[-11,1.3,19.65],[-6.3,1.3,19.65],[-4.8,1.3,10],[-4.8,1.3,14],[-4.8,1.3,17.8]]:world_click(point)
charges=js('demolition.state().charges');call('click','#detonate');sample=js(SAMPLE);call('click','#play-pause')
(OUT/'charge-performance.json').write_text(json.dumps({'sourceCommit':'585c0b8','charges':charges,'sample':sample,'note':'Candidate only, close camera, native six-charge event, 240 RAF samples, no recording; not directly comparable to overview phases.'},indent=2)+'\n')
print(json.dumps({k:sample[k] for k in ['mean','p50','p95','max','heap','stats']}))

# Inspect the actual remaining support from the opposite side after sampling.
call('click','#play-pause');wait_sim(js('demolition.diagnostics.cursor')+4);call('click','#play-pause');view([-2,19,0],[-11,5,14]);shot('final-rubble-reverse-angle')
