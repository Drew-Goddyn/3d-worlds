# Comparable demolition demos

**Status: design, ready for implementation.** The scenario and adapter inventory are specifications; no recorder, adapter patches, calibrated shots, or videos have been implemented yet. Source inspected at `2d5c93339ee2cd938bebda777f413a8267140858`.

Produce a 70-second demonstration of each build using the same shot directions, framing rules, action schedule, and chapter boundaries. Present the recordings with synchronized playback and permanent model/reasoning labels. Viewers should be able to compare city detail, interaction, collapse, debris, and reconstruction.

The comparison standardizes the camera and requested player actions. Destruction strength, timing, native effects, slow motion, rewind, and rendering behavior remain properties of each build. This is a visual comparison of independently developed artifacts, not a controlled model or performance benchmark.

## What the viewer sees

| Film time | Chapter | Shared sequence |
| :--- | :--- | :--- |
| 0–8 s | City | Two seconds of matched overview; four-second, 20-degree orbit; two-second hold. |
| 8–26 s | Wrecking ball | Fresh world. Establish the bank and crane, aim using native controls, request one swing at chapter second 5, observe the result for 13 seconds. |
| 26–70 s | Charges and rewind | Fresh world. Place one charge on each of the bank, warehouse, and glass tower; enable native 10% speed; detonate; return to normal speed; observe; invoke native rewind and watch what it restores. |

The exact chapter-relative timeline is in [scenario.json](scenario.json). All films cut between chapters at the same times. There are no cuts inside a chapter. A missed swing, limited damage, unusual collapse, or incomplete rewind stays visible. Equal inputs do not require equal outcomes.

During the charge chapter: arm the three target buildings during seconds 4–7 (native automatic placement at 4 in the first build, individual placements at 4, 5, and 6 in the others); turn slow motion on at 7; detonate at 8; return to normal speed at 13; invoke rewind at 25; release a held rewind control at 37; observe through 44. Toggle/automatic rewind continues according to its own rules. There is no synthetic pause, reset, or restoration to manufacture the ending.

## Camera matching

Use the same **1920 × 1080 viewport, device pixel ratio 1, 45-degree vertical field of view, 30-degree elevation, and zero roll**. Azimuth starts at 45 degrees relative to a declared district front. All three currently use Y-up worlds; record each adapter's front/right axes explicitly rather than assuming their coordinates are interchangeable.

Match **screen occupancy**, not raw camera coordinates or distance. Their city sizes differ and the current vertical camera FOVs are 55 degrees, 46 degrees, and 39 degrees at this aspect ratio. Copying an XYZ position would give very different views.

1. Measure a fixed pristine bounding box for the architecture and complete crane. Exclude infinite ground, sky, temporary particles, and distant scenery. Keep the box fixed during destruction.
2. Start with a common safe rectangle of x = 0.15–0.85 and y = 0.14–0.78 of the viewport. It leaves room for native HUDs. During calibration, inspect all three HUDs and, if necessary, choose one revised shared rectangle before recording any official take.
3. Project all eight box corners. At the fixed orientation and FOV, solve target offset and the smallest camera distance that keeps every corner in front of the near plane and inside the safe rectangle with a 4% inner margin. The center of the projected box should match the safe rectangle's center. Fit width and height; do not stretch the scene or require differently shaped cities to fill both dimensions.
4. For the overview orbit, choose one distance that fits the whole 45–65-degree path. Do not zoom or refit every frame.
5. For the ball chapter, fit the union of the crane and bank, including the legal swing envelope. Ease from the overview to this shot during seconds 0–2, then hold it. For charges and rewind, use the fixed overview throughout.
6. Save the actual camera positions, targets, axes, FOV, bounding boxes, and projected rectangles to `calibration.json`. Reuse them for subsequent takes at the same source revision.

