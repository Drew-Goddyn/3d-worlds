# Adversarial Review: Three.js Demolition Playground

This review documents why the current demolition playground feels fake, confusing, and fragile despite passing the existing checks. It is intentionally critical and focused on the implementation that exists in this repository.

Scope reviewed:

- `README.md`
- `index.html`
- `styles.css`
- `src/main.js`
- `scripts/verify-playground.mjs`

Commands run during review:

```sh
npm run check
npm run verify
```

Both passed. The verifier wrote evidence to:

```text
/Users/Drew/projects/.codex-plan-goals/3d-worlds/threejs-demolition-playground/evidence/2026-07-08T05-06-32-611Z-verify
```

Passing verification should not be interpreted as passing product quality. The current verifier bypasses major user-facing paths through production diagnostics hooks, so it can pass while the physics, controls, and visual language are still broken.

## Executive Summary

This is not currently a physics demolition toy. It is a scripted Three.js scene with a kinematic wrecking ball, radial damage fields, random debris puffs, mutable test backdoors, and controls that collide with camera navigation.

The biggest failures are structural:

- The wrecking ball cable is not anchored to the boom tip.
- The ball does not physically collide, rebound, transfer impulse, or lose energy.
- Building damage is triggered by radius checks, not contact.
- Collapse is a timer-driven floor break sequence, not structural failure.
- Dust and smoke are shaded spheres that scale up and disappear.
- The controls trigger destructive actions while the user is trying to move the camera.
- Verification drives internal APIs instead of proving the real user loop.

The result can satisfy a checklist like "has a crane, a ball, smoke, controls, and tests" while missing the actual intended experience.

## Severity Key

- P0: Core experience is fundamentally wrong or test confidence is false.
- P1: Major believability, usability, or maintainability failure.
- P2: Secondary issue that still contributes to the poor result.

## P0 Findings

### P0. The Wrecking Ball Is Not Connected To The Boom End

References:

- `src/main.js:1291` defines `crane.pivot` as a hard-coded world position.
- `src/main.js:1305` positions the crane base.
- `src/main.js:1309` creates the crane arm as a child mesh under the base.
- `src/main.js:1339` draws the cable from `crane.pivot` to `crane.ballPosition`.

Failure mode:

The crane arm visually extends away from the mast, but the cable anchor does not come from the arm geometry or its world transform. The cable is drawn from a fixed point around the tower top. Since the boom is parented and rotated independently, the cable/ball system is not actually attached to the boom tip.

Why it matters:

The viewer immediately reads the crane as mechanically incoherent. A wrecking ball hanging from the wrong place makes the whole toy feel broken before physics even starts.

Practical fix:

Compute the boom tip in world coordinates every frame:

- Keep a local boom-tip point, for example near the positive end of the arm mesh.
- Call `crane.arm.localToWorld(localTip.clone())` or derive the point from a dedicated empty/group at the boom tip.
- Use that world position as the cable anchor.
- Draw the cable from that anchor to the ball.
- Keep the ball constraint relative to the same anchor.

Do not leave the cable anchor as a magic world vector.

### P0. The Wrecking Ball Is Kinematic, Not Physical

References:

- `src/main.js:1322` updates ball visuals from a procedural angle.
- `src/main.js:1326` applies a simple pendulum-like angular acceleration.
- `src/main.js:1331` adds decorative sideways drift from `sin(state.simTime * 1.2)`.
- `src/main.js:1345` sets swing angle and angular velocity directly on HIT.
- `src/main.js:1367` checks impacts.
- `src/main.js:1382` applies building damage.

Failure mode:

The ball path is procedurally generated. It is not a rigid body. It does not collide, rebound, drag, snag, lose energy, transfer impulse, or respond to the building it supposedly hits.

`checkBallImpacts()` can damage a building, but nothing pushes back on the ball. The ball can effectively pass through buildings because impact has no meaningful consequence for the ball/cable/crane system.

Why it matters:

The core fantasy is a heavy object smashing structure. Here the ball is just a moving visual cursor that occasionally triggers radial damage. That is why it feels weightless and fake.

