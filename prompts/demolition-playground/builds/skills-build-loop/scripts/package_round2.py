"""Package round two, checking evidence identity and preserving the first archive."""
from pathlib import Path
import difflib
import hashlib
import json
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / 'review' / 'build-02'
ARCHIVE = ROOT / 'review' / 'build-02.zip'
FIRST = ROOT / 'review' / 'build-01.zip'
FIRST_SHA = '99d544f40651e148510bda17f884473c842f9a1e1a140885005a4fd1d8098957'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def read_check(name):
    return json.loads((REVIEW / 'checks' / name).read_text())

if ARCHIVE.exists():
    raise SystemExit('Preserve build-02.zip. It already exists; this script will not overwrite it.')
assert sha(FIRST.read_bytes()) == FIRST_SHA, 'The first archive changed.'
runtime = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e',
     "import {sourceIdentity} from './scripts/source-identity.mjs'; console.log(JSON.stringify(await sourceIdentity()))"],
    cwd=ROOT, text=True))
for path in (REVIEW / 'checks').glob('*.json'):
    data = json.loads(path.read_text())
    assert not data.get('errors'), f'Browser errors: {path.name}'
    assert all(c.get('pass') is not False for c in data.get('checks', [])), f'Failed check: {path.name}'
    if 'sourceIdentity' in data:
        assert data['sourceIdentity'] == runtime, f'Stale runtime evidence: {path.name}'
tests = read_check('test-run.json')
assert tests['tests'] == 39 and tests['passed'] == 39 and tests['failed'] == 0
assert tests['outputSHA256'] == sha((REVIEW / 'checks' / 'tests.txt').read_bytes())
assert 'PASS:' in (REVIEW / 'checks' / 'static-check.txt').read_text()
temporal = read_check('temporal-regressions.json')
assert all(s['changes'] == 120 for s in temporal['samples'])
assert all(abs(s['reversedSeconds'] - 1) < 1e-9 for s in temporal['reverse'])
render = read_check('render-restoration.json')
assert all(c['worldExact'] and c['visibleInputsExact'] for c in render['comparisons'] + render['fractional'])
assert render['pristineWorldExact'] and render['pristineVisibleExact'] and render['qualityPreservesWorld']
performance = read_check('performance-retention.json')
assert all(s['count'] >= 100 for s in performance['samples'])
retention = performance['retention']
assert retention['simulationSeconds'] > 90 and retention['exactReset']
for point in [retention['early'], retention['late']]:
    assert all(p['hash'] == point['hash'] for p in retention['probes'] if p['frame'] == point['frame'])
for scene in ['temporal', 'collapse', 'tank']:
    capture = read_check(f'capture-{scene}-run.json')
    assert capture['checks'] and all(c['pass'] for c in capture['checks'])
    take = json.loads((REVIEW / 'captures' / f'{scene}.take.json').read_text())
    assert take['status'] == 'recorded' and not take['errors']
    assert take['recorder']['capturedFrames'] > 500 and take['recorder']['fps'] == 30
    media = read_check(f'{scene}-media.json')
    assert media['status'] == 'pass' and not media['violations'], f'Invalid media: {scene}'
    if scene == 'temporal':
        segment = capture['fixedSlowSegment']
        assert segment['wallSeconds'] >= 6 and segment['comparisons'] >= 300
        assert segment['poseChanges'] == segment['comparisons']
captures = list((REVIEW / 'captures').glob('*.png'))
assert 8 <= len(captures) <= 12
assert len(list((REVIEW / 'captures').glob('*.mp4'))) == 3
visual = read_check('visual-evidence.json')
for item in visual['recordings'] + visual['stills']:
    assert item['sha256'] == sha((REVIEW / item['file']).read_bytes())
# The package deliberately includes a known visual/contact failure, not a green claim.
contact = read_check('tank-contact-diagnostic.json')
assert contact['recordedControlReplayMatches'] and contact['intersectingSamples'] > 0
assert any(r['status'] == 'failed' and 'Tank contact' in r['behavior'] for r in read_check('acceptance.json')['requirements'])