A calibration contact sheet must show all three overview and ball shots, with target points marked. Confirm visibility, comparable apparent scale, and an unobstructed bank/crane relationship. If a view fails, revise the common camera rule or document a necessary per-build axis correction; do not choose a more flattering view based on collapse outcomes. Numerical defaults above remain provisional until this calibration is completed.

Disable each native action camera through its existing UI. Apply the standardized camera immediately before rendering, after native controls and history restoration. This matters because the earliest build restores camera state from its history. The override changes presentation only; it must not change a simulation snapshot or substitute geometry. Retain native lighting, materials, fog, detail management, and highest-quality preset, including any automatic quality adjustments. Log those adjustments; equal preset rank is not equal rendering cost.

## Driving each build

Use one common scenario plus one small adapter per build. [adapters.json](adapters.json) identifies the inspected files, available controls, and semantic landmarks. It intentionally leaves runtime support IDs and camera calibration unresolved until a read-only geometric calibration pass.

The original build directories remain archived artifacts. For recording, serve a temporary copy of the pinned build with a small, auditable adapter patch. Store the patch alongside the recorder and include its hash in the take manifest. Normal launches never load the adapter. No build imports another build's implementation.

Each adapter supplies this proposed interface:

```ts
interface ComparisonAdapter {
  ready(): Promise<Capabilities>;
  inspect(): SceneDescription; // camera, pristine bounds, targets, native state
  calibrate(profile: CameraProfile): Calibration;
  arm(scenario: Scenario, calibration: Calibration): Promise<TakeReceipt>;
  receipts(): ActionReceipt[];
  dispose(): void;
}
```

`arm` schedules the entire chapter against the page's monotonic real clock. Each receipt contains intended and actual wall time, native simulation/playhead time when available, requested action, native handler used, resolved target, before/after state, and any error. Schedule inside the page to avoid paying CLI round-trip latency for every action. The video synchronization marker identifies the chapter's wall-clock zero.

The action vocabulary is limited to native player operations: select tool, aim through legal crane controls, request one swing/kick, prepare the native charge set with raycast-visible manual placements and preserved automatic placement, detonate, set native slow mode, and operate native rewind. Adapter methods must call the same complete handlers used by the UI, including charge bookkeeping and visible UI updates. If a path requires a trusted pointer/keyboard event, use browser input and log its actual delivery time; do not synthesize invalid pointer-capture events.

Do not call existing diagnostic shortcuts that directly damage buildings or advance physics (`damageBuilding`, `impactBuilding`, `advanceForEvidence`, performance scenarios). Do not equalize charge power, stagger delays, physics timesteps, debris limits, rewind speed, or the amount of collapsed architecture.

### Target resolution

- Charges: request **one charge on each bank, warehouse, and glass tower**. Selecting the charge tool in Demolition Site automatically places that exact three-building set; invoke its complete native selector at second 4 and do not add, remove, or relocate charges. Record its actual support IDs and positions. For the two manual-placement builds, select the tool at second 4 and place at seconds 4, 5, and 6 on attached ground-floor structural supports nearest the center of the visible facade, resolving ties by stable support ID. Validate their raycasts and save local hit points. Camera calibration must show the native automatic markers as well as manual targets. The different arming times and support positions are explicit native-interface differences, while the building classes, total charge count, and detonation time match.
- Ball: the bank is the common target. Calibrate aiming from geometry, legal crane ranges, and native controls, without examining damage outcomes. Save the actual aim sequence. In Demolition Site, preparation uses yaw/cable UI sliders only, then its swing button at second 5; its canvas pointer handler aims and swings together and must not be used for preparation. Sol uses native yaw/hoist controls, then one kick at second 5. Astra preparation only resolves the target; its single native aim/launch action occurs at second 5, with no extra kick. All use default native power.
- If a bank cannot be reached within legal controls, keep that fact as an explicit capability finding. Do not silently swap targets. Revise the shared target for all three only through a new scenario version, before selecting official footage.
- Native aim preparation happens visibly during the first five seconds of the ball chapter. If that is insufficient for any build, increase the shared lead-in and version the scenario before recording. Do not teleport the ball or alter its velocity.

