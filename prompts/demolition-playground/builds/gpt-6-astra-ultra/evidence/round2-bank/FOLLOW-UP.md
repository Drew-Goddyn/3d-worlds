# Astra demolition world — Round 2: make Mercantile Bank extraordinary

Repository: https://github.com/Drew-Goddyn/3d-worlds

Continue the existing application at:
`prompts/demolition-playground/builds/gpt-6-astra-ultra/`

This is an implementation commission, not a request for a proposal. Start from main, protect the original, then carry the work through implementation, actual browser inspection, meaningful revision, and a playable result.

## The commission

Give one building the concentrated creative and technical attention that the original run spread across an entire city.

Transform the existing Mercantile Bank into the district's outstanding destructible building: beautiful enough to reward close inspection, constructed convincingly enough that damage makes visual sense, and satisfying enough that I want to destroy it several different ways and scrub backward through the consequences.

Keep it inside the existing Astra world. Its architecture, materials, damage, structural movement, rubble, lighting, controls, and rewind are one experience—not separate art and physics deliverables.

The surrounding world is the starting advantage. Spend this round deepening the bank, not recreating the city or its supporting systems. Small scope does not mean small ambition.

I will judge the result as a player and viewer. Own the implementation decisions; do not require me to understand classes, choose a physics architecture, operate Blender, or manage an engineering backlog.

## Protect the original; continue in place

Inspect the working tree before changing anything. Preserve unrelated work. From the current verified main baseline, create a task branch named `round2/astra-mercantile-bank` before editing; use a non-conflicting suffix if necessary. Record the exact baseline commit. Check for a newer remote main when available, but do not reset, discard changes, or rewrite history to synchronize it.

Work in the existing Astra directory on that branch. Do not create a sibling application, a new independent model attempt, or a standalone building demo. A temporary baseline worktree for comparison is fine; it is not a second implementation.

Leave main, the other models' builds, the original prompt and SPEC, existing showcase catalog entries, published previews, and historical evidence untouched. Put new evidence in a separate round-two location. Do not regenerate the showcase films or invent a new catalog scheme.

The directory's `ultra` label describes the original build, not this continuation. Record the actual session model/reasoning setting when available from reliable session metadata; otherwise mark it unverified. Do not infer it from the directory name or assume this prompt changes the setting.

Commit completed work locally on the task branch. Do not push, merge, publish, or deploy.

## Establish the real starting point

Read applicable repository instructions, including any AGENTS.md files that actually apply to this directory. Do not inherit another independent build's instructions merely because it is nearby.

Read the root README, `showcase/README.md`, the original `prompts/demolition-playground/PROMPT.md`, and Astra's README and SPEC. Within Astra, inspect the relevant parts of `src/city.js`, `src/simulation.js`, `src/fracture.js`, `src/history.js`, `src/main.js`, the crane integration, and existing tests. Inspect more only where necessary.

The existing bank is named Mercantile Bank in `src/city.js`. Verify the current implementation instead of assuming earlier descriptions are still exact.

From the repository root, the current launch and test commands are:

    node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
    npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test

The default local address is `http://127.0.0.1:4173`; verify it in your environment. Root-level npm scripts are not the Astra test suite.

Run the baseline, inspect the actual bank intact and under damage, and check the relevant tests before substantial changes. Capture a small comparison baseline using repeatable camera positions and actions. Distinguish pre-existing shortcomings from regressions you introduce.

Then give a short plain-language statement of the largest limitation you observed and the improvement you will pursue. Proceed without waiting for approval. Do not make repository archaeology or planning the main deliverable.

## The experience to build

### A bank worth approaching

Retain its identity as a warm, cream-stone, Beaux-Arts bank in the bright existing district. Respect its site, overall scale, and relationship to the street and neighboring buildings.

