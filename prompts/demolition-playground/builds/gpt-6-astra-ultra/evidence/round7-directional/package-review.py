"""Evidence-only ZIP and reference/hash checks. Repository-only; standard library."""
from pathlib import Path
import hashlib,json,re,sys,tempfile,zipfile,shutil
root=Path(__file__).resolve().parent
archive=Path(sys.argv[1]);archive.parent.mkdir(parents=True,exist_ok=True)
selected=sorted(p for p in root.iterdir() if p.suffix in {'.md','.html','.json','.log','.mp4','.jpg'} and p.name not in {'continuation.json','manifest.json'})
names={p.name for p in selected};references=[]
for name in ['REVIEW.md','viewer.html']:
 text=(root/name).read_text()
 refs=re.findall(r'\]\(([^)]+)\)',text)+re.findall(r'(?:src|href)="([^"]+)"',text)
 for ref in refs:
  if re.match(r'^[a-z]+:',ref):continue
  target=ref.split('#')[0];assert target in names,(name,target);references.append({'from':name,'to':target})
for label in ['baseline','final']:
 for route in ['front','side','clean-side','collapse']:assert label+'-'+route+'.mp4' in names
for row in json.loads((root/'media-check.json').read_text())['media']:
 assert row['file'] in names
 assert hashlib.sha256((root/row['file']).read_bytes()).hexdigest()==row['mp4SHA256']
manifest={'baseline':'e4dc0d032020417efc09b519722c4cfafa118ea4','baselineMediaServedHead':'3d2e55e6ae4036fc6c91797acc4d2255b55ba1d9','resultCommit':'9b9a743e7c0fc536da1e94cec74801cba9348a7a','resultSourceTree':'bbfe3fc266fa6ba305da3431231fdf0b66d8eb81','kind':'evidence only; manifest excludes its own hash','files':[{'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in selected],'references':references}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
if archive.exists():
 backup=Path(tempfile.mkdtemp(prefix='astra-r7-prior-archive-'))/archive.name;shutil.copy2(archive,backup)
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in selected+[root/'manifest.json']:z.write(p,p.name)
clean=Path(tempfile.mkdtemp(prefix='astra-r7-clean-extract-'))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None;assert len(z.namelist())==len(set(z.namelist()))
 for f in manifest['files']:
  data=z.read(f['path']);assert len(data)==f['bytes'];assert hashlib.sha256(data).hexdigest()==f['sha256']
 z.extractall(clean)
for ref in references:assert (clean/ref['to']).is_file()
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'members':len(selected)+1,'referenceChecks':len(references),'cleanExtraction':str(clean)},indent=2))