source = REVIEW / 'source'
assert not source.exists(), 'Do not overwrite an existing expanded source snapshot.'
source.mkdir(parents=True)
paths = [ROOT / p for p in ['.gitignore', 'AGENTS.md', 'CONTEXT.md', 'README.md', 'index.html', 'package.json', 'package-lock.json']]
for folder in ['src', 'scripts', 'tests', 'docs']:
    paths.extend(p for p in (ROOT / folder).rglob('*') if p.is_file() and p.suffix in ['.js', '.mjs', '.py', '.md', '.css'])
manifest = []
for path in sorted(paths):
    relative = path.relative_to(ROOT)
    destination = source / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)
    manifest.append(f'{sha(path.read_bytes())}  {relative.as_posix()}')
manifest_text = '\n'.join(manifest) + '\n'
(REVIEW / 'SOURCE_SHA256SUMS.txt').write_text(manifest_text)
identity = sha(manifest_text.encode())

before = ROOT / 'review' / 'build-01' / 'source'
old_files = {p.relative_to(before).as_posix(): p for p in before.rglob('*') if p.is_file()}
new_files = {p.relative_to(source).as_posix(): p for p in source.rglob('*') if p.is_file()}
diff = []
for relative in sorted(old_files.keys() | new_files.keys()):
    old = old_files[relative].read_text().splitlines(keepends=True) if relative in old_files else []
    new = new_files[relative].read_text().splitlines(keepends=True) if relative in new_files else []
    diff.extend(difflib.unified_diff(old, new, fromfile='a/' + relative if old else '/dev/null',
                                     tofile='b/' + relative if new else '/dev/null'))
(REVIEW / 'SOURCE_DIFF.patch').write_text(''.join(diff))
index_path = REVIEW / 'INDEX.md'
index = index_path.read_text()
assert '{{SOURCE_MANIFEST_SHA256}}' in index
index_path.write_text(index.replace('{{SOURCE_MANIFEST_SHA256}}', identity))
metadata = {
    'round': 2, 'sourceManifestSHA256': identity, 'runtimeSourceIdentity': runtime,
    'sourceFiles': len(manifest), 'sourceDiffSHA256': sha((REVIEW / 'SOURCE_DIFF.patch').read_bytes()),
    'preservedBuild01ArchiveSHA256': FIRST_SHA,
    'branch': subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip(),
    'baseline': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'workingTree': subprocess.check_output(['git', 'status', '--short'], cwd=ROOT, text=True),
    'publication': 'Implementation uncommitted. No commit, push, PR, deployment or publication performed.',
}
(REVIEW / 'PACKAGE.json').write_text(json.dumps(metadata, indent=2) + '\n')
assert (REVIEW / 'GALLERY.html').exists()
with zipfile.ZipFile(ARCHIVE, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(REVIEW.rglob('*')):
        if not path.is_file():
            continue
        relative = path.relative_to(REVIEW)
        assert not any(part in ['.git', 'node_modules', '.scratch', '__pycache__'] for part in relative.parts)
        assert path.suffix not in ['.zip', '.pyc']
        archive.write(path, relative)
with zipfile.ZipFile(ARCHIVE) as archive:
    assert archive.testzip() is None
    for line in manifest:
        expected, relative = line.split('  ', 1)
        assert sha(archive.read('source/' + relative)) == expected
    entries = len(archive.namelist())
assert sha(FIRST.read_bytes()) == FIRST_SHA
verification = {
    'archive': str(ARCHIVE), 'archiveBytes': ARCHIVE.stat().st_size,
    'archiveSHA256': sha(ARCHIVE.read_bytes()), 'sourceManifestSHA256': identity,
    'runtimeSourceSHA256': runtime['sha256'], 'sourceFiles': len(manifest), 'archiveEntries': entries,
    'stills': len(captures), 'recordings': 3, 'zipCRCAndSourceReadback': True,
    'build01Unchanged': True,
}
(ROOT / 'review' / 'build-02-verification.json').write_text(json.dumps(verification, indent=2) + '\n')
print(json.dumps(verification, indent=2))
