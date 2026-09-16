# Demolition Playground

A procedural, sunlit district with a suspended wrecking ball, reusable demolition charges, causal collapse and a reversible simulation timeline.

## Run locally

Use Node.js 22 or newer. The build was verified with Node.js 26.3.0.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. Three.js 0.180.0 is served from the pinned local dependency through the import map. The scene uses procedural geometry, colors, shaders and canvas lettering.

## Controls

| Action | Control |
| --- | --- |
| Orbit / pan / zoom | Left drag / right drag / wheel |
| Swing the ball | Drag the ball and release; Shift-drag also works |
| Rotate crane | Hold A / D, or the on-screen rotation buttons |
| Shorten / lengthen cable | Hold W / S, or the on-screen cable buttons |
| Add swing momentum | Hold arrow keys; directions follow the camera |
| Select ball / charges | B / C, or the tool buttons |
| Place a charge | In charge mode, click a gold structural target; six active charges maximum |
| Fire charges | Red Detonate button; charges fire 0.18 simulation seconds apart |
| Slow motion | Slow toggles 10%; hold Space for temporary 10% speed |
| Rewind | Rewind button, or hold R; releasing R pauses |
| Scrub / resume | Timeline slider / play button |
| Follow an impact | Action cam button |
| Restore camera | Reset view |
| Restore city | Rebuild city traverses the recorded run backwards |

Scrubbing and passive playback preserve the recorded future. A successful world-changing action from the past replaces that future. Camera motion, tool selection, playback speed and rejected actions preserve it. Rebuild city finishes paused at the pristine state; Play can replay the retained run.

## Model and limits

The district has 271 load-bearing bays and 608 column/beam support connections. Losing support reduces local carrying capacity, causes sag and joint fatigue, and releases a bay into gravity and contact simulation. Falling members transfer damage according to their mass and speed. Physical contact can compromise another building. The crane uses a gravity-driven ball constrained by a variable-length cable.

The immutable architecture catalog assigns nearby facade pieces to spatial chunks, with separate loose bricks and glass triangles. Each chunk's carried geometry defines its oriented contact bounds. Columns stay with supported bays and release as separate physical bodies when the bay detaches; the released column constraint is removed at the same transition. Surviving connections continue to constrain moving bays until strain or contact breaks them. Fragments contact surviving floors and settled rubble. Resting slabs validate their support from the ground upward and wake when that support disappears. Slab and tank contacts use shared rotated geometry bounds. The shared pool has 3,072 slots, enough for all 2,343 persistent architectural bodies plus temporary detail. Persistent architecture is protected from recycling.

The tank has its own recorded body, support state, rotation and rupture state. It can tumble, rupture, discharge water and remain as an open shell with its roof and bands. Its support legs remain with the roof bay. The detached body uses the shell-to-roof envelope; an unsupported edge overhang tips and slides instead of sleeping on a narrow roof sliver. Water exchanges momentum with debris at the surface it reaches, including surviving roofs.

Contacts remain a coarse game approximation. Chunks share motion, bounds include gaps between carried parts, and all moving debris pairs do not resolve against one another. The reproduced shell/slab overlap is repaired. Slab contact and tank contact use oriented boxes; chunk piles use conservative bounds and a coarse support-height approximation. Moving slabs and moving chunks do not universally collide with each other, so rubble overlap remains possible. Steel and concrete failure remain stylized; the tank shell is one coarse body after rupture. Dust uses translucent procedural billboards. The district remains a stylized seven-building diorama.

### Time and intervention

The authoritative simulation records reversible Float64 bit changes and sparse checkpoints at 60 simulation steps per second. A changed field stores its index and the XOR of its old/new bits: 12 payload bytes instead of the previous 20, with exact forward and reverse reconstruction. All simulation and accepted-action records remain. Accepted inputs keep their order within a simulation timestamp. Playback and the timeline use simulation seconds: rewind runs at two simulation seconds per wall second; rebuild uses the greater of that rate or the run duration divided by five seconds.

Presentation samples continuous motion between physical records. Live playback uses a deterministic, unpublished one-step lookahead, including held crane input. Historical playback samples the retained future. Births, deaths, fracture states, visibility and scores remain discrete. A recycled particle slot only interpolates when both endpoints have the same identity. Exact record selection restores every authoritative bit.

An accepted intervention at a fractional historical time settles the playhead at the preceding physical record, at most 1/60 simulation second earlier, then applies the input and replaces the future. Rejected inputs preserve the fractional view and recorded future. Camera movement and speed changes do not branch.

History has no eviction window. The final 91-second browser run retained 442.5 MiB of history payload, versus 603.3 MiB in round two. The same schedule produced 2,608 dropped tonnes versus 912, with all 5,483 records retained. Full measurements are in review/build-03/checks/performance-retention.json and its review index. This excludes JavaScript object overhead, renderer memory and event traces. It retained both early and later destruction and rebuilt exactly. More persistent moving bodies increase storage, and connected sections can remain active for a long time. Memory continues to grow until the page closes or resources run out.

## Verification and review

```sh
npm test
npm run check
node scripts/temporal-evidence-round3.mjs
node scripts/contact-evidence-round3.mjs
node scripts/collapse-evidence-round3.mjs
```

The browser drivers use Playwright against an isolated `agent-browser` session, at 1440 × 900 and DPR 1. Install `agent-browser` separately if reproducing browser checks:

```sh
AGENT_BROWSER_SESSION=blind-build-03 AGENT_BROWSER_SOCKET_DIR=/tmp/blind-build-03-browser agent-browser open http://127.0.0.1:4173
node scripts/measure-round3.mjs
node scripts/render-check-round3.mjs
```

The round-three capture driver has `prepare` and `run` phases for `temporal`, `collapse`, and `tank`. Prepare before starting an actual recorder, then run the corresponding flow:

```sh
export AGENT_BROWSER_SESSION=b3-capture
export AGENT_BROWSER_SOCKET_DIR=/tmp/b3-capture
export AGENT_BROWSER_ARGS=--disable-frame-rate-limit
agent-browser open http://127.0.0.1:4173
node scripts/capture-round3.mjs prepare temporal
agent-browser record start /tmp/temporal-review.mp4 --fps 30
node scripts/capture-round3.mjs run temporal
agent-browser record stop
agent-browser close
unset AGENT_BROWSER_ARGS
```

The capture-only frame-limit switch recovers a headless compositor stall observed on this machine. It does not alter the simulation clock or video playback speed. Performance measurements use normal browser frame limiting and exclude recording. The recorder's moving/held/moving preflight passed with this setting; full normal-speed playback review remains unverified.

Use a new isolated session for each take. The optional Python recording wrapper uses the locally installed product-demo helper and creates a separate task-owned session; the JavaScript driver and direct `agent-browser record` commands are portable without that helper. Do not overwrite delivered takes when reproducing them. Scripts for earlier rounds remain historical tooling; use the round-three commands above. The contact regression uses a portable fixture of the accepted build-two controls; its optional --baseline mode additionally needs the preserved build-two source snapshot. To check the final recorded tank controls, use `node scripts/contact-evidence-round3.mjs --capture review/build-03/checks/capture-tank-run.json` from the original checkout.

See the round-three review index for the exact source manifest, source diff, recordings, checks and acceptance boundaries. The first two ZIPs remain unchanged. The final source is uncommitted; no publication is part of this build.
