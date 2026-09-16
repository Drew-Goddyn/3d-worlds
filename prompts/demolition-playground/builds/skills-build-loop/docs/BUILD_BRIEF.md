# Build brief

## Working boundaries

Work in the local checkout of the named repository. First establish the repository root, origin, branch, starting revision or unborn HEAD, existing instructions, and working-tree state. Preserve unrelated changes. If the checkout is not the designated repository or another writer is actively changing it, report the conflict before editing.

This is a blind attempt. Use this prompt, this repository, artifacts produced during this attempt, and official dependency documentation as your source material. Do not find, inspect, import, or draw lessons from previous builds, other comparison sessions, their screenshots, scores, critiques, or implementations. Do not search the user's other repositories or neighboring workspaces for examples.

Local implementation, ordinary development dependencies, local execution, tests, and review captures are in scope. Leave changes uncommitted unless the human separately authorizes commits. Do not push, open a pull request, merge, deploy, publish, or incur paid-service charges.

Use one implementation worktree. Continue through routine technical decisions without asking for plan approval. Bring back a material conflict with the agreed behavior rather than silently changing the product.


## Original evaluation prompt


Create a maximum-ambition Three.js interactive demolition playground: a dense, sunlit, fully detailed downtown district built specifically to be destroyed - and un-destroyed - with spectacular, physically convincing structural collapse. The player swings a crane-mounted wrecking ball, places demolition charges, and triggers chain collapses; a slow-motion button turns disasters into ballet; a rewind control runs every collapse perfectly backwards until the city stands whole again. This must not be a flat gray physics sandbox, three breakable boxes on a plane, a dark apocalyptic scene, or a UI-heavy engineering tool. It is the guilty pleasure of knocking things down, given a whole gorgeous city.

The goal is the visual impression of a billion individually considered pieces - and the point is that the pieces COME APART: facades that shed bricks individually, floors that pancake, glass curtain walls that shatter into glittering sheets, water towers that tumble and burst, dust that rolls down streets in billowing walls. Achieve it with structural-joint simulation over instanced debris, not naive per-brick physics for the whole city at once.

If you use Three.js, add an import map before the module script mapping "three" and "three/addons/" to the same pinned version, and import only via those names. Everything procedural; no external assets.

#### FIRST FRAME - THE CITY, PRISTINE, WAITING
- Open on a bright, colorful, fully detailed downtown block cluster in morning light: a beaux-arts stone bank, a red-brick warehouse row, a glass office tower, a mid-rise with a rooftop water tower, a parking structure, street furniture, parked cars, trees, billboards - beautiful enough that destroying it feels deliciously transgressive.
- The wrecking crane already towers over the district with the ball hanging ready, gently swaying. A subtle highlight pulses on the ball: the invitation is instant and obvious.
- The district is safely evacuated but not dead: barriers ring the site, warning lights blink, a small crowd of hard-hatted spectators watches from behind fences at a safe distance, pigeons occupy the rooftops (they flee dramatically on the first impact).
- No menus, titles, tutorials or reveals - one glance communicates everything.

#### DESTRUCTION PHYSICS - THE ENTIRE POINT
- Buildings are built as genuine structural assemblies: columns, beams, floor slabs, facade panels and connection joints with strengths. Damage propagates: knock out corner columns and the corner sags, cracks race, then the corner peels away; take enough and the whole structure pancakes with floors slamming down in sequence.
- Materials fail differently and must read instantly: brick sheds as individual tumbling units and chunks; stone cracks into heavy slabs; glass curtain walls craze then shatter into sparkling instanced shards; steel bends and screeches (visually - kinked members); concrete crumbles with rebar exposed; the water tower ruptures with an actual water burst that washes debris.
- Debris is a first-class system: bouncing, sliding, settling into believable rubble piles that persist, throwing dust on impact; large pieces crush cars flat and snap trees.
- Dust and smoke are cinematic: rolling collapse clouds that surge down streets and slowly settle, backlit by the sun for maximum drama, never blackening the scene.
- Chain reactions are the jackpot: a falling tower can lean into its neighbor and take it down; the parking structure can collapse floor by floor; scripted-feeling spectacle from honest simulation.

#### THE TOOLS
- Wrecking ball: fully player-controlled crane rotation, cable length and swing momentum - skillful swings matter; the ball has real mass, cable physics, and satisfying follow-through into facades.
- Demolition charges: place up to a handful on structural members with a clear placement mode, then one big red plunger fires them in sequence with staged sub-second delays - the classic implosion, doable by hand.
- Slow motion: a prominent button (and hold-to-slow) dropping time to 10 percent with the camera free to fly through the frozen bloom of glass and dust.
- REWIND: the hero feature. A large rewind control runs recorded destruction perfectly backwards - debris leaping from the ground, dust inhaling, floors un-pancaking, glass reassembling into sheets - until the district is pristine. Scrubbing the timeline back and forth mid-collapse must work and is itself the best toy in the box. Implement by recording simulation state snapshots; make it flawless over at least the last 60 seconds of activity.

