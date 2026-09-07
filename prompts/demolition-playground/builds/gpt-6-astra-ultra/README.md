# Demolition District

> **Round-six continuation:** the connected demolition from PR #4 is retained as a merged checkpoint, with its transient timing limit disclosed. Recorded pressure plumes, moving masonry dust, material contact voices and reversible effects now express the actual event. This candidate awaits owner review. See [round-six review and evidence](evidence/round6-event/REVIEW.md).

A standalone procedural Three.js demolition playground. Eight downtown buildings, a controllable wrecking crane, staged demolition charges, material-specific rubble, water, dust, slow motion, and a scrubbable one-minute destruction history.

## Run

Requires Node.js 20 or newer. No installation or network access is needed.

```sh
npm start
```

Open http://127.0.0.1:4173. Set `PORT` to change the local port. The server binds only to the loopback interface.

```sh
npm test
```

Tests exercise support-loss propagation, neighboring collapse, snapshot ownership, staged detonation, deterministic resumed physics, water, and history retention beyond sixty seconds. Independent verification is recorded in `evidence/verification.json`.

## Play

- Drag to orbit, right-drag to pan, and scroll or pinch to zoom.
- Select **Wrecking ball** (`1`), then click a building to aim and drive the crane's pendulum toward it. Use `A` / `D` to rotate, `W` / `S` to change cable length, and hold `F` to add swing momentum. The on-screen crane controls provide the same actions.
- Select **Charges** (`2`), click up to six structural locations, then press **Detonate** or `Enter`. Charges fire at short staged intervals.
- Toggle **Slow motion**, or hold `Space` over the scene, for 10% speed. Orbit and zoom remain responsive.
- **Rewind** (`R`) reverses the recording. Drag the timeline to inspect any recorded moment; its play button replays the retained future. Taking a new demolition action in the past creates a new future.
- **Rebuild city** plays a reverse reconstruction to the permanent pristine snapshot, including when the earliest damage is older than the rolling minute.
- **Action camera** (`C`) follows impacts. **Reset camera** (`H`) restores the overview without changing the city. `P` pauses the simulation.
- Quality, mute and sound level are in the right-hand rail. Sound starts muted; enable it explicitly. Pause and seeking stop voices, retained forward replay restores the recorded sound choices, slow motion stretches them, and rewind uses restrained reversed material grains.

## Architecture and boundaries

All geometry, building signs, brick textures, reflection lighting and audio are generated locally. The only third-party runtime is the locally vendored Three.js **0.180.0**, with its matching controls and geometry utility. The import map precedes the module script and application imports use only `three` or `three/addons/` names. The original brief is retained in `SPEC.md`.

The surrounding buildings are coarse storey assemblies with independently damaged column connections. Mercantile Bank uses a bank-specific support graph and individually retained masonry, glazing and frame fragments, rendered with instancing; its recipe and dynamics are in `src/bank.js` and `src/bank-physics.js`. Support loss, downward momentum and lateral collisions propagate collapse. Material fragments use a bounded pool; settled structural assemblies preserve their architectural detail as rubble. It is a playful custom structural simulation, not a validated civil-engineering model.

For the next bank commission: start with `src/bank.js` for the masonry arcade, complementary floor fractures and support grid; `src/bank-world.js` builds the court, galleries, stair and attached roof ribs/panels; `src/bank-hall.js` retains the furnished teller hall. `src/bank-physics.js` owns damage, contacts, attachment release and snapshots. The charge handler preserves the clicked piece's local point across rewind branching; the simulation resolves fallen pieces through their current body rather than their original storey's location. No editor or generated asset pipeline is required.

Try one charge low on either front corner, then rebuild and try the glazed roof followed by an upper side pier. Three low front charges and three on the right side produce a larger, open-section ruin. Rewind between the actions and choose another location. Major collapse may bury the teller hall.

