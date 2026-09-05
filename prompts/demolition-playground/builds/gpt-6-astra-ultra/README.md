# Demolition District

> **Round-two continuation:** this branch rebuilds Mercantile Bank with carved masonry, open interiors, independently failing bays and retained architectural rubble. The original attempt is preserved at `ac854cea3d554f34f39ca9f91a3197ad422b79ee`. This continuation’s session model/reasoning are **unverified**; the directory name describes the original build. See [round-two evidence and reproduction](evidence/round2-bank/ROUND-TWO.md).

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
- Quality and optional procedural sound are in the right-hand rail.

## Architecture and boundaries

All geometry, building signs, brick textures, reflection lighting and audio are generated locally. The only third-party runtime is the locally vendored Three.js **0.180.0**, with its matching controls and geometry utility. The import map precedes the module script and application imports use only `three` or `three/addons/` names. The original brief is retained in `SPEC.md`.

The surrounding buildings are coarse storey assemblies with independently damaged column connections. Mercantile Bank uses a bank-specific support graph and individually retained masonry, glazing and frame fragments, rendered with instancing; its recipe and dynamics are in `src/bank.js` and `src/bank-physics.js`. Support loss, downward momentum and lateral collisions propagate collapse. Material fragments use a bounded pool; settled structural assemblies preserve their architectural detail as rubble. It is a playful custom structural simulation, not a validated civil-engineering model.

Simulation snapshots include structural transforms, support strengths, random-generator state, debris and dust state, staged charge timers, water tank state, prop damage, crowd/pigeon reaction state, score and crane momentum. A rolling history records at 20 Hz with interpolated presentation; the pristine snapshot is retained separately. Quality changes do not change the support graph or history sampling rate.

The project has no sibling-project imports, external artwork, hosted services, analytics, credentials, persistence, or build pipeline.

## Continuing application and historical evidence

This is the continuing Astra application. The owner accepted round two’s localized bank breaking and crumbling as a significant improvement, without declaring the bank complete or its physics perfect. The directory label records the original attempt’s settings, not later sessions. Original previews, films and verification remain historical evidence at the [original showcase checkpoint](https://github.com/Drew-Goddyn/3d-worlds/tree/ac854cea3d554f34f39ca9f91a3197ad422b79ee). Round-two captures and limitations are retained in [the round-two record](evidence/round2-bank/ROUND-TWO.md).