Practical fix:

Minimum acceptable version:

- Model the ball as a constrained pendulum with position, velocity, mass, and radius.
- Use cable length as a constraint from the boom-tip anchor.
- Do swept sphere collision against structural members.
- Apply impulse to the struck member and equal/opposite response to the ball.
- Reduce ball energy after impact.
- Add damping only after contact response, not as a substitute for it.

Better version:

- Use a real physics library for rigid bodies and constraints.
- Treat structural members as bodies or fracture proxies.
- Drive rendering from simulation state, not the other way around.

### P0. Impact Detection Is Radial Damage, Not Collision

References:

- `src/main.js:1373` finds the nearest building by building origin.
- `src/main.js:1380` allows a hit if the ball is within 20 meters of that building origin.
- `src/main.js:1382` calls `damageAt()` with a 7.5 meter radius.
- `src/main.js:994` applies damage to member centers inside a radius.
- `src/main.js:998` uses center-to-point distance only.

Failure mode:

The ball does not check contact with member geometry. It finds the nearest building center, then deals spherical damage to member centers near the ball. There are no faces, no bounds, no normals, no swept volume, and no contact point.

Why it matters:

The damage feels arbitrary because it is arbitrary. A member can be damaged because its center is near the ball, not because the ball struck its surface. Conversely, visible contact can fail to matter if the relevant center is outside the radius.

Practical fix:

- Replace building-center targeting with per-member collision candidates.
- Use swept sphere versus member AABB/OBB.
- Track the actual contact point and normal.
- Apply damage based on normal impulse, member material, relative velocity, and member strength.
- Use the same contact information to emit debris from the struck face.

### P0. Collapse Is Scripted, Not Structural

References:

- `src/main.js:1019` evaluates stability.
- `src/main.js:1021` counts structural members.
- `src/main.js:1024` triggers collapse from a global broken ratio or weak-column count.
- `src/main.js:1029` starts collapse.
- `src/main.js:1035` schedules floors to break top-down.
- `src/main.js:1037` breaks every eligible member on a floor.

Failure mode:

The building does not fail because loads move through supports. It fails because enough members are below thresholds, then every floor gets broken on a timer. The top-down schedule is especially suspicious for implosion and support failure because it visually reads like floors popping rather than weight collapsing through a structure.

Why it matters:

Demolition believability depends on causality: support removal, sagging, tilting, pancaking, debris impacts, dust venting, then settlement. This implementation skips that chain and schedules the result.

Practical fix:

Incremental path:

- Add a support graph by floor and column.
- Track load capacity per support.
- When support capacity drops, transfer load to neighbors.
- Trigger local member failure from overload.
- Drive collapse progression from failed supports, not fixed floor timers.

Physics-engine path:

- Represent major structural elements as constrained rigid bodies.
- Break constraints based on impulse/load.
- Let dynamic bodies collide and stack.

### P0. Controls Fight The Camera

References:

- `src/main.js:42` creates `OrbitControls` on the renderer canvas.
- `src/main.js:2011` also listens for `pointerdown` on the same canvas.
- `src/main.js:2013` places charges when the charge tool is active.
- `src/main.js:2016` aims and swings the crane when the ball tool is active.

Failure mode:

The same pointer event starts camera interaction and destructive world interaction. A user trying to orbit, inspect, or reposition the view can accidentally swing the wrecking ball or plant a charge.

Why it matters:

The app feels random because basic camera manipulation has side effects. This is not a labeling problem. The input model is wrong.

Practical fix:

- Track pointer down/move/up distance.
- Trigger world actions on click-after-no-drag, not raw `pointerdown`.
- Ignore non-primary buttons and modifier gestures intended for camera control.
- Temporarily suppress world actions while `OrbitControls` is dragging.
- Consider explicit modes: inspect, swing, place charge.

### P0. Slow Motion Has Conflicting Interaction Semantics

References:

