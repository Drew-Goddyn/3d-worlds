# Evidence for the frozen skills build loop

The files under `builder/` are copied byte for byte from the frozen round-three archive. They are builder-produced evidence. Their internal `checks/`, `captures/`, `review/build-03`, `source/`, and local filesystem references are **historical paths inside that retained archive or the original checkout**, not public download links. The large ZIP and videos are retained locally and are not part of this source commit.

## Public copies

- [Frozen source manifest](../SOURCE_SHA256SUMS.txt) and [historical package metadata](../frozen-package.json).
- [Acceptance assessment](builder/acceptance.json) and [physical/visual limits](builder/corrections-and-limits.json).
- [Builder tests](builder/tests.txt), [test attribution](builder/test-run.json), and [static check](builder/static-check.txt).
- [Round comparison](builder/comparison.json), [hardware measurements and 91-second retention](builder/performance-retention.json), and [method profiling before](builder/profile-before.json) / [after](builder/profile-after.json).
- [Original tank failure](builder/tank-contact-baseline.json), [final contact cases](builder/tank-contact.json), and [final recorded-input contact check](builder/tank-contact-final-recording.json).
- [Collapse and settling](builder/collapse-support.json), [temporal checks](builder/temporal-regressions.json), and [render-input restoration](builder/render-restoration.json).
- [Builder-reported independent checks inside the assignments](builder/independent-review.json). These are distinct from the review conversation's final assessment.
- [Recovered builder creation settings](../builder-session-settings.json) and [prompt byte comparison](../prompt-verification.json).

The frozen source README and scripts also retain historical paths and earlier no-publication instructions. They describe the build experiment. Publication authorization applies to this collection import; it does not change those frozen records.

## Publication-path verification

The import was tested from its new collection directory with Node.js 22.23.2. [Fresh check summary](publication/checks.json), [47-case test output](publication/import-test.txt), [static check](publication/import-check.txt), and [browser smoke check](publication/publication-smoke.json). The initial smoke-driver decimal-formatting failure is retained and explained in the summary; the application bytes were not changed.

## Final thinking-partner review

The [final assessment](reviewer/FINAL_REVIEW.md), [reviewer verification summary](reviewer/reviewer-final-verification.json), and [reviewer evidence index](reviewer/README.md) preserve the supplied review unchanged. That review independently reran 46 cases, with one dependency-related case unavailable; seven reruns relocated only imports and fixture paths. Its original model-uncertainty and publication-state statements remain historical. The later [provenance record](../../PROVENANCE.md) records the recovered builder settings and separate collection verification.

## Supplied packet and export identity

The provenance packet was verified as 65,856 bytes with SHA-256 `e35a31907bcdd0adc0de86d9b5c74710c747eb77a553bbcfa6908c1b21c591ba`. Every entry in its manifest passed. The [packet manifest](../packet/PACKET_SHA256SUMS.txt), [preparation record](../packet/preparation.json), and [original packet README](../packet/README.md) describe that retained input packet. Their filenames and preparation status refer to the packet's original layout and time, not this checkout's current publication state. Use the [export map](../documentation-exports.json) for public paths and original/exported hashes.