Make its architecture feel deliberately composed rather than like a decorated stack of boxes. Use convincing depth and proportion: a substantial entrance, readable columns and capitals, recessed windows, stone courses, projecting cornices, and a considered roofline. These are an artistic direction, not a quota of ornaments.

Give materials believable variation and light response without burying the architecture in noise. Important details should read from the normal district view, with additional rewards when approaching and orbiting. Do not achieve apparent improvement by changing the whole world's lighting or hiding the bank behind a flattering camera.

Give damaged openings something convincing to reveal: floor thickness, interior depth, supporting members, and selected interior surfaces. A complete explorable interior is not required. An empty shell or an opaque box behind broken windows is not the target.

### Damage that belongs to the place I hit

A limited hit should be capable of producing a localized wound while much of the building remains standing. Different hit positions and different degrees of damage must matter.

Where support is lost, make the consequences legible: connected elements respond, surviving support can temporarily hold a section, and further damage can change the outcome. A corner or bay must be able to behave differently from the entire storey above it.

The central improvement is not merely more particles around the old rigid-floor behavior. Give the bank enough independently meaningful structure to support visibly richer local failure.

Allow the current representation to change where it prevents this. Choose an appropriate browser-friendly approximation; I am not asking for a validated civil-engineering simulator or a separate rigid body for every stone.

Do not force every small impact into a total collapse. Equally, do not make the building effectively indestructible to preserve a beautiful partial-damage screenshot.

### A collapse made from the building I was looking at

When damage becomes extensive enough, produce a convincing progression from instability to separation, impact, secondary breakage, and settling—not an identical explosion for every input.

The architecture should become recognizable rubble. A cornice or column section should retain a visible relationship to what it was before breaking away. Openings and fracture surfaces should make sense; avoid unsupported floating ornament, conspicuously hollow pieces, duplicate geometry, and a pristine structure concealed behind decorative debris.

Prepared fracture pieces and simplified dynamics are acceptable. A fixed collapse animation, damage timer, or camera-specific trick standing in for responsive structural behavior is not.

Let major pieces feel heavy and glass feel different from stone. Use smaller fragments and dust to enrich the event, not obscure it. Dust should reveal the action through light and motion rather than cover structural defects.

Major rubble should remain as a readable aftermath. Fine particles may have bounded lifetimes, but the important architecture must not simply disappear to save performance. Nearby interactions should remain credible where the existing world supports them; this is not a commission for a new city-wide interaction system.

### The same event, backward

The improved building must work with the existing ball, charges, slow motion, orbit/pan/zoom, action camera, timeline, rewind, and rebuild behavior.

Scrubbing backward must restore the actual recorded event: separated pieces return, damage disappears at the appropriate moments, and the bank becomes the same intact building. Scrubbing forward must not invent a different collapse.

Preserve the existing distinction between replaying retained history and taking a new demolition action in the past to create a different future. Include all newly introduced state needed for correct restoration and continued simulation, not only visible positions.

Preserve the rolling minute of history and the permanent pristine rebuild. Do not quietly reduce rewind duration, remove surrounding activity, or disable existing features to accommodate the bank.

## Implementation freedom and boundaries

Make substantial changes when needed within this scope. Bank-specific geometry, structural logic, fracture preparation, and focused modules are welcome. Necessary changes to shared simulation, collision, input targeting, or history code are permitted, provided they are justified by this building and checked for regressions elsewhere.

Do not freeze the old architecture merely to minimize the diff. Do not use the commission as permission to replace the engine, rewrite every building, create an editor, introduce a generalized asset framework, or build infrastructure for fifty hypothetical future commissions.

Preserve the procedural, self-contained, offline character of the application and its pinned Three.js integration. No downloaded art packs, hosted generation services, or runtime network dependency. Prefer the existing toolchain. An offline procedural generation step is acceptable only when it directly improves this result and its source is retained; ordinary launch must not require Blender or a new asset-service setup.

