from pathlib import Path
import json,collections,hashlib
p=Path('/tmp/astra-bank-contact-cost/single-profiled-profile.json');raw=p.read_bytes();d=json.loads(raw);events=d.get('traceEvents',[]) if isinstance(d,dict) else d
nodes={};samples=[]
for e in events:
 if e.get('name')!='ProfileChunk':continue
 data=e['args']['data'];cpu=data.get('cpuProfile',{})
 for n in cpu.get('nodes',[]):nodes[n['id']]=n
 samples+=cpu.get('samples',[])
selfCounts=collections.Counter();inclusive=collections.Counter()
def key(n):
 f=n['callFrame'];return (f.get('url',''),f.get('functionName',''))
for i in samples:
 n=nodes[i];selfCounts[key(n)]+=1;seen=set()
 while n:
  seen.add(key(n));n=nodes.get(n.get('parent'))
 inclusive.update(seen)
def rows(c):return [{'url':u,'function':f,'samples':n,'percent':100*n/len(samples)} for (u,f),n in c.most_common(30)]
out={'sourceHead':'a8c62e0aa72d6fb3d83b66891e5770f1448a7039','rawTraceSHA256':hashlib.sha256(raw).hexdigest(),'rawTraceIncluded':False,'method':'One Chrome CPU profile; counts of sampled JavaScript stacks, not GPU time or per-frame wall-time percentages. Inclusive counts follow parents and count each function once per sample; rows overlap and must not be summed. Unrecorded frame measurement is separate.','samples':len(samples),'selfSamples':rows(selfCounts),'inclusiveSamples':rows(inclusive)}
Path('/tmp/astra-bank-contact-cost/profile-summary.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'samples':len(samples),'self':rows(selfCounts)[:12],'inclusive':rows(inclusive)[:14]},indent=2))
