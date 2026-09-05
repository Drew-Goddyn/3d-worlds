# Demolition comparison recorder

Read `STATUS.json` and the independent reports in `evidence/` for the current recording and publication state.

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

`calibrate` currently writes candidate evidence, not independent approval. An independent reviewer must establish framing, charge visibility, native action identity, history preservation and complete crane/swing bounds before creating the run's `calibration/independent-review.json` (`status: pass`, exact `fingerprint`). Gap attribution compares native animation and callback intervals with CDP frame-swap times in epoch space. Bracketed wall/monotonic clock probes before and after capture consume the fixed one-output-frame matching budget. Visible marker displacement measures presentation delay, not clock offset. All gaps remain in evidence; unexplained gaps entering the film remain inconclusive. Actual footage and the offline viewer need a fresh final review after technical media checks. Publication requires `independent-verification.json` with `status: pass`, the exact committed revision, and SHA-256 hashes of all six release assets. A pre-existing release is an error, never an overwrite opportunity.

The output layout separates raw/rehearsal/official data, calibration, clean masters, delivery films, and release assets. Keep `.demo-work` out of Git. The release should contain three model-labeled films, the clean-master composite, viewer ZIP, evidence ZIP and `SHA256SUMS`; clean masters remain internal.

## Native interface and calibration decisions

The user authorized accurately reported native ground-floor facade hits for Astra after independent raycasts proved its columns are occluded by exterior geometry. Its hit records retain actual building/floor membership and coordinates; observation-only column keys are never substituted for hit identity. Sol uses actual structural supports and the first build preserves automatic placement.

The ball shot uses the recorded native ball-and-anchor sweep from the first dedicated movement rehearsal, with a shared padding rule of 15% or four world units on every axis. These traces and their hashes are checked in under the prompt's calibration metadata. They are unioned with the pristine bank and complete crane. This retains the shared 45-degree FOV and native fog; fitting the unvisited full theoretical tether sphere had made Astra invisible. Official movement is checked against the fixed shot; the camera is never refitted during a take.