- `src/main.js:1987` defines the SLOW button behavior.
- `src/main.js:1988` enables slow motion on `pointerdown`.
- `src/main.js:1993` disables slow motion on `pointerup`.
- `src/main.js:2001` also toggles slow motion on `click`.

Failure mode:

The button is both momentary and toggle. A normal tap can run `pointerdown`, then `pointerup`, then `click`, leaving slow motion in a state the user did not intend.

Why it matters:

Controls feel haunted because the same gesture encodes two different commands.

Practical fix:

Choose one:

- Momentary: hold to slow, release to resume.
- Toggle: click to switch between normal and slow.

If both are required, use separate controls or suppress the synthetic click after a hold.

### P0. Verification Is A Puppet Show

References:

- `src/main.js:2265` exposes `window.demolitionApp`.
- `src/main.js:2268` exposes mutable `state`.
- `src/main.js:2269` exposes `buildings`.
- `src/main.js:2289` exposes `advanceForEvidence()`.
- `src/main.js:2299` exposes `damageBuilding()`.
- `scripts/verify-playground.mjs:136` directly calls `window.demolitionApp.damageBuilding("bank", 1.9)`.
- `scripts/verify-playground.mjs:154` directly mutates `window.demolitionApp.state.timeScale`.
- `scripts/verify-playground.mjs:166` starts collapse by calling a building method.
- `scripts/verify-playground.mjs:180` starts another collapse and water rupture directly.
- `scripts/verify-playground.mjs:190` fast-forwards the simulation with `advanceForEvidence()`.

Failure mode:

The verifier does not prove that a user can aim, hit, damage, detonate, rewind, and understand the result through the actual controls. It drives internals and then asserts flags/screenshots.

Why it matters:

This is how a broken toy gets a green test suite. The tests prove that test hooks can force the desired states, not that the product works.

Practical fix:

- Make production diagnostics read-only by default.
- Move scenario orchestration into Playwright.
- Drive the app through pointer/keyboard/DOM interactions.
- Keep a separate explicit test build if mutable hooks are needed.
- Assert observable state transitions, not self-reported flags.

## P1 Findings

### P1. Dynamic Members Do Not Collide With Structure

References:

- `src/main.js:780` updates dynamic structural members.
- `src/main.js:782` applies gravity.
- `src/main.js:783` moves the member.
- `src/main.js:787` handles only ground collision.

Failure mode:

Broken members fall through intact members and other debris. The only collision is a ground-height clamp.

Why it matters:

Real collapse is dominated by collision, stacking, grinding, and load transfer. Without member-member collision, rubble cannot pile up or crush anything in a believable way.

Practical fix:

- Add member-member collision for major structural pieces.
- At minimum, use simplified oriented boxes for large bodies.
- Let falling slabs and columns interact with intact supports.
- Recompute crush effects from contact, not radius proximity alone.

### P1. Ground Contact Ignores Rotation And Extents

References:

- `src/main.js:787` checks `mesh.position.y < mesh.scale.y * 0.5`.
- `src/main.js:793` damps velocity on ground contact.

Failure mode:

The contact test assumes every member is upright and uses only its Y scale. Rotated columns, beams, and slabs will hover, clip, or settle at impossible heights.

Why it matters:

Bad contact destroys weight perception. The eye catches hovering beams and clipping slabs quickly.

Practical fix:

- Compute oriented bounding box extents after rotation.
- Use the minimum world-space bottom point for ground contact.
- Or delegate rigid-body contact to a physics engine.

### P1. Mass Is Mostly Decorative

References:

- `src/main.js:709` stores `mass`.
- `src/main.js:756` chooses random lift.
- `src/main.js:757` chooses random impulse.
- `src/main.js:758` applies velocity without mass scaling.
- `src/main.js:782` weakens gravity with a constant multiplier.

Failure mode:

Heavy roofs, columns, facade pieces, and lighter parts all receive arbitrary break velocities. Mass contributes to scoring and a few side effects, but not to believable motion.

Why it matters:

The scene feels weightless because heavy objects are not meaningfully heavy.

Practical fix:

