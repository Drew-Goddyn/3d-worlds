"""Package the frozen final build with explicit evidence and immutable prior archives."""
from pathlib import Path
import difflib,hashlib,json,shutil,subprocess,tempfile,zipfile
ROOT=Path(__file__).resolve().parent.parent
REVIEW=ROOT/'review/build-03'; ARCHIVE=ROOT/'review/build-03.zip'
PRIOR={'build-01.zip':'99d544f40651e148510bda17f884473c842f9a1e1a140885005a4fd1d8098957','build-02.zip':'7e506a337a54c6db2b358e7e16b910c8e751fdf3b3b5f7cebcf49449e4021a5b'}
def sha(data):return hashlib.sha256(data).hexdigest()
def check(name):return json.loads((REVIEW/'checks'/name).read_text())
if ARCHIVE.exists():raise SystemExit('Final archive already exists; preserve the frozen result.')
for name,value in PRIOR.items():assert sha((ROOT/'review'/name).read_bytes())==value
runtime=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {sourceIdentity} from './scripts/source-identity.mjs';console.log(JSON.stringify(await sourceIdentity()))"],cwd=ROOT,text=True))
evidence=check('evidence-files.json')['files']
for name in evidence:
 p=REVIEW/'checks'/name
 assert p.is_file(),name
 if p.suffix=='.json':
  data=json.loads(p.read_text())
  if data.get('sourceIdentity') and name not in ['profile-before.json','tank-contact-baseline.json']:
   assert data['sourceIdentity']==runtime, 'Evidence belongs to another runtime: '+name
  assert not data.get('errors'),name
  assert all(x.get('pass') is not False for x in data.get('checks',[])),name
r=check('test-run.json');assert r['tests']==r['passed']==47 and r['failed']==0;assert r['outputSHA256']==sha((REVIEW/'checks/tests.txt').read_bytes())
assert 'PASS:' in (REVIEW/'checks/static-check.txt').read_text()
contact=check('tank-contact.json');assert contact['passed'] and len(contact['reports'])==4
assert all(r['overlapFrames']==0 and r['finalShell']['intersections']==0 for r in contact['reports'])
assert check('tank-contact-baseline.json')['reports'][0]['finalShell']['intersections']==268
recorded_contact=check('tank-contact-final-recording.json');assert recorded_contact['passed'] and recorded_contact['capturedTankMaxDifference']<1e-8;assert recorded_contact['reports'][0]['overlapFrames']==0
collapse=check('collapse-support.json');assert collapse['final']['tower']['resting']==99 and collapse['settledTowerStableFrom30To40Seconds']
temporal=check('temporal-regressions.json');assert all(s['changes']==120 for s in temporal['samples']);assert all(abs(s['reversedSeconds']-1)<1e-9 for s in temporal['reverse'])
render=check('render-restoration.json');assert render['pristineWorldExact'] and render['pristineVisibleExact'] and render['qualityPreservesWorld'];assert all(x['worldExact'] and x['visibleInputsExact'] for x in render['comparisons']+render['fractional'])
perf=check('performance-retention.json');assert all(x['count']>=100 for x in perf['samples']);ret=perf['retention'];assert ret['simulationSeconds']>90 and ret['exactReset'];assert ret['historyBytes']<632574464
for point in [ret['early'],ret['late']]:assert all(p['hash']==point['hash'] for p in ret['probes'] if p['frame']==point['frame'])
for scene in ['temporal','collapse','tank']:
 capture=check('capture-'+scene+'-run.json');assert capture['checks'] and all(c['pass'] for c in capture['checks'])
 take=json.loads((REVIEW/'captures'/f'{scene}.take.json').read_text());assert take['status']=='recorded' and not take['errors'];assert take['recorder']['fps']==30 and take['recorder']['capturedFrames']>500
 media=check(scene+'-media.json');assert media['status']=='pass' and not media['violations']
segment=check('capture-temporal-run.json')['fixedSlowSegment'];assert segment['wallSeconds']>=6 and segment['comparisons']>=300 and segment['poseChanges']==segment['comparisons']
visual=check('visual-evidence.json');assert 6<=len(visual['stills'])<=10 and len(visual['recordings'])==3
for item in visual['stills']+visual['recordings']:assert item['sha256']==sha((REVIEW/item['file']).read_bytes())
source=REVIEW/'source';assert not source.exists();source.mkdir()
paths=[ROOT/p for p in ['.gitignore','AGENTS.md','CONTEXT.md','README.md','index.html','package.json','package-lock.json']]
for folder in ['src','scripts','tests','docs']:paths.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ['.js','.mjs','.py','.md','.css','.json'])
manifest=[]
for path in sorted(paths):
 rel=path.relative_to(ROOT);dest=source/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,dest);manifest.append(f'{sha(path.read_bytes())}  {rel.as_posix()}')
