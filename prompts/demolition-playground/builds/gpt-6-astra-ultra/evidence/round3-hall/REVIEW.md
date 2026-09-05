# Banking-hall breach · review

PR #1 was accepted by the owner and merged after provenance correction and fresh technical checks. Round three is ready for an **unmerged owner-review PR**, not owner acceptance.

## Exact references and launch

- Original showcase/media: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`.
- Accepted PR #1 head before documentation closeout: `01ab16128ecf6580321d6d0c7e5e6b076ca15294`; closeout `9906703b144d289f1aa189faaf437dcfddfec096`.
- Exact round-three baseline / PR #1 merge: `6d583d11b73e337114f597a772a5924f769cd562`.
- Complete candidate reviewed anonymously: `1a942df21febcd0df1ecd0a777acf692845e51d4`.
- Final result source, after the single visual correction: `9aee1cad532278b6672cc535fec8685d473a2eaa`. Later commits package evidence and PR status only. Branch: `round3/astra-bank-breach`.
- Session model/reasoning: **unverified**. Historical directory labels are not current-session evidence.
- From repository root: `node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs`, then open **http://127.0.0.1:4173**. Node 20+; tested with Node 26.3.0. No installation, service, deployment or runtime network required.

## What changed and what to try

A connected ground-floor teller hall exists before impact: green counters, writing tables, brass lamps, chairs, deposit drawers, ledgers and loose paper/cash. Wider front glazing uses small retained triangular shards. Glass, framing and heavy masonry transfer different impact energy; papers flutter and furnishings tip or slide on contact. Cleared windows use current solid collision geometry. The ball can lower into the hall. Lost support wakes both small articles and major rubble, and history records their actual future.

For the captured approach, hold **rotate left** about 1.5 seconds, **lengthen cable** about 1.5 seconds, and let the crane settle over the street for six seconds. Aim at the right ground-floor window, then the teller area through the opening, then the left window. Rewind and take another action from the past. The full minute and pristine rebuild remain available.

## Portable media and reproducibility

Open `viewer.html` beside the selected files for normal-speed videos. `baseline-native.webm` and `candidate-native.webm` each run about 29.4 seconds. Native actions complete near 1.5, 10.5 and 19.5 seconds. These are wall-clock completion labels, not exact contact-frame annotations. Browser MediaRecorder retains real timestamps; idle time is not compressed. The canvas recordings omit DOM controls, which the screenshots/input records retain.

Matched front camera: position `[-9,5,35]`, target `[-11,2.1,15]`, 1440×900, DPR 1. World targets: `[-7,2,19.5]`, `[-7.5,1.6,13.45]`, `[-15,2,19.5]`. `capture.py` reproduces real pointer/button actions; its helper changes only framing. A passive contact wrapper delegates the original method unchanged and logs causes. `candidate-inputs.json` records direct ball contacts with a writing table and counters at simulation times 26.209, 26.309 and 31.409 seconds; earlier falling masonry also moves contents.

- `*-intact.png`, `*-8s.png`, `*-13s.png`, `*-18s.png`, `*-breached.png`: matched intact, early breach, follow-up and final aftermath.
- `*-second-angle.png`: native timeline inspection of the first breach from `[-3,5,23]` toward `[-11,1.8,14]`; the ball partly occludes this close view. `candidate-native-camera.png` provides a useful wider angle after the larger collapse using real orbit/pan/zoom.
- `candidate-strip.png`: six frames selected from actual footage about five seconds apart, labeled with source timestamps.
- `candidate-time-controls.webm`: native scrubs, slow replay, rewind, alternate action and pristine rebuild. `candidate-collapse.webm`: six staged charges and normal-speed aftermath. `inspect.py` and `native-inspection.json` retain inputs and outcomes.
- `media.json`: durations, codecs, dimensions and SHA-256 hashes. Exact commission: `FOLLOW-UP.md`.

## Verification and bounded review

Existing baseline suite: 20/20. Final suite: **29/29, zero skipped**, independently rerun against stable source fingerprints. Command: `npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test`. `independent-glass-final-report.json` links the original failures and corrected proofs: empty space between table legs no longer launches furniture; a ledger and masonry both fall when their table moves. Real-radius contacts, immutable snapshots, exact crane/world replay, alternate futures, rolling minute, pristine rebuild, conserved scoring and surrounding-world checks pass. Diagnostic synthetic clearances are explicitly distinct from native gameplay evidence.

Native timeline samples matched recorded bank state at all three inspected points. Rebuild restored every body, zero charges and zero score. Six real charges released 15/27 bays; 1,205 bodies settled with zero moving by the later samples. A neighboring building's charges/collapse and real camera controls were also inspected. Browser error and console collections were empty.

Two fresh media-only visual reviews were used, once each. The first prioritized a readable teller hall. The anonymous paired reviewer preferred the new hall with moderate confidence but flagged rubble occlusion; it did not judge continuous motion. One correction reduced glass/frame damage transmission; the builder then inspected new native footage, normal-speed playback samples and timestamped extracts. See the two short review records. **Dense rubble still obscures much of the hall after major successive hits; this is not claimed solved.** No further artistic review loop was opened.

## Observed limits

Apple M2 Pro, 32 GB RAM, macOS 14.5; headless Chrome 152, high quality, 1440×900/DPR 1. These 240-frame samples followed recorded play in a reused browser; recorders were stopped, but buffers remained until cleanup. They are not pristine benchmarks or hardware-wide guarantees.

| Phase | Mean / p95 interval | Sampled JS heap |
|---|---:|---:|
| Rebuilt intact | 16.65 / 18.0 ms | 233.8 MiB |
| Six-charge aftermath | 16.63 / 20.2 ms | 95.3 MiB |
| Neighbor after another rebuild | 16.64 / 17.8 ms | 108.2 MiB |

Heap varied with GC and recording buffers; these samples do not establish a leak bound. Representative repeated play showed no conspicuous slowdown or runaway object count. This is prepared fracture and approximate bounds/contact physics, with transient overlaps and rigid furnishing assemblies. Fine glass/paper motion is subtle at the wide view; some contacts remain coarse. The early breach is the strongest result. Large rubble piles and partially occluded views remain disappointing. Owner visual acceptance is pending.
