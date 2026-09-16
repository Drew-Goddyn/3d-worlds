"""Verify frozen bytes, provenance, and the collection index at publication time."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

entry = Path(__file__).resolve().parents[1]
root = entry.parents[3]
prefix = entry.relative_to(root).as_posix() + '/'
sha = lambda data: hashlib.sha256(data).hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args], cwd=root)

def read_json(path):
    return json.loads(path.read_text())

manifest = entry / 'publication/SOURCE_SHA256SUMS.txt'
manifest_hash = 'ba7b31d92c2fb163ddb564d989fb1668b5ef289b5026f80707adf16868d5ed7f'
runtime_hash = '1c7af145f00ccad9359d1c8d8f389fa021431de4b79f77137d09f727549eb2c4'
archive_hash = '0b5a4c310e89d70a6fc47c61fb846d0d0adb517aee25c028fc9734d8504f9e01'
preview_hash = '97c80e114fc9cf244cb3f5ea23113f90cdbdc1fd0902889744644c766aa5a413'
prompt_hash = '934156d73fa6451150d8c13da45465eee6621658e7d0e8af46a843826dd2f8a7'
assert sha(manifest.read_bytes()) == manifest_hash
lines = manifest.read_text().splitlines()
assert len(lines) == 52
for line in lines:
    expected, name = line.split('  ', 1)
    assert sha((entry / name).read_bytes()) == expected, name
    assert sha(git('show', ':' + prefix + name)) == expected, 'Indexed source ' + name

package = read_json(entry / 'publication/frozen-package.json')
runtime = package['runtimeSourceIdentity']
for item in runtime['files']:
    assert sha((entry / item['path']).read_bytes()) == item['sha256']
runtime_manifest = ''.join(f"{x['sha256']}  {x['path']}\n" for x in runtime['files'])
assert sha(runtime_manifest.encode()) == runtime['sha256'] == runtime_hash
preview_rel = 'prompts/demolition-playground/previews/demolition-skills-build-loop.png'
assert sha((root / preview_rel).read_bytes()) == preview_hash
assert sha(git('show', ':' + preview_rel)) == preview_hash
shared = root / 'prompts/demolition-playground/PROMPT.md'
assert len(shared.read_bytes()) == 6308 and sha(shared.read_bytes()) == prompt_hash

base = 'e4dc0d032020417efc09b519722c4cfafa118ea4'
old = json.loads(git('show', base + ':showcase/attempts.json'))
catalog = read_json(root / 'showcase/attempts.json')
assert catalog['attempts'][:-1] == old['attempts']
assert {k: v for k, v in catalog.items() if k != 'attempts'} == {k: v for k, v in old.items() if k != 'attempts'}
item = catalog['attempts'][-1]
assert item['id'] == 'demolition-skills-build-loop'
for key in ['directory', 'preview', 'creationSettingsEvidence', 'promptVerification', 'agreedInterpretations', 'evidence', 'provenance', 'provenanceData', 'finalReview', 'publicationVerification']:
    assert (root / item[key]).exists(), key

provenance = read_json(entry / 'provenance.json')
settings = read_json(entry / 'publication/builder-session-settings.json')
assert provenance['id'] == item['id']
assert provenance['name'] == item['name']
assert provenance['publicationStatus'] == 'collection-import-record'
model = provenance['modelProvenance']
assert model['leadModel'] == item['leadModel'] == 'gpt-6-astra'
assert model['reasoningEffort'] == item['reasoningEffort'] == 'max'
assert model['creationDate'] == item['createdOn'] == settings['createdOn'] == '2026-09-15'
assert model['implementationSessionStartUTC'] == settings['sessionStartedUTC']
assert settings['publicationTurnExcluded'] and model['publicationTurnsExcluded']
assert [x['round'] for x in settings['assignments']] == [1, 2, 3]
assert all(x['model'] == 'gpt-6-astra' and x['reasoningEffort'] == 'max' for x in settings['assignments'])
assert item['provenanceStatus'] == 'verified-from-creation-records'
assert item['reviewPartner'] == model['reviewPartner']
assert model['reviewPartner']['model'] == model['reviewPartner']['reasoningEffort'] == 'unverified'
assert item['creationCommit'] is None and provenance['source']['implementationCommitAtFreeze'] is None
assert item['sourceRepositoryBaseline'] == provenance['source']['baselineCommit'] == '186001a2f22b98f3c127a535f742e1eca1935343'
for key, value in [('archiveSHA256', archive_hash), ('sourceManifestSHA256', manifest_hash), ('runtimeSourceSHA256', runtime_hash), ('sourceFiles', 52)]:
    assert provenance['source'][key] == item['frozenArtifact'][key] == value
workflow = provenance['workflow']
assert (workflow['clarificationRoundsUsed'], workflow['clarificationRecommendationsAccepted'], workflow['buildAssignmentsUsed']) == (1, 6, 3)
assert not workflow['oneShot'] and not workflow['administrationIsAnotherBuildRound']
assert not item['comparisonFilmsIncludeThisEntry']
assert provenance['launch'] == item['launch']
assert item['launch']['workingDirectory'] == '.'
assert item['launch']['commands'] == [f'npm --prefix {prefix[:-1]} ci', f'PORT=4176 npm --prefix {prefix[:-1]} start']
assert item['launch']['url'] == 'http://127.0.0.1:4176'
assert read_json(entry / 'package.json')['scripts']['start'] == 'node scripts/server.mjs'
assert (entry / 'scripts/server.mjs').is_file()

review = read_json(entry / 'publication/evidence/reviewer/reviewer-final-verification.json')
review_tests = review['independentReview']['tests']
assert review_tests['unmodifiedDependencyFreeTestFiles']['passed'] == 39
assert review_tests['relocatedOriginalContactHistoryCases']['passed'] == 7
assert not review_tests['fullNpmSuiteRerun']
assert provenance['verificationAtFinalReview']['independentRerun']['passed'] == 46
assert not provenance['verificationAtFinalReview']['independentRerun']['fullSuiteRerun']
assert sha((entry / 'publication/evidence/reviewer/FINAL_REVIEW.md').read_bytes()) == '1313579f0d89473cf3e8936d79220efef0124075c3f9486ec48a20ddb81218e8'
checks = read_json(entry / 'publication/evidence/publication/checks.json')
assert checks['tests'] == {'total': 47, 'passed': 47, 'failed': 0, 'skipped': 0, 'output': 'import-test.txt'}
assert checks['staticCheck']['passed'] and checks['browserSmoke']['passed']
assert checks['checkedSource']['runtimeSourceSHA256'] == runtime_hash
assert checks['checkedSource']['sourceManifestSHA256'] == manifest_hash
assert provenance['verificationAtCollectionImport']['tests']['passed'] == 47
assert not provenance['verificationAtCollectionImport']['performanceBenchmark']
assert not checks['gitWhitespaceCheck']['passed']
assert checks['gitWhitespaceCheck']['unchangedFrozenInput']
assert len(checks['gitWhitespaceCheck']['reproducedDirectlyFromArchive']) == 2
for evidence in (entry / 'publication').rglob('*.json'):
    read_json(evidence)

exports = read_json(entry / 'publication/documentation-exports.json')
assert exports['suppliedPacket']['bytes'] == 65856
assert exports['suppliedPacket']['sha256'] == 'e35a31907bcdd0adc0de86d9b5c74710c747eb77a553bbcfa6908c1b21c591ba'
assert exports['suppliedPacket']['allManifestEntriesVerified']
packet_manifest = entry / exports['suppliedPacket']['manifest']
assert sha(packet_manifest.read_bytes()) == exports['suppliedPacket']['manifestSHA256']
originals = dict(line.split('  ', 1)[::-1] for line in packet_manifest.read_text().splitlines())
assert len(exports['packetFiles']) == len(originals) == 9
for record in exports['packetFiles']:
    assert originals[record['packetEntry']] == record['originalSHA256']
    if record['publicPath']:
        assert sha((entry / record['publicPath']).read_bytes()) == record['exportSHA256'], record['publicPath']
for record in exports['independentReviewArchive']['exports']:
    assert sha((entry / record['publicPath']).read_bytes()) == record['originalSHA256'] == record['exportSHA256'], record['publicPath']

shared_files = {'README.md', 'showcase/README.md', 'showcase/attempts.json', 'prompts/demolition-playground/README.md'}
docs = [entry / 'PROVENANCE.md', *(entry / 'publication').rglob('*.md')]
docs += [root / name for name in shared_files if name.endswith('.md')]
link_count = 0
for doc in docs:
    for href in re.findall(r'\[[^\]]*\]\(([^)]+)\)', doc.read_text()):
        if '://' in href or href.startswith('#'):
            continue
        target = href.split('#', 1)[0]
        if target:
            assert (doc.parent / target).exists(), str(doc) + ': ' + href
            link_count += 1

# Compare the index with the integration base so this also works immediately
# after committing, when the index and HEAD contain the same verified import.
indexed = git('diff', '--cached', base, '--name-only').decode().splitlines()
assert indexed, 'Stage the scoped import before running this check.'
secret_patterns = [rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', rb'github_pat_[A-Za-z0-9_]{40,}', rb'gh[pousr]_[A-Za-z0-9]{30,}', rb'AKIA[0-9A-Z]{16}']
for name in indexed:
    assert name in shared_files or name == preview_rel or name.startswith(prefix), name
    path = Path(name)
    assert not any(part in path.parts for part in ['node_modules', '.git', '.scratch', '__pycache__']), name
    assert path.suffix not in ['.zip', '.mp4', '.webm', '.pyc', '.jsonl'], name
    data = git('show', ':' + name)
    assert data == (root / name).read_bytes(), 'Unstaged change: ' + name
    assert len(data) < 5 * 1024 * 1024, name
    assert not any(re.search(pattern, data) for pattern in secret_patterns), 'Credential marker in ' + name

print(json.dumps({
    'frozenSourceFilesMatched': 52,
    'sourceManifestSHA256': manifest_hash,
    'runtimeSHA256': runtime_hash,
    'previewMatchesFrozenCapture': True,
    'sharedPromptByteIdentical': True,
    'existingCatalogEntriesUnchanged': True,
    'otherCollectionTreesUnchanged': True,
    'indexedImportFiles': len(indexed),
    'indexedScopeValid': True,
    'indexedFrozenSourceMatches': True,
    'noArchivesVideosCachesOrCredentialMarkers': True,
    'publicLinksChecked': link_count,
    'catalogAndProvenanceConsistent': True,
    'reviewerEvidenceByteIdentical': True,
    'documentationExportHashesVerified': True,
    'verificationRecordsAttributedSeparately': True,
    'note': 'Publication checkpoint only. This check does not rerun application tests or assert remote push, PR, merge, or deployment state.'
}, indent=2))
