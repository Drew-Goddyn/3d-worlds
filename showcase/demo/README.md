# Demolition comparison recorder

Implementation in progress. Read `STATUS.json` and the independent reports in `evidence/` before resuming. No official take or release has been approved yet.

## Run locally

Existing installations are used: Node, agent-browser, the repository's Playwright library, FFmpeg, ffprobe, Git, tar, and GitHub CLI. No package additions or game dependency changes are required. The Sol build needs its existing node_modules installation.

```
npm run demo -- calibrate --run demolition-demo-v1
npm run demo -- pilot --run demolition-demo-v1
npm run demo -- record --run demolition-demo-v1
npm run demo -- assemble --run demolition-demo-v1
npm run demo -- verify --run demolition-demo-v1
npm run demo -- publish --run demolition-demo-v1
```

`--prompt demolition-playground` selects the pinned scenario. `--build site|sol|astra` narrows development work. `--run` selects an isolated output directory under `.demo-work`; `--output` can put it on another disk. `pilot --control-only` tests disk capture without game rehearsal. `record --kind rehearsal` retains practice runs separately. `all` runs calibration, pilot/rehearsals, freeze, recording, assembly, and technical verification. Publication is always separate.

The immutable freeze requires an independent calibration report matching the recorder/scenario/calibration fingerprint. If an input changes, start a new run. Original source is extracted with `git archive` at the scenario's pinned commit. Adapter replacements require exact source hashes and unique source anchors. Temporary copies reuse installed modules by symlink. Existing copies reject stale adapter hashes. Patches are generated from the canonical `*-hook.js` files by `node showcase/demo/sync-patches.mjs`.

## Evidence and publication gates

Every take has JPEG frames, CDP timestamps, arrival/ack/write data, bounded queue statistics, raw animation timestamps before each game's clamp, native camera observations, complete native action receipts, and chapter synchronization markers. Failures retain their directories and logs. Capture order and source timestamp order are separately preserved because asynchronous JPEG delivery can arrive out of timestamp order.

The disk queue has four writers, a 120-frame limit and a 128 MiB payload limit. Overflow, failed acknowledgements, write failures and page errors invalidate the take. Encoding holds the last timestamped source frame at each 30-fps output instant. It never advances simulation or interpolates motion.

`calibrate` currently writes candidate evidence, not independent approval. An independent reviewer must establish framing, charge visibility, native action identity, history preservation and complete crane/swing bounds before creating the run's `calibration/independent-review.json` (`status: pass`, exact `fingerprint`). Unexplained capture gaps remain inconclusive. Actual footage and the offline viewer need a fresh final review after technical media checks. Publication requires `independent-verification.json` with `status: pass`, the exact committed revision, and SHA-256 hashes of all six release assets. A pre-existing release is an error, never an overwrite opportunity.

The output layout separates raw/rehearsal/official data, calibration, clean masters, delivery films, and release assets. Keep `.demo-work` out of Git. The release should contain three model-labeled films, the clean-master composite, viewer ZIP, evidence ZIP and `SHA256SUMS`; clean masters remain internal.

## Outstanding acceptance issue

The strict Astra column test rejects native facade hits because the structural columns are covered by exterior geometry. A user decision is pending on recording accurately identified visible ground-floor facade hits instead. Never restore the previous loose tolerance or label a facade hit as a column hit to pass calibration.