- Derive impulse response from mass.
- Use material density and member dimensions to compute mass.
- Give heavy objects lower acceleration from equal impulse.
- Use normal gravity unless there is a clear time-scale reason not to.

### P1. Chain Reactions Are Teleported Damage

References:

- `src/main.js:1064` sends a chain reaction.
- `src/main.js:1067` checks nearby building centers.
- `src/main.js:1072` creates a midpoint between buildings.
- `src/main.js:1074` damages the other building at that midpoint.

Failure mode:

A collapsing building damages a neighbor because it is near enough, not because debris hits it or a ground shock reaches it.

Why it matters:

The effect reads disconnected from cause. It is another hidden radius trigger.

Practical fix:

- Spawn actual large debris trajectories that can contact neighbors.
- Use ground shock as a visible expanding wave with force falloff.
- Damage neighbor members only from debris/contact/shock events.

### P1. Dust Is Shaded Geometry, Not Dust

References:

- `src/main.js:104` defines a transparent dust material.
- `src/main.js:113` uses `SphereGeometry` for dust.
- `src/main.js:692` creates the dust instance pool.
- `src/main.js:550` scales particles up during dissipation.

Failure mode:

Dust puffs are amber spheres that expand and vanish. They do not have soft edges, noise, billowing, opacity curves, or material variation.

Why it matters:

The effect looks like random circles because that is what it is: simple shaded balls.

Practical fix:

- Replace dust spheres with camera-facing quads or sprites.
- Use soft noise alpha.
- Add per-particle opacity and color over lifetime.
- Split dust into ground roll, impact burst, venting plume, and lingering haze.
- Tie emission direction to impact/contact data.

### P1. Collapse VFX Are Uniform And Backwards

References:

- `src/main.js:1035` schedules floor collapse from top down.
- `src/main.js:1042` places each dust plume at a centered floor position.
- `src/main.js:1043` spawns the same dust burst pattern per floor.

Failure mode:

The same centered dust burst appears floor by floor. It does not vent from windows, burst from lower supports, roll along the ground, or follow actual falling geometry.

Why it matters:

The collapse reads like a procedural animation effect rather than demolition.

Practical fix:

- For implosion, start with lower support charge flashes and base dust.
- Add delayed upper sag and pancaking.
- Emit dust from facade openings and floor seams.
- Add a ground-hugging pressure front after the main mass hits.

### P1. Explosions Have No Explosion Language

References:

- `src/main.js:1448` changes charge material to amber.
- `src/main.js:1453` spawns dust.
- `src/main.js:1454` spawns a shockwave.

Failure mode:

The charge does not produce a real blast moment. There is no flash, light kick, sparks, soot, directional debris, or fast pressure ring.

Why it matters:

Explosives are one of the few player-triggered events. If they just become amber dust puffs, the interaction has no punch.

Practical fix:

- Add an 80-150 ms emissive flash and point light.
- Add a thin expanding ring or cone.
- Emit dark soot and bright sparks separately.
- Hide/remove the spent charge.
- Bias debris and dust velocity away from the charge normal.

### P1. Debris Is Disconnected From The Damaged Surface

References:

- `src/main.js:484` randomizes spawn offset in a small cube.
- `src/main.js:486` randomizes velocity.
- `src/main.js:764` chooses fixed debris recipes by material.

Failure mode:

Debris is emitted from a generic center with generic random velocity. It does not know which face was hit, what direction the ball was traveling, or how large the member surface was.

Why it matters:

Damage does not visually explain itself. Glass, stone, brick, and concrete all become recipes instead of reactions.

Practical fix:

- Emit from struck face/edge.
- Use contact normal and incoming impulse.
- Scale count by member area and material.
- Use different chunk shapes for facade panels, beams, glass panes, and concrete slabs.

### P1. Selecting CHARGE Mutates The Scene

References:

- `src/main.js:1802` sets the current tool.
- `src/main.js:1805` auto-places charges when CHARGE is selected.
- `src/main.js:1436` auto-places charges when FIRE is pressed with no charges.

Failure mode:

Selecting a tool changes the scene before the user places anything. FIRE also silently arms charges if none exist.

