"""Build the immutable first-round source/evidence archive; refuse to overwrite it."""
from pathlib import Path
import hashlib, json, shutil, zipfile
ROOT=Path(__file__).resolve().parent.parent
REVIEW=ROOT/'review'/'build-01'
ARCHIVE=ROOT/'review'/'build-01.zip'
if ARCHIVE.exists():
    raise SystemExit('build-01.zip already exists. Preserve the first-build snapshot; choose another round name.')
source=REVIEW/'source'
source.mkdir(parents=True,exist_ok=True)
paths=[ROOT/p for p in ['.gitignore','AGENTS.md','CONTEXT.md','README.md','index.html','package.json','package-lock.json']]
for folder in ['src','scripts','tests','docs']:
    paths.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ['.js','.mjs','.py','.md','.css'])
manifest=[]
for path in sorted(paths):
    relative=path.relative_to(ROOT)
    dest=source/relative
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(path,dest)
    manifest.append(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {relative.as_posix()}')
manifest_text='\n'.join(manifest)+'\n'
(REVIEW/'SOURCE_SHA256SUMS.txt').write_text(manifest_text)
identity=hashlib.sha256(manifest_text.encode()).hexdigest()
index=(REVIEW/'INDEX.md').read_text().replace('{{SOURCE_MANIFEST_SHA256}}',identity)
(REVIEW/'INDEX.md').write_text(index)
# The runtime identity in every final browser evidence file must match the packaged source.
runtime=['index.html','package.json','package-lock.json','src/app.js','src/style.css','src/view.js','src/world.js','scripts/server.mjs']
runtime_files={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in runtime}
for p in (REVIEW/'checks').glob('*.json'):
    data=json.loads(p.read_text())
    assert not data.get('errors'), f'Browser errors: {p}'
    assert not any(c.get('pass') is False for c in data.get('checks',[])), f'Failed browser check: {p}'
    if 'comparisons' in data: assert all(c['worldExact'] and c['visibleInputsExact'] for c in data['comparisons'])
    if 'retention' in data: assert data['retention']['exactReset']
    if 'sourceIdentity' in data:
        for f in data['sourceIdentity']['files']:
            assert runtime_files[f['path']]==f['sha256'], f'Stale browser evidence: {p}: {f["path"]}'
assert (REVIEW/'INDEX.md').exists()
assert len(list((REVIEW/'captures').glob('*.png')))>20
with zipfile.ZipFile(ARCHIVE,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(REVIEW.rglob('*')):
        if not p.is_file(): continue
        relative=p.relative_to(REVIEW)
        assert all(part not in ['.git','node_modules','.scratch'] for part in relative.parts)
        assert p.suffix!='.zip'
        z.write(p,relative)
with zipfile.ZipFile(ARCHIVE) as z:
    assert z.testzip() is None
    for line in manifest:
        expected,relative=line.split('  ',1)
        assert hashlib.sha256(z.read('source/'+relative)).hexdigest()==expected
print(json.dumps({'archive':str(ARCHIVE),'archiveBytes':ARCHIVE.stat().st_size,'archiveSHA256':hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),'sourceManifestSHA256':identity,'sourceFiles':len(manifest),'archiveEntries':len(zipfile.ZipFile(ARCHIVE).namelist())},indent=2))
