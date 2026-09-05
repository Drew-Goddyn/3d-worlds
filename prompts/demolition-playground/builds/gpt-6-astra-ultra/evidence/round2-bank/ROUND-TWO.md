# Mercantile Bank — round two

A locally playable continuation for player review. Implementation commit: `585c0b8`. No push, merge, publication or deployment was performed.

## Provenance and launch

- Exact baseline: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`. Initial working tree was clean and detached; local main, freshly fetched origin/main and HEAD all matched. Created `round2/astra-mercantile-bank` before editing. Main and the other builds remain unchanged.
- Session model and reasoning: **unverified**. No reliable turn-setting metadata was used. The `gpt-6-astra-ultra` directory describes the original attempt, not this continuation.
- Exact follow-up commission: [FOLLOW-UP.md](FOLLOW-UP.md).
- From repository root: `node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs`, then open **http://127.0.0.1:4173**. The existing offline server and vendored Three.js 0.180.0 are unchanged. No dependency installation is needed.
- The bank is the cream-stone building at the front left of the district, beside the brick building with the water tank. Right-drag to center it, then scroll closer. Click its right corner with the ball for a localized breach. For a larger failure, put three charges across the front ground floor and three along its right side; detonate, rewind, and try a different target from the past.

## What changed

Only the bank replaces its rigid storeys with 27 connected support bays and 1,538 retained architectural pieces (1,537 in Node, which omits the canvas inscription). Individual pier strength, vertical support and lateral bridging govern deflection and release. Masonry courses and column drums release what rests on them; falling pieces can damage surviving support. Instancing shares geometry without sharing motion. All new damage, motion, settling, impact and scoring state participates in the original minute of rewind and permanent pristine rebuild.

The recipe adds real arched openings, rusticated limestone, fluted columns/capitals, bronze doors, deep cornices, balustrades, a pediment and copper roof feature. Broken openings reveal thick floors, piers, tiled flooring and teller counters. The original shell is not hidden behind this geometry. Important rubble persists permanently.

Browser revision corrected arch gaps and surface overlap, roof pitch, an obscured inscription, variable-frame settling jitter and overly upright rubble. Independent review found and reverified the correction for repeated rubble scoring.

## Evidence and reproduction

- Baseline: `baseline-overview.png`, `baseline-close.png`, `baseline-ball-aftermath.png`, `baseline-tests.txt` (15/15).
- Candidate: matched `baseline-matched-close.png` / `final-matched-close.png`, `final-overview.png`, `final-native-orbit.png`, `final-intact-close.png`, `final-charges-placed.png`, `final-charges-0-4s.png`, `final-charges-1-5s.png`, `final-charges-3s.png`, `final-charges-6s.png`, `final-charges-12s.png`.
- Temporal evidence: `final-charges-real-time.webm` records the actual canvas at 30 fps using browser MediaRecorder timestamps. `final-time-controls-real-time.webm` records native scrubbing, slow replay, rewind, an alternate ball action, and rebuild. Canvas recordings omit the DOM control overlay; corresponding screenshots and `native-playthrough.json` preserve the controls and sampled states. `final-collapse-sequence.png` is an ordered extract from the normal-speed event.
- `playthrough.py` reproduces the six real canvas clicks and native button/range interactions through the existing agent-browser CLI. Its camera helper changes framing only. It does not inject damage or advance simulation directly. The JSON records click coordinates and actual charge inventory. The demonstrated front/right sequence releases 15 bays and settles 1,006 architectural bodies. Screenshot suffixes name requested wait targets; actual sampled simulation times are in JSON and include capture latency.
- `extra-inspection.py` / `extra-native-controls.json` reproduce and record native orbit/pan/zoom, two different ball targets, action camera, and held crane rotation/cable/swing controls. `final-ball-left-real-time.webm` and `final-ball-right-real-time.webm` show the two native ball actions.
- `native-playthrough.json` checks that scrubs restore the actual recorded bank and charge snapshot, records the old and branched history endpoints, and checks pristine state after rebuild. The separate independent probes cover deterministic resumed physics and rolling history beyond sixty seconds.
- `baseline-ball.webm` and `charges-normal.webm` are **exploratory CLI-recorder clips, not real-time evidence**: that recorder compressed elapsed time. They were useful for ordered visual inspection but must not be used for speed or FPS claims. The explicitly named `*-real-time.webm` files use canvas MediaRecorder instead.
- Tests: `npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test` — **20/20 pass** (15 existing checks plus five bank checks), with a separate independent probe.
- Additional damage inspection: `final-rubble-reverse-angle.png` shows surviving floor depth and supports from behind the damaged bank.
- Independent technical review: `independent-review.md`, with its reproducible probe, raw test output and source hashes. Probe-driven destruction is diagnostic, not evidence of player input.

## Responsiveness

`performance.py` / `performance.json` compare **fresh headless Chrome processes**, 1440×900, DPR 1, high quality, no recorder, 240 requestAnimationFrame intervals per phase. Renderer: **ANGLE Metal / Apple M2 Pro**. Runtime: Node 26.3.0. Source: implementation commit `585c0b8`; unchanged baseline on port 4176. Earlier reused-browser measurements were superseded because capture state remained allocated.

| Phase | Baseline mean / p95 | Candidate mean / p95 |
|---|---:|---:|
| Intact overview | 16.6 / 17.2 ms | 16.6 / 17.2 ms |
| Native bank swing | 16.6 / 17.3 ms | 16.7 / 17.8 ms |
| Multi-building sequence | 16.6 / 17.4 ms | 16.7 / 18.0 ms |

Same-screen inputs produced different physical workloads: the baseline ball had already collapsed the waterworks, so a subsequent charge there failed; the candidate accepted it. This is a player-sequence comparison, not an equal-workload speedup claim. Sampled JS heap at sequence end was **53 MB baseline / 101 MB candidate**, subject to GC. Intact triangles were 76,052 / 127,674; draw calls 400 / 404. History and surroundings were preserved.

`charge-performance.py` / `charge-performance.json` additionally sample the candidate's six-charge collapse at the close camera: mean **16.6 ms**, p95 **18.6 ms**, max **19.8 ms** over 240 frames. Fifteen bays failed during that sample. No video recorder ran. These short headless measurements do not establish foreground laptop FPS; full-minute heap growth and GPU memory were not measured.

## Limits

This is a bank-specific structural approximation, not civil engineering or a general rigid-body solver. Contacts use rotated piece bounds and a central footprint; active pieces can overlap transiently, and rubble does not have full frictional interlocking. Some arches and trim remain tied to a supported bay until its connection releases. Fractures are prepared construction joints, not arbitrary cut surfaces. Glass is prepared panels rather than a full cracking solver. The interior is selected architectural depth, not an explorable complete bank. Existing neighboring buildings retain their original coarse-floor behavior. The UI score is playful rather than a calibrated mass estimate.

The inspected result is a candidate for the owner's visual/play judgment. Passing checks does not establish that acceptance.