Why it matters:

The tool model feels dishonest. The user thinks they selected a mode, but the app performed hidden work.

Practical fix:

- Tool selection should only change mode.
- FIRE should detonate existing charges only.
- If auto-placement is desired, expose it as a separate explicit action.
- Show charge count and armed targets.

### P1. Charge Placement Has No Feedback

References:

- `src/main.js:1394` refuses placement after six charges.
- `src/main.js:1417` handles pointer placement.
- `src/main.js:1421` raycasts structural objects.
- `src/main.js:1422` does nothing if there is no hit.

Failure mode:

Misses are silent. Max-charge refusal is silent. There is no hover target, placement preview, valid/invalid cursor, or charge count.

Why it matters:

The charge tool feels random because the app does not explain what can be clicked or why nothing happened.

Practical fix:

- Add hover highlighting for valid structural members.
- Show a placement ghost.
- Display charge count and max.
- Add short HUD feedback such as "No structural target" or "Max charges armed".

### P1. Timeline Scrub Is Not A Real Transport

References:

- `src/main.js:1534` snaps the timeline to the newest snapshot when inactive.
- `src/main.js:1708` scrubs to a snapshot.
- `src/main.js:1715` restores state during scrub.

Failure mode:

The playhead is forced to the end during live playback, while scrub restores old state without establishing a clear paused/live mode.

Why it matters:

The timeline looks like a transport control but behaves like a volatile debug slider.

Practical fix:

- Add explicit paused/live state.
- Stop advancing while the user reviews history.
- Add play/resume.
- Show current time and total recorded span.
- Do not auto-force the slider to the end while the user is inspecting history.

### P1. Camera Mode Is Invisible And Rewind Can Rewrite It

References:

- `src/main.js:1603` captures camera state in snapshots.
- `src/main.js:1660` restores camera position and target.
- `src/main.js:1662` restores `state.actionCamera`.
- `src/main.js:1824` toggles action camera.

Failure mode:

The CAM button does not show active state, and timeline/rewind can restore `state.actionCamera` from history. The user can end up in a different camera mode without pressing CAM.

Why it matters:

Hidden mode changes make the UI feel random.

Practical fix:

- Sync CAM button active state whenever camera mode changes.
- Decide whether camera mode belongs in rewind snapshots.
- If it belongs, show that rewind restores camera state.
- If it does not, keep camera mode outside simulation snapshots.

### P1. Transitional States Are Unguarded

References:

- `src/main.js:1719` starts rewind.
- `src/main.js:1738` starts reset/rebuild.
- `src/main.js:2011` still accepts pointer world actions.
- `src/main.js:1981` through `src/main.js:1985` keep action buttons live.

Failure mode:

Rewind/rebuild are active states, but destructive controls are still wired. The user can attempt incompatible actions during state transitions.

Why it matters:

This creates unpredictable state combinations and makes bugs hard to reproduce.

Practical fix:

- Add an interaction state machine.
- Disable or ignore incompatible controls during rewind/rebuild.
- Reflect disabled state in the HUD.

## P2 Findings

### P2. Shockwave Is Just Another Dust Cluster

References:

- `src/main.js:415` defines `spawnShockwave()`.
- `src/main.js:416` spawns dust with flattened Y scale.

Failure mode:

The shockwave does not expand over time. It is a group of flattened dust balls spawned at once.

Practical fix:

- Add a dedicated expanding annulus/ring.
- Animate radius, opacity, and edge softness.
- Emit trailing dust after the leading edge.

### P2. Water Reads As Neon Marbles

References:

- `src/main.js:103` defines water as emissive cyan.
- `src/main.js:114` uses sphere geometry.
- `src/main.js:1090` spawns large water particles.

Failure mode:

Water looks like glowing blue beads, not rupture spray.

Practical fix:

- Use non-emissive translucent streaks and sheets.
- Add mist and small droplets separately.
- Add puddle or wet-ground decals.
- Fade size and opacity faster.

### P2. Glass Rain Lacks Pane Readability

References:

