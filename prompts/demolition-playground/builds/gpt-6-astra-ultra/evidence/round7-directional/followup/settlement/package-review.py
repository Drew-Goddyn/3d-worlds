"""Evidence-only ZIP and reference/hash checks. Repository-only; standard library."""
from pathlib import Path
import hashlib,json,re,sys,tempfile,zipfile,shutil
root=Path(__file__).resolve().parent
archive=Path(sys.argv[1]);archive.parent.mkdir(parents=True,exist_ok=True)
selected=[root/name for name in ['REVIEW.md', 'viewer.html', 'before-left.mp4', 'current-left.mp4', 'current-front.mp4', 'current-side.mp4', 'support-before.png', 'current-left.png', 'current-side-25s.png', 'current-support-angle.png', 'current-rebuilt.png', 'before-recordings.json', 'current-recordings.json', 'current-native-inspection.json', 'current-native-penetration.json', 'independent-review.json', 'current-focused.log', 'current-diagonal-failures.json', 'current-diagonal-failures.log', 'current-restoration.json', 'continuous-experiment.json', 'continuous-experiment-selected.log', 'measurements.json', 'media-check.json']]
names={p.name for p in selected};references=[]
for name in ['REVIEW.md','viewer.html']:
 text=(root/name).read_text()
 refs=re.findall(r'\]\(([^)]+)\)',text)+re.findall(r'(?:src|href)="([^"]+)"',text)
 for ref in refs:
  if re.match(r'^[a-z]+:',ref):continue
  target=ref.split('#')[0];assert target in names or target=='manifest.json',(name,target);references.append({'from':name,'to':target})
for row in json.loads((root/'media-check.json').read_text())['media']:
 assert row['file'] in names
 assert hashlib.sha256((root/row['file']).read_bytes()).hexdigest()==row['mp4SHA256']
manifest={'baseline':'98633bf46e4e5c2ebd8a2ee02ad979bd9eb815fa','runtimeCommit':'24055bb553c792d97ec4f9eb592aa06becc7f352','productStatus':'REJECTED; unfinished; do not merge','kind':'evidence only; manifest excludes its own hash','files':[{'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in selected],'references':references}
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
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'members':len(selected)+1,'referenceChecks':len(references),'productStatus':'REJECTED','cleanExtraction':str(clean)},indent=2))
