"""Evidence-only ZIP and reference/hash checks. Repository-only; standard library."""
from pathlib import Path
import hashlib,json,re,sys,tempfile,zipfile,shutil
root=Path(__file__).resolve().parent
archive=Path(sys.argv[1]);archive.parent.mkdir(parents=True,exist_ok=True)
selected=sorted(p for p in root.iterdir() if p.suffix in {'.md','.html','.json','.jsonl','.log','.mp4','.png'} and p.name not in {'continuation.json','manifest.json','package-review.json','support-view.html'})
names={p.name for p in selected};references=[]
for name in ['REVIEW.md','viewer.html','independent-review.md']:
 text=(root/name).read_text()
 refs=re.findall(r'\]\(([^)]+)\)',text)+re.findall(r'(?:src|href)="([^"]+)"',text)
 for ref in refs:
  if re.match(r'^[a-z]+:',ref):continue
  target=ref.split('#')[0];assert target in names or target=='manifest.json',(name,target);references.append({'from':name,'to':target})
for name in ['baseline-left.mp4','final-left.mp4','final-front.mp4','final-side.mp4','final-collapse.mp4','final-left-later-cut.mp4','final-time-controls.mp4']:assert name in names
for row in json.loads((root/'media-check.json').read_text())['media']:
 assert row['file'] in names
 assert hashlib.sha256((root/row['file']).read_bytes()).hexdigest()==row['mp4SHA256']
manifest={'baseline':'bdfde0a8930a17e190e12e93c5481e97fea3b6a3','resultCommit':'02e3fb29b9c39642709bab1433c2e959372bce73','runtimeCommit':'a1c75deba4e1e07361f92807badc515f8e20a571','resultSourceTree':'7f5353d10273a06158b711ec354cfbb0f9286103','kind':'evidence only; manifest excludes its own hash','files':[{'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in selected],'references':references}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
if archive.exists():
 backup=Path(tempfile.mkdtemp(prefix='astra-r7-followup-prior-archive-'))/archive.name;shutil.copy2(archive,backup)
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in selected+[root/'manifest.json']:z.write(p,p.name)
clean=Path(tempfile.mkdtemp(prefix='astra-r7-followup-clean-extract-'))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None;assert len(z.namelist())==len(set(z.namelist()))
 for f in manifest['files']:
  data=z.read(f['path']);assert len(data)==f['bytes'];assert hashlib.sha256(data).hexdigest()==f['sha256']
 z.extractall(clean)
for ref in references:assert (clean/ref['to']).is_file()
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'members':len(selected)+1,'referenceChecks':len(references),'cleanExtraction':str(clean)},indent=2))