- `src/main.js:112` uses one tetrahedron shard shape.
- `src/main.js:767` emits glass shards from member center.

Failure mode:

Glass does not break like panes. It becomes generic tetrahedra.

Practical fix:

- Emit from facade normal.
- Mix slivers, chips, and larger pane fragments.
- Add glints and ground scatter near the wall.

### P2. There Is Little Persistent Demolition Evidence

References:

- `src/main.js:541` settles debris against the ground.
- `src/main.js:790` spawns impact dust.

Failure mode:

Once puffs fade, the scene lacks soot, dust layers, rubble mounds, wet patches, facade staining, scorch marks, and persistent ground damage.

Practical fix:

- Add cheap instanced decals.
- Add persistent rubble fields around collapse zones.
- Darken damaged facades.
- Add wet/soot/dust ground overlays.

### P2. Keyboard Shortcuts Are Global

References:

- `src/main.js:2021` registers a global keydown listener.
- `src/main.js:2022` maps Space to swing.
- `src/main.js:2023` through `src/main.js:2025` map C/B/R.

Failure mode:

Keyboard shortcuts ignore focused controls, do not call `preventDefault()`, and do not guard against repeats. Space on a focused button can double-trigger.

Practical fix:

- Ignore events from inputs, buttons, selects, and ranges.
- Prevent defaults for handled shortcuts.
- Ignore repeated keydown events.
- Show shortcuts in accessible labels or help text if they remain.

### P2. HUD Labels Are Too Terse

References:

- `index.html:23` through `index.html:31` define BALL, CHARGE, FIRE, YAW, LINE, PWR, HIT.
- `index.html:33` through `index.html:43` define SLOW, REW, CAM, RESET, HIGH/MED/LOW.

Failure mode:

The HUD mixes modes, actions, toggles, sliders, quality settings, timeline transport, and score state with abbreviated labels and mouse-only `title` hints.

Practical fix:

- Show live slider values.
- Show charge count.
- Show CAM and SLOW active state clearly.
- Replace ambiguous abbreviations where space allows.
- Distinguish modes from actions visually.

### P2. Screenshot Evidence Is Not Visual Correctness

References:

- `scripts/verify-playground.mjs:55` samples canvas pixels.
- `scripts/verify-playground.mjs:275` asserts nonblank/nonuniform canvas.

Failure mode:

The verifier proves the canvas is not blank. It does not prove that the crane is connected, the HUD is readable, dust looks correct, or demolition happened in the intended place.

Practical fix:

- Add visual assertions for crane cable endpoints.
- Add before/after damage deltas in expected screen regions.
- Validate HUD bounds on desktop/mobile.
- Compare visual snapshots against approved baselines.

### P2. Performance Checks Do Not Enforce A Budget

References:

- `src/main.js:1942` samples frame deltas.
- `src/main.js:2164` reports performance.
- `scripts/verify-playground.mjs:283` asserts FPS is greater than zero.

Failure mode:

Any positive FPS passes. There is no actual performance budget.

Practical fix:

- Assert average frame time.
- Assert max frame time or long-frame count.
- Assert render calls/triangles ceilings.
- Assert snapshot capture cost during collapse.

### P2. Reproducibility Is Weak

References:

- `src/main.js:234` uses `Math.random()`.
- `scripts/verify-playground.mjs:7` writes to a hard-coded absolute evidence root.

Failure mode:

Randomness is unseeded, and evidence location is machine-specific.

Practical fix:

- Use a seeded PRNG.
- Record the seed in diagnostics and evidence.
- Make evidence output configurable with an environment variable.

## Architecture Problems

### The App Is A 2,314-Line God File

References:

- `src/main.js:1` starts a single side-effectful module.
- `src/main.js:2307` boots the scene directly.
- `src/main.js:2308` wires UI directly.
- `src/main.js:2309` exposes diagnostics directly.

Failure mode:

Rendering, scene creation, simulation, VFX, UI, snapshots, performance telemetry, diagnostics, and test harnesses all live in one module. That makes it hard to test subsystems, hard to replace physics, and easy for diagnostic state to leak into production behavior.