Slow-mode adapters must use complete native handlers. In the first build, use the existing `slowOn`/`slowOff` paths including button state; ordinary pointer-up/click/leave combinations have different effects, so verify the mapping against the actual native interaction. Sol uses its slow toggle/hold logic and Astra uses `setSlow`. Never implement this by writing only a time-scale variable. Automatic charge placement is allowed only as the native selector's existing side effect; invoking it separately as a shortcut is prohibited.

A new page/context starts every chapter. Assets and shaders may warm up in a discarded rehearsal page. On the recorded page, wait for adapter readiness and asset completion, but do not advance/freeze the simulation to create an artificial time-zero state. Log load-to-chapter delay and native initial state. Starting from a fresh page prevents one chapter's destruction from affecting the next.

## Recording pipeline

Proposed entry point, **not implemented yet**:

```sh
node showcase/demo/run.mjs --prompt demolition-playground --all
```

The runner should:

1. Read build locations and display labels from [the attempt catalog](../../../showcase/attempts.json); resolve the pinned commit, scenario hash, and adapter hashes. Refuse dirty or mismatched inputs unless explicitly creating a labeled development take.
2. Check local recorder/browser/FFmpeg capabilities, installed build dependencies, and runtime assets. `agent-browser` and FFmpeg are present on the inspected machine; the repository also already includes Playwright. No new external dependency is planned.
3. Create isolated temporary copies, apply only reviewed adapter patches, launch on loopback spare ports, and calibrate all builds. Freeze one common scenario/calibration set before official recording.
4. Record builds **sequentially**, using the same browser version, viewport, foreground/visibility state, and GPU configuration. No simultaneous three-world rendering. Use isolated browser storage and no signed-in browsing profile. Record the highest native quality preset, native HUD, and silent audio consistently.
5. Start recording before navigation/setup: `agent-browser record start` creates a fresh context. Wait for readiness in that recorded context, then run the complete chapter. Include a short visual synchronization pulse in pre-roll, remove it before chapter zero, and locate its video timestamp when trimming. Capture an original-camera still separately for reference.
6. Stop/flush recording before processing. Save the unedited recording, receipt log, settings, timestamps, and warnings. Close only the browser sessions, servers, and temporary directories owned by this run.
7. Assemble the three chapter windows with the same cuts and real-time durations, then produce individual films and a labeled synchronized comparison. Retain pre-roll and failed takes as evidence; the published cut starts at the declared marker.

**Recorder resolution must be proven in a pilot.** Check actual dimensions and timestamps with `ffprobe`; viewport size alone does not prove video size. If the CLI recorder cannot produce the required resolution, use a narrow media recorder with the already-installed Playwright library and explicit `recordVideo.size = { width: 1920, height: 1080 }`, while retaining the same adapters and scenario. Await context closure to flush the file. Playwright's documented default scales video down to fit within 800 × 800. [Recording documentation](https://playwright.dev/docs/videos)

Capture at real speed. Delivery may use a constant 30-fps container, preserving source timestamps and duration. Repeated/dropped frames remain visible; do not use optical-flow interpolation, speed ramps, per-build retiming, or frame-by-frame offline rendering. This is not a 30-FPS performance claim. Capture native render cadence separately if available, without scoring builds by their incomparable tonnage counters.