manifest_text='\n'.join(manifest)+'\n';(REVIEW/'SOURCE_SHA256SUMS.txt').write_text(manifest_text);identity=sha(manifest_text.encode())
before=ROOT/'review/build-02/source';old={p.relative_to(before).as_posix():p for p in before.rglob('*') if p.is_file()};new={p.relative_to(source).as_posix():p for p in source.rglob('*') if p.is_file()};diff=[]
for rel in sorted(old.keys()|new.keys()):
 a=old[rel].read_text().splitlines(keepends=True) if rel in old else [];b=new[rel].read_text().splitlines(keepends=True) if rel in new else []
 lines=difflib.unified_diff(a,b,fromfile='a/'+rel if a else '/dev/null',tofile='b/'+rel if b else '/dev/null')
 # Preserve missing final newlines while producing a patch git can apply.
 diff.extend(line if line.endswith('\n') else line+'\n\\ No newline at end of file\n' for line in lines)
(REVIEW/'SOURCE_DIFF.patch').write_text(''.join(diff))
with tempfile.TemporaryDirectory(prefix='build03-diff-') as tmp:
 restored=Path(tmp)/'source';shutil.copytree(before,restored)
 subprocess.run(['git','apply',str(REVIEW/'SOURCE_DIFF.patch')],cwd=restored,check=True)
 actual={p.relative_to(restored).as_posix():sha(p.read_bytes()) for p in restored.rglob('*') if p.is_file()}
 assert actual=={rel:sha(p.read_bytes()) for rel,p in new.items()}
index=REVIEW/'INDEX.md';text=index.read_text();assert '{{SOURCE_MANIFEST_SHA256}}' in text;index.write_text(text.replace('{{SOURCE_MANIFEST_SHA256}}',identity))
metadata={'round':3,'sourceManifestSHA256':identity,'runtimeSourceIdentity':runtime,'sourceFiles':len(manifest),'sourceDiffSHA256':sha((REVIEW/'SOURCE_DIFF.patch').read_bytes()),'diffAppliedToBuild02AndAllHashesMatched':True,'preservedArchives':PRIOR,'branch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip(),'baseline':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTree':subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True),'publication':'All implementation remains uncommitted. No push, PR, deploy, publication or paid service.'}
(REVIEW/'PACKAGE.json').write_text(json.dumps(metadata,indent=2)+'\n')
include=[REVIEW/n for n in ['INDEX.md','GALLERY.html','ASSIGNMENT.md','SOURCE_SHA256SUMS.txt','SOURCE_DIFF.patch','PACKAGE.json']]+[REVIEW/'checks'/n for n in evidence]+[p for p in source.rglob('*') if p.is_file()]+[p for p in (REVIEW/'captures').iterdir() if p.is_file() and p.suffix in ['.png','.mp4','.json']]
with zipfile.ZipFile(ARCHIVE,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(include):
  rel=p.relative_to(REVIEW);assert not any(a in ['.git','node_modules','.scratch','__pycache__'] for a in rel.parts);assert p.suffix not in ['.zip','.pyc'];z.write(p,rel)
with zipfile.ZipFile(ARCHIVE) as z:
 assert z.testzip() is None
 for line in manifest:
  expected,rel=line.split('  ',1);assert sha(z.read('source/'+rel))==expected
 entries=len(z.namelist())
for name,value in PRIOR.items():assert sha((ROOT/'review'/name).read_bytes())==value
verification={'archive':str(ARCHIVE),'archiveBytes':ARCHIVE.stat().st_size,'archiveSHA256':sha(ARCHIVE.read_bytes()),'runtimeSourceSHA256':runtime['sha256'],'sourceManifestSHA256':identity,'sourceFiles':len(manifest),'archiveEntries':entries,'stills':len(visual['stills']),'recordings':3,'zipCRCAndSourceReadback':True,'build02DiffAppliedAndAllHashesMatched':True,'priorArchivesUnchanged':True}
(ROOT/'review/build-03-verification.json').write_text(json.dumps(verification,indent=2)+'\n');print(json.dumps(verification,indent=2))