Simulation snapshots include structural transforms, support strengths, random-generator state, debris and dust state, staged charge timers, water tank state, prop damage, crowd/pigeon reaction state, score and crane momentum. A rolling history records at 20 Hz with interpolated presentation; the pristine snapshot is retained separately. Quality changes do not change the support graph or history sampling rate.

The project has no sibling-project imports, external artwork, hosted services, analytics, credentials, persistence, or build pipeline.

## Continuing application and historical evidence

This is the continuing Astra application. The owner accepted round two’s localized breaking as a significant improvement and retained round three’s banking hall for completeness, without accepting perfect physics or claiming another major demolition leap. Round four’s architecture was retained through the explicitly authorized PR #3 checkpoint merge. Round five’s connected descent was retained through the explicitly authorized PR #4 checkpoint. Round six is a new, unmerged continuation; owner acceptance remains pending. The directory label records the original attempt’s settings. Original previews, films and verification remain historical evidence at the [original showcase checkpoint](https://github.com/Drew-Goddyn/3d-worlds/tree/ac854cea3d554f34f39ca9f91a3197ad422b79ee); earlier rounds' evidence remains untouched.

## Banking-hall breach continuation

The front ground floor now contains green teller stations, writing tables, banker lamps, chairs, deposit drawers, ledgers and loose paper/cash. Ground-floor glazing breaks into retained triangular shards. Solid-member contacts move reachable contents; settled objects and masonry fall when their support moves. Low bank targets can lower the ball to hall height. All of this participates in the existing rewind and rebuild.

For a revealing approach, rotate the crane left for about 1.5 seconds, lengthen the cable for about 1.5 seconds, and let it settle over the street. Aim at the right ground-floor window, follow up through the opening toward the teller area, then try the left window. The ball, falling stone, and debris can each change which contents remain reachable. Use orbit/pan/zoom to inspect the opening; rewind the actual event before trying another target.

This remains a custom coarse simulation: prepared glass fractures, approximate rotated bounds and central-footprint support, rigid furnishing assemblies, and persistent rubble that can obscure the hall after large failures. No full furniture breakage or arbitrary crack solver is claimed. [Round-three review packet](evidence/round3-hall/REVIEW.md) records the current evidence and limitations.

## Connected demolition continuation

Charges now open localized wounds and remove bearings under the banking court. Construction rotates around surviving support, then travels in connected masonry/floor sections; real contact and later charges split those sections into the existing retained pieces. The direction of support loss affects the falling section and resulting rubble. Ground-level cuts remain bounded; try six front/right charges for the larger connected collapse, then rebuild and cut the roof followed by an upper side pier.

`src/bank-cohesion.js` derives a finite connection graph from the recipe's actual solid members, handles moving sections and contact breakup, and captures their momentum/membership alongside the existing bank snapshots. `src/bank-physics.js` retains support assessment, individual rubble settlement, scoring and render ownership. The bank's existing geometry is the editable preparation recipe; no asset build, new dependency or Blender step is required. Section/fragment contacts use approximate bounds, and the surrounding buildings retain their coarse storey simulation. See [the round-five commission and evidence](evidence/round5-demolition/FOLLOW-UP.md).

## Demolition event continuation

The event layer owns immutable, spatially grouped birth records with independent visual/audio randomness. Snapshots carry all still-visible births; scrubbing reconstructs clouds and grit analytically. Actual member release and contact hooks observe the existing solver. Its structural RNG, charge strengths, supports and fracture behavior remain intact; legacy dust generation is retained for structural random-stream compatibility while the new layer supplies the visible dust.

Working entry points are `src/event-track.js` for ownership and transport, `src/event-visuals.js` for simulation-time reconstruction, and `src/event-audio.js` for editable procedural material voices and bounded Web Audio playback. The selected evidence folder retains the short audio-capture recipe. All synthesis and rendering work locally using the existing vendored runtime. No added dependency, external sample, asset tool, runtime service or account is needed.