#### SCORING WITHOUT BUREAUCRACY
- No menus or mission text: a minimal, playful readout tallies tonnage dropped, chain-reaction multipliers, style bonuses (clean implosion into own footprint scores headline praise from the spectator crowd, who cheer and raise phones).
- The crowd reacts to everything: ducking at big impacts, cheering good collapses, scattering pigeons.

#### LIGHT AND FIDELITY
- Bright morning sun, saturated materials, glittering glass, warm brick and cream stone: the prettier the city, the better the destruction. Dust clouds glow amber against the light.
- Every building rewards close inspection BEFORE destruction: cornices, window frames, fire escapes, rooftop clutter - detail that then becomes debris rather than vanishing.

#### CONTROLS AND CAMERA
- Orbit, pan and zoom immediately, plus a smart action camera toggle that frames the current collapse cinematically; reset restores the hero overview (rewinding separately restores the city).
- Compact controls only: tool selector (ball / charges), slow-mo, rewind/timeline, action-cam toggle, and a reset-city button that plays the full rebuild-rewind as its animation.

#### PERFORMANCE
- Structural simulation runs at coarse joint level; visual debris is instanced and pooled with LOD (near debris full 3D, far debris imposters); dust via layered shader volumes; sleeping bodies aggressively managed.
- Quality selector reduces debris counts, dust resolution and far detail before ever compromising collapse believability, slow-mo smoothness or rewind fidelity.
- Smooth on a modern laptop through a full multi-building collapse, devicePixelRatio clamped to 2. The outcome: the most satisfying destruction toy on the web - and the undo makes it endless.


## Agreed interpretations

These decisions clarify the original prompt. They do not replace it with a smaller feature set.

## Causal destruction

Use causal, engineering-inspired game physics, not engineering-grade analysis and not canned building-collapse animations.

Structural connectivity, support loss, mass, impacts, and joint failure determine what falls and what it hits. Procedurally authored fracture patterns and cinematic effects are appropriate when driven by these events.

Different support targets, swing momentum, and charge placements must meaningfully change the result. A neighboring structure fails because it is physically compromised, not because a nearby collapse starts a timer. Water must affect debris, not merely look like water.

## Time, retained history, and restoration

The rewind guarantee covers at least 60 seconds of forward SIMULATION TIME, not wall-clock viewing time. At 10% speed, the simulation clock advances at one tenth speed. Pausing and scrubbing do not consume forward-history capacity.

Sixty seconds is a guaranteed minimum, not permission to forget older destruction. Preserve earlier destruction in the current run so reset-city can rebuild the entire district by traversing its recorded history. There is no requirement to persist a run across page reloads.

Do not replace expired history with an invented assembly animation and call it exact rewind. Any actual retention limit or fidelity loss must be disclosed as a limitation.

Use recorded simulation-state snapshots as required by the original prompt. Choose the storage, compression, sampling, and reconstruction approach yourself, preserving the required behavior.

The displayed world and the state needed to continue from it must agree with the playhead. Account for damage, joints, positions, orientations, velocities, crane and cable state, placed charges and their timing, debris identities and lifetimes, water, dust, crowd/pigeon reactions, and scoring. Include whatever procedural/random state is necessary to reproduce the chosen moment faithfully.

## Changing the past

Scrubbing and passive playback preserve the recorded future. From a historical moment, passive forward playback follows that future.

An accepted world-changing player input at a historical moment creates a replacement future and abandons the previous future from that point onward. Resume from the restored physical state, not from displayed transforms laid over a different live simulation.

Camera navigation, tool selection alone, playback speed changes, and inspection do not create a replacement future. Replaying a collapse must not award its score repeatedly.

Reset-view changes the camera only. Reset-city restores the city by playing its recorded history backwards; it is not a disguised reload, instant replacement, or substitute visual effect.

## Discoverable controls without onboarding

Small control labels, shortcut badges, contextual targeting cues, and compact tool-specific hints are allowed. Introductory screens, instruction walls, title treatments, tutorial panels, and click-to-reveal scenes are not.

Keep the pristine city dominant in the first frame. Make valid charge targets and the active interaction mode legible. Choose input mappings that allow immediate camera use without fighting crane manipulation or charge placement.

## Runtime and comparison environment

Build a desktop-first, locally served browser application for keyboard and pointer input. Modular source files are allowed. Use Three.js and retain the exact import-map/named-import requirement in the original prompt.

Everything visual is procedural. Standard code dependencies are not scene assets; external models, photographs, textures, HDRIs, fonts, and generated image assets are outside the brief.

Mobile support, offline packaging, and deployment are not additional requirements.

Target 60 frames per second. Record the actual browser, hardware/rendering environment, viewport, device pixel ratio, and quality setting used for measurements. Report measured behavior during multi-building collapse and rewind. Software-rendered automation can support correctness checks but does not establish performance on a modern hardware-accelerated laptop.

