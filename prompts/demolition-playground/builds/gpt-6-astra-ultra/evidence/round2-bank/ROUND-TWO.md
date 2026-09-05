# Mercantile Bank — round two

A locally playable continuation of Astra's existing district, for player review. No push, merge, publication or deployment was performed.

## Provenance and launch

- Exact baseline: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`. Initial working tree was clean and detached; local main, freshly fetched origin/main and HEAD all matched. Created `round2/astra-mercantile-bank` before editing. Main and the other builds remain unchanged.
- Session model and reasoning: **unverified**. No reliable turn-setting metadata was used. The `gpt-6-astra-ultra` directory describes the original attempt, not this continuation.
- Exact follow-up commission: [FOLLOW-UP.md](FOLLOW-UP.md).
- From repository root: `node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs`, then open **http://127.0.0.1:4173**. The existing offline server and vendored Three.js 0.180.0 are unchanged. No dependency installation is needed.
- The bank is the cream-stone building at the front left of the district, beside the brick building with the water tank. Right-drag to center it, then scroll closer. Click its right corner with the ball for a localized breach. For a larger failure, put three charges across the front ground floor and three along its right side; detonate, rewind, and try a different target from the past.

## What changed

The original three rigid floor assemblies are replaced only at the bank by 27 connected support bays. Their individual pier strengths, vertical support and lateral bridging govern local deflection and release. Damaged masonry courses and column drums release the pieces they support. Further hits and falling pieces can destroy surviving support. An isolated corner can fall while other bays remain standing.

The procedural recipe builds recessed arched windows, rusticated limestone, fluted columns and capitals, bronze entrance doors, projecting cornices with dentils, a balustrade, pediment and copper roof feature. Actual openings reveal thick floor fragments, supporting piers, tiled flooring and selected teller counters. The former facade and slabs are not concealed behind this model. All 1,538 browser architectural pieces are retained; instanced geometry shares draw calls, not transforms. The Node fixture has 1,537 pieces because it omits the canvas inscription.

Stone, column and cornice pieces retain their original geometry. Glazing releases earlier and its panels and bronze frames tip into the rubble. Ground impacts can fracture supporting architecture below. Major rubble is never sent into the recycling particle pool. Its strength, motion, settling, impact-pair and one-time scoring state are included in snapshots. The original rolling minute, permanent pristine snapshot and retained-future/alternate-action distinction remain intact.

The first browser candidate exposed missing arch infill, incorrectly pitched roof plates, jitter under variable frame intervals, overly upright window frames in rubble and repeated scoring of struck rubble. These were revised and reinspected. The independent verifier reproduced the scoring defect and its correction.

## Evidence and reproduction

- Baseline: `baseline-overview.png`, `baseline-close.png`, `baseline-ball-aftermath.png`, `baseline-tests.txt` (15/15).
- Candidate: matched `baseline-matched-close.png` / `final-matched-close.png`, `final-overview.png`, `final-native-orbit.png`, `final-intact-close.png`, `final-charges-placed.png`, `final-charges-0-4s.png`, `final-charges-1-5s.png`, `final-charges-3s.png`, `final-charges-6s.png`, `final-charges-12s.png`.
- Temporal evidence: `final-charges-real-time.webm` records the actual canvas at 30 fps using browser MediaRecorder timestamps. `final-time-controls-real-time.webm` records native scrubbing, slow replay, rewind, an alternate ball action, and rebuild. Canvas recordings omit the DOM control overlay; corresponding screenshots and `native-playthrough.json` preserve the controls and sampled states. `final-collapse-sequence.png` is an ordered extract from the normal-speed event.
- `playthrough.py` reproduces the six real canvas clicks and native button/range interactions through the existing agent-browser CLI. Its camera helper changes framing only. It does not inject damage or advance simulation directly. The JSON records click coordinates and actual charge inventory. The demonstrated front/right sequence releases 15 bays and settles 1,006 architectural bodies while other sections remain supported.
- `extra-inspection.py` / `extra-native-controls.json` reproduce and record native orbit/pan/zoom, two different ball targets, action camera, and held crane rotation/cable/swing controls. `final-ball-left-real-time.webm` and `final-ball-right-real-time.webm` show the two native ball actions.
- `native-playthrough.json` checks that scrubs restore the actual recorded bank and charge snapshot, records the old and branched history endpoints, and checks pristine state after rebuild. The separate independent probes cover deterministic resumed physics and rolling history beyond sixty seconds.
- `baseline-ball.webm` and `charges-normal.webm` are **exploratory CLI-recorder clips, not real-time evidence**: that recorder compressed elapsed time. They were useful for ordered visual inspection but must not be used for speed or FPS claims. The explicitly named `*-real-time.webm` files use canvas MediaRecorder instead.
- Independent technical review: `independent-review.md`, with its reproducible probe, raw test output and source hashes. Probe-driven destruction is diagnostic, not evidence of player input.

## Responsiveness

`performance.py` and `performance.json` record the same headless Chrome session, 1440×900, DPR 1, high quality, no video recorder, and 240 requestAnimationFrame intervals per phase. Chrome reported **ANGLE Metal / Apple M2 Pro**, not a software renderer. A temporary unchanged baseline checkout used port 4176. Same-screen ball input was followed by native charges at the waterworks and glass tower; actual inventories are recorded. The baseline ball had already collapsed the waterworks, so that subsequent placement failed there; the candidate's still-standing waterworks accepted it. These are comparable player sequences, not equal physical workloads.

| Phase | Baseline mean / p95 | Candidate mean / p95 |
|---|---:|---:|
| Intact overview | 27.0 / 37.8 ms | 27.2 / 30.9 ms |
| Native bank swing | 27.2 / 37.9 ms | 27.1 / 31.1 ms |
| Multi-building sequence | 27.5 / 38.4 ms | 26.7 / 31.1 ms |

This short headless run does not establish foreground laptop FPS or a speed advantage. JavaScript heap use at the end of the sampled sequence rose from roughly **116 MB to 243 MB**; sampling is affected by GC and the candidate retains more architectural state. Intact overview triangle count rose from 76,052 to 127,866, while draw calls were 400 versus 404. History duration and the surrounding district were not reduced to obtain these results.

## Limits

This is a bank-specific structural approximation, not civil engineering or a general rigid-body solver. Contacts use rotated piece bounds and a central footprint; active pieces can overlap transiently, and rubble does not have full frictional interlocking. Some arches and trim remain tied to a supported bay until its connection releases. Fractures are prepared construction joints, not arbitrary cut surfaces. Glass is prepared panels rather than a full cracking solver. The interior is selected architectural depth, not an explorable complete bank. Existing neighboring buildings retain their original coarse-floor behavior. The UI score is playful rather than a calibrated mass estimate.

The inspected result is a candidate for the owner's visual/play judgment. Passing checks does not establish that acceptance.