Practical fix:

Split into modules:

- `world/createWorld.js`
- `simulation/crane.js`
- `simulation/structure.js`
- `simulation/collisions.js`
- `vfx/particles.js`
- `ui/hud.js`
- `state/snapshots.js`
- `diagnostics/readOnlyDiagnostics.js`
- `main.js` as a small composition root

### Test-Only Orchestration Lives In Production Runtime

References:

- `src/main.js:2121` embeds an evidence scenario.
- `src/main.js:2190` embeds a Chrome performance scenario.
- `src/main.js:2223` accepts commands through `documentElement.dataset`.
- `src/main.js:2249` starts perf scenarios from URL params.

Failure mode:

The production page includes scenario runners and command hooks. This encourages tests to mutate internals and creates a permanent debug surface.

Practical fix:

- Move scenario scripting into Playwright.
- Keep runtime diagnostics read-only unless an explicit test build flag is enabled.
- Avoid URL-triggered scenario execution in production.

## Verification Gaps

Current verification proves:

- The app can load.
- The canvas is nonblank.
- Some screenshots can be produced.
- Internal flags can be forced to true.
- Internal scenario hooks can produce debris/collapse states.

Current verification does not prove:

- A user can aim the crane reliably.
- A user can swing without fighting camera controls.
- The ball is attached to the boom tip.
- The ball physically contacts a member.
- Impact damage follows the ball path.
- Smoke/dust reads as demolition.
- The controls are understandable.
- Rewind is semantically coherent.
- Performance meets a threshold.

Suggested verification upgrades:

1. Add a user-path Playwright test that aims by pointer, swings, and observes damage without calling `window.demolitionApp.damageBuilding()`.
2. Add a geometry assertion that the cable top endpoint is within a small tolerance of the crane boom tip and the bottom endpoint is within a small tolerance of the ball.
3. Add deterministic seeds so the same scenario can be compared across runs.
4. Add visual regression screenshots for first frame, swing contact, charge placement, detonation, collapse, and mobile HUD.
5. Add a slow-button test that verifies a tap and a hold produce distinct intended states.
6. Add timeline tests for paused/live semantics.
7. Add performance budgets for collapse scenes.

## Suggested Fix Order

1. Fix the crane anchor so cable and ball attach to the boom tip.
2. Separate camera dragging from destructive canvas actions.
3. Fix SLOW semantics.
4. Stop CHARGE and FIRE from auto-mutating the scene.
5. Replace ball radial damage with swept member collision.
6. Give the ball real post-impact response.
7. Add basic member/member and oriented ground contact.
8. Replace dust spheres with a real particle system.
9. Move test scenarios out of production runtime.
10. Rewrite verification around user-observable behavior.
11. Split `src/main.js` into simulation, VFX, UI, snapshots, diagnostics, and app bootstrap modules.

## Acceptance Criteria For A Better Version

Physics:

- The cable visually and numerically attaches to the boom tip.
- The ball follows a cable constraint.
- The ball loses energy or changes direction after impact.
- Damage occurs at actual contact points.
- At least major broken structural pieces collide with ground and each other.

Demolition:

- Support failure starts from damaged supports, not a fixed top-down timer.
- Collapse direction and timing are explainable from failed structure.
- Chain reactions are caused by visible debris/contact/shock, not hidden midpoint damage.

VFX:

- Dust has soft edges, lifetime fades, and color variation.
- Explosions have flash, shock, soot, and directional debris.
- Persistent rubble/scorch/dust remains after transient effects fade.

Controls:

- Camera movement never triggers demolition actions.
- Tool selection does not mutate the scene.
- Controls show active/disabled states.
- Timeline has clear paused/live behavior.
- Keyboard shortcuts do not hijack focused controls.

Verification:

- Tests exercise the real UI path.
- Mutable diagnostics are absent from production or explicitly test-gated.
- Visual assertions catch disconnected crane/cable/ball states.
- Performance tests enforce real budgets.
- Random scenarios are reproducible from recorded seeds.