Do not install a fake browser clock for published footage. It changes animation callbacks and timing behavior. Fixed-step screenshots could be a separately labeled visual study later, but must not replace the live demo. [Clock documentation](https://playwright.dev/docs/clock)

Randomness stays native. The first build uses `Math.random`; repeating its action script does not promise identical rubble. Save every take and select the **first technically valid take**, never the most dramatic collapse or most favorable seed. A rehearsal may validate geometry, controls, and recording, but may not tune damage outcomes. Freeze settings before the official run.

## Presentation and evidence

Proposed outputs under `demo/runs/<run-id>/` (large recordings kept out of normal Git history):

```text
manifest.json              # source/adapter/scenario hashes and environment
calibration.json           # exact camera and target mappings
<model>-<reasoning>/
  raw/<chapter>.webm       # original capture, including pre-roll
  events.jsonl             # intended and actual actions, native observations
  demo.mp4                 # same 70-second edit for every build
comparison.html            # generated local synchronized viewer
comparison.mp4             # 3840x840: three 1280x720 views plus label/caption bands
contact-sheet.png          # matching chapter landmarks, including rewind end
verification.json          # independent checks, limitations, take status
```

The viewer loads the three videos, with one master play/pause/seek control, chapter navigation, and a focus mode to inspect one build at full size. Pause all players when one buffers. Seeking jumps all players to the same chapter-relative wall time. Correct small drift by seeking a lagging player, never changing individual playback speeds. The immutable composite is the reference for exact synchronized playback; the interactive viewer is for inspection.

Model and reasoning labels come from the catalog and stay outside the native viewport. Shared captions describe intent: “one swing,” “three charges,” “10% time,” “rewind.” If execution is late or an operation is unavailable, add a per-build factual note from the event log. Keep native UI visible. Do not add artificial particles, sound, camera shake, scores, or dramatic grading.

Use FFmpeg to trim, concatenate, scale uniformly, and horizontally stack the recordings, with labels in separate bands. Preserve source aspect ratios. [Stacking/filter documentation](https://ffmpeg.org/ffmpeg-filters.html#hstack)

## Acceptance before publishing recordings

A fresh verifier reviews adapter diffs, this scenario, receipts, and actual footage against the standing invariants. The design does not certify future recordings.

- Original build blobs match the pinned commit. Every adapter change is limited to camera control, native action dispatch, or read-only observation. No hidden physics fixes or changed dependencies.
- Camera FOV, elevation, azimuth path, common safe rectangle, and normalized fit are verified from saved calibration and screenshots; manual target supports are visible and hittable; native automatic markers are visible and their actual supports are recorded.
- Each chapter starts fresh. Correct native quality settings, all runtime assets, visible WebGL rendering, and explicit 1920 × 1080 output are verified.
- Intent times and accepted actions are recorded. Aim/placement mistakes or recorder scheduling failures invalidate a take and require a documented harness correction. Application stalls, weak destruction, native rewind limitations, and native errors are preserved as build outcomes rather than retried away.
- Distinguish scheduler lateness from application main-thread lag using scheduled timestamps, callback/receipt times, native frame telemetry, and recording continuity. If the cause is ambiguous, mark the take inconclusive and surface it; do not relabel it to obtain a pass.
- The first technically valid official take is used. All failures and reasons remain in the manifest. A renderer crash can only be presented with an explicit outcome label; it cannot be called a successful game run.
- The composite aligns chapter starts within one encoded frame. Camera/action drift is quantified. Any observed action delay greater than 100 ms is annotated, not silently retimed or hidden. Slow motion and rewind visibly use the native controls.
- Native camera behavior during rewind is logged separately from the standardized camera. No video reversal substitutes for the real rewind.
- All three full recordings are watched at normal speed for visibility and understandable comparisons. Technical checks do not replace human judgment of whether the framing is useful.

## Implementation order

1. Implement adapter inspection and camera calibration in temporary copies; produce the six-frame contact sheet and verify geometry/controls.
2. Implement one five-second recorder pilot; prove resolution, pre-roll synchronization, native rendering, and cleanup.
3. Implement the shared event scheduler and all three adapters. Check native action equivalence without changing any game outcome.
4. Run one complete rehearsal per build; freeze scenario/calibration; record the official takes sequentially.
5. Generate the films, viewer, receipts, and comparison; obtain independent verification and surface any remaining human framing decision.

This design is complete at the specification level. Camera feasibility, recorder throughput, input mapping equivalence, and actual video quality remain implementation-time measurements.