Keep useful construction parameters and generation logic understandable enough for later work to build on. Retain the actual working recipe, not just screenshots. Do not prematurely extract a universal building library or implement a second improved building during this round.

Keep the player interface compact. No engineering dashboard, required tuning knobs, or new tutorial flow. Small control or camera changes are acceptable only when necessary to use and inspect the improved building.

## Build, inspect, and revise

Use browser and visual tools available in your environment. Treat the first working implementation as a candidate, not automatic completion.

Inspect its appearance and motion together in the real district. Identify the most consequential visible weakness, address it, and inspect again. Favor improvements to the experienced result over additional features, documentation, or arbitrary test counts.

Use a compact, reproducible set of play situations:

1. Intact inspection: the usual district view and a close orbit showing the entrance, a side/corner, and architectural depth.
2. Local damage: a limited hit that leaves meaningful structure standing, plus a comparable hit at a different location that demonstrates a location-dependent result. Include the native wrecking ball.
3. Larger failure: use the native charges or further player-driven impacts to cause substantial collapse; inspect the progression and settled rubble at normal speed and in slow motion.
4. Time control: scrub backward and forward through the interesting event, replay it, take a different action from the past, and rebuild to pristine. Also smoke-test ordinary destruction elsewhere in the district.

Exercise the actual player input paths. Diagnostic scripts may help reproduce inputs or inspect state, but direct state manipulation is not evidence that player controls work. Clearly distinguish diagnostic tests from player-visible demonstrations. Do not add a hidden easy-collapse mode for the capture.

Inspect temporal evidence, not just attractive stills. Review normal-speed motion, and use slow motion or ordered frame sequences to investigate defects. Use matched before/after views for comparison and an additional angle to avoid overlooking hidden problems.

Run Astra's existing tests and add focused checks for the new failure behavior and rewind state. Keep the underlying protections when representation changes require updating implementation-specific assertions. Do not remove a failing safeguard merely to make the suite green.

Check responsiveness under representative bank destruction and a multi-building sequence. Compare baseline and candidate on the same environment and settings, with a small amount of measured frame-timing and resource evidence where available. Report limitations of headless or software rendering. Do not turn this into a performance research project or claim laptop performance from an unrepresentative capture.

Use appropriate batching, bounded detail, and sleeping/simplified distant debris. Do not buy performance by removing the local failure behavior, important rubble, history fidelity, or neighboring world that makes the commission meaningful.

## Evidence and handoff

Keep evidence proportional to the work: a few useful before/after captures, a short motion demonstration or temporal sequence, the focused test results, and brief reproducibility notes. Save it separately, for example under Astra's `evidence/round2-bank/`. Do not overwrite original verification or claim someone else's historical measurements as this run's results.

Save the exact follow-up prompt and one concise round-two note recording the baseline commit, actual or unverified session settings, key changes, useful launch/reproduction instructions, and remaining limitations. Add a small continuation notice to Astra's README so this branch cannot be mistaken for the untouched original attempt. Do not produce a new roadmap or documentation framework.

Finish with a plain-language report covering:

- How to launch and find the improved bank, and the most revealing actions to try.
- What became visibly and behaviorally better, with evidence paths.
- What remains approximate or disappointing, and any regression or verification gap.
- The branch, baseline and result commits, and checks actually run.

Do not claim the result is “2x better” or “100x better” without a meaningful basis. Do not equate passing tests with visual success or claim my visual acceptance. Deliver your best inspected candidate for my review.

Continue through implementation and meaningful revision rather than stopping after a plan, a gray-box prototype, or the first passing test. Use judgment on ordinary implementation choices. For a genuine capability blocker, explain precisely what you attempted, what remains possible, and what is unverified; do not present missing browser inspection as successful visual validation.

The standard: a visibly richer, more convincing, more enjoyable Mercantile Bank whose improvements survive actual play inside the existing Astra world. I should want to approach it, experiment on it, and watch the consequences again—not merely read that its implementation is more sophisticated.