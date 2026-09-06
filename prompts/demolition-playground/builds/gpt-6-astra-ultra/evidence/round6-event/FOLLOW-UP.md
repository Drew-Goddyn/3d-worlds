# Astra — Round Six: make the demolition event extraordinary

Repository: https://github.com/Drew-Goddyn/3d-worlds
Application: `prompts/demolition-playground/builds/gpt-6-astra-ultra/`
Preceding candidate: PR #4, `round5/astra-demolition-leap`

Execute this commission in the existing application. Own the creative direction, technical decisions, implementation, inspection, and handoff. Deliver a complete playable candidate and one new unmerged PR, not a proposal, a feature backlog, or a promotional film.

## The commission

**Give the demolition event itself the concentrated authorship and effort that the original prompt gave the entire world.** Make causing, observing, slowing, and reversing destruction substantially more compelling through a coherent visual-and-acoustic response to the actual event.

Keep the compact district. Its small, focused, tech-demo character is intentional. The existing bank, architecture, connected descent, charges, and history are your starting advantage. This is not permission to build a waterfront, a larger city, new ambient life, or another physics research project.

Create one strong interpretation of how this world communicates disturbance, weight, failure, impact, and settling. The visible effects, sound, light response, and changing intensity should belong to the same event. You decide what makes that interpretation exceptional. Do not simply increase particle counts and volume or implement a checklist of explosions, smoke, sparks, and rumbles.

The payoff must be apparent at the building/district scale the owner normally uses. A limited wound and a substantial collapse should have recognizably different character. The result should reward watching the construction throughout the event and examining it in slow motion or reverse. It should remain compelling with sound muted, and gain something meaningful when sound is enabled.

Illustrative ambition, not a required sequence: an intervention has a clear local origin; disturbed construction develops a readable response; impacts feel related to what lands and where; the event has changing intensity rather than continuous maximum noise; suspended material settles to reveal the real ruin. Find your own coherent treatment within the bright, stylized identity.

**This round improves the experience of the existing demolition. It does not claim to solve indivisible frames, material fracture, or the underlying rubble model by covering them with effects.**

## Preserve the checkpoint without concealing the timing concern

Read applicable repository instructions and inspect the working tree, current remote refs, PR #4, and review discussion. Preserve unrelated work. Never reset, discard changes, force-push, or bypass protections.

Known references to verify:
- PR #4 base / round-four architectural checkpoint: `cdeeb901cfe50361dc5bfcf63b48e3e0e8399e1f`.
- Round-five runtime implementation: `8535020890ad135f85fec68cebc009ddd89b1d54`.
- Last reviewed PR #4 head: `5df5068fe01d5a81f75c459bc553eda6671ec789`.

The owner considers round five the best result so far and wants to retain its connected descent. This commission authorizes checking and merging that known work as the next checkpoint, **subject to resolving or honestly dispositioning its known performance concern**. This is not acceptance of perfect rubble or physics. Do not silently merge materially new, unrelated work that appeared after the identified head.

First perform the already-requested compact timing check: repeat the existing comparable charge sequence with other agent verification jobs stopped. Measure without recording; capture separately. Compare wall-clock and simulated elapsed time as well as frame intervals. Prior headless measurements reported approximately 21.86 ms mean / 70.30 ms p95 during active collapse, under contention; sampled playback also suggested simulation lag. These are warnings to investigate, not clean hardware benchmarks or a demand for perfect frame pacing.

If a small, evidence-backed correction is needed, make it in PR #4 before checkpointing and rerun the affected checks. Do not hide lost simulation time, remove the connected behavior, or lower the workload to manufacture a pass. If normal play has a severe unresolved pacing regression that requires a substantial solver project, leave PR #4 unmerged and report that specific blocker rather than piling this commission on top or silently expanding into an engine rewrite. Lesser disclosed limitations need not become an endless optimization gate.

If PR #4 is already merged, verify the expected work and still establish the clean baseline. After closeout, branch from updated main as `round6/astra-demolition-event` (use a nonconflicting suffix if needed). Record the exact starting commit. Make one new PR against main and leave it unmerged. No deployment. If permissions or protections prevent closeout, explain the blocker; do not publish an implicitly stacked or misleadingly based PR.

## Start from the actual experience

Read the root and Astra READMEs, original creative brief, and the short round-five review. Historical task prescriptions are context; this commission controls the new scope and method permissions. Inspect relevant event, dust, audio, rendering, and history paths rather than every archived probe.

Useful entry points are `src/main.js` for sound/event wiring and playback, `src/simulation.js` for events and effects, `src/history.js`, and the bank physics/cohesion modules where additional event information may be needed. Verify their current contents.

From the repository root:

    node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
    npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test

Default local address: `http://127.0.0.1:4173`. Verify runtime requirements; root npm scripts are not the Astra test suite.

Inspect the baseline using normal charges, with sound enabled and muted. Reuse the existing low-corner and larger front/right charge routes. After inspection, state your central creative idea in one short paragraph, including what the viewer will experience differently. Choose and proceed; do not ask the owner to select a sound library, renderer, or technical architecture.

## Broad authorship, narrow subject

You may substantially replace the current sound and visual-effects implementations, improve event payloads, and make necessary rendering or history changes. Modest lighting or material changes may support the event, but redesigning the bank's architecture or relighting the entire district is not the main deliverable.

Use event location, motion, material, contact, or damage information as appropriate. A convincing authored approximation is welcome; a fluid simulation or physically simulated acoustic field is not required. Connected sections, major rubble, furnishings, and structural outcomes must remain honest and visible. Minor particles may be visual-only, with sensible lifetimes.

Sound may be procedural, sample-based, or hybrid. Suitable local assets, offline authoring tools (including the installed Blender), and browser-compatible libraries are allowed when they directly improve this result. These permissions supersede the original procedural-only/no-external-assets restriction for this continuation. Pin dependencies, record asset sources/licenses, and retain useful editable sources or preparation recipes. Ordinary launch must stay simple and self-contained, without external runtime services. Do not require the owner to operate authoring tools.

No paid assets/services, account changes, external upload of project material, whole-application migration, or removal of a defining capability without approval. Do not build an editor, harness, generalized effects framework, or asset-shopping project. If considering a substantial technical replacement, prove the decisive behavior and integration in a small bank-relevant test, then deliver the full experience; the test is not the end product.

Preserve normal player camera control. Camera-dependent rendering is fine; a camera that moves to conceal problems is not. Any new shake or other forced motion must be restrained, disableable, and unnecessary to appreciate the result. Avoid harsh flashes. Keep the compact existing controls and a clear mute/level control; no tuning dashboard, compulsory music, or surprise loud autoplay.

A clean inspection view is allowed, using the actual implementation. Label isolated checks, especially when surrounding visibility or collisions differ. Return to the real district throughout development. The final evidence must not hide or remove physical neighbors to flatter the event.

## Causality and time are part of the design

New effects must originate in what actually happened. A crack sound should not imply a crack the construction never made; a metal reaction should not be indiscriminately applied to stone. Artistic exaggeration is permitted, but not invented structural events or an identical catastrophe triggered by every charge.

Dust may obscure part of a collapse naturally; it must not remain an opaque cover over every important moment. Do not add more dust to disguise the intact-frame or rubble limitations. Sound should convey distinctions, distance, and changes in activity rather than turning each emitted event into the same louder bang. Bound overlapping voices and effect work; a busy collapse must not become a clipping wall of noise.

Preserve the actual physics outcomes while developing this presentation. Necessary event hooks and demonstrated correctness fixes are allowed; changing charge power, supports, or fracture behavior just to produce a better-looking comparison is not. Keep visual/audio randomness separate from structural randomness so enabling sound or changing effect quality does not change the demolition.

The existing rolling minute, immutable history, replay, alternate futures, and permanent pristine rebuild must remain coherent with the new layer:

- Visible effects follow simulation time and restore when scrubbing, including effects born before the oldest retained frame but still visible. Replaying retained history must reproduce the event, not rely only on callbacks from fresh forward simulation.
- Sound has a deliberate policy for forward play, pause, slow motion, seeking, rewind, and resume. Stop stale voices and queued sounds on timeline changes; do not replay a backlog of blasts after seeking or allow discarded-future effects to leak into a new branch.
- A convincing reverse treatment is welcome. Sample-perfect reversal of an entire recorded audio mix is not required. Free scrubbing may use restrained feedback or silence instead of repeatedly triggering full-volume impacts. Normal-speed retained replay must still sound like the recorded event, with consistent sound choices.

You choose an economical representation: recorded events, bounded effect state, deterministic reconstruction, or a suitable combination. There is no requirement to store every particle every frame or to build a generic time-travel platform. Preserve the experience, not every existing effect array.

## Build, inspect, and make the comparison honest

Build a complete candidate, inspect it, and revise the largest weakness of your chosen interpretation. Do not stop at shader previews, an audio sample pack, a first passing test, or a spectacular capture that is unpleasant in play.

Use ordinary charge controls. Compare the same meaningful actions and views at normal speed: a localized intervention, a differently placed one, and substantial collapse through settling. Include a second angle and the real district view. Keep the ball working with shared changes, but do not make crane aiming or collision repairs the project.

For review, distinguish a creative pacing decision from runtime lag. Compare elapsed wall and simulation time; retain true recording timestamps and explain capture gaps. Do not compensate by slowing, speeding up, or cutting idle periods out of the evidence. Measure performance separately from recording, with no concurrent verification jobs. Compare baseline and candidate at the same viewport/settings, and do not quietly reduce structural quality or history to make effects affordable.

Add focused tests for new event/history ownership and timeline transitions; preserve the existing structural and input protections. Check repeated demolition/rebuild for accumulating particles, voices, scheduled audio, allocations, or missing cleanup. Do not launch a sprawling verification campaign or produce an archive of every intermediate dump.

Where a fresh media-capable reviewer is already available, use one paired comparison after the complete candidate. Supply actual matched media, neutral labels, action/time information, and this brief:

> Which version makes causing, observing, and reversing demolition more compelling at ordinary viewing scale? Judge readability, the relationship between construction and effects, changing intensity, and sound-image coherence. Bigger clouds and louder sound are not automatically better. Ground up to three observations in particular moments; recommend at most one correction. A tie is allowed. State whether you inspected continuous motion, extracted frames, and actual audio; do not infer a sound-quality judgment from a waveform or silent video.

Interpret the advice; allow at most one further externally prompted artistic pass. Your own inspection and necessary debugging remain required. If no suitable reviewer or listening capability exists, disclose the limitation, do useful checks, and deliver the media for owner review. Do not create a reviewer platform or pretend a separate context heard audio it could not access.

## Deliver reviewable audio and video, not just screenshots

Save selected final evidence under `evidence/round6-event/` and create a small evidence-only `bank-event-round6-review.zip` at an accessible local path. Reuse the existing viewer/capture helpers with the minimum changes needed for sound. Do not commit the ZIP alongside its contents.

Include matched baseline/candidate recordings containing the **actual application audio**, plus a short slow-motion/rewind/branch demonstration and modest timestamped image strips. A silent canvas video is not sufficient evidence for this commission. Route the application's output into the recording; do not request microphone access or add a soundtrack afterward. Check that an audio track exists, has non-silent signal when expected, and remains aligned with the image. Do not autoplay or mix two comparison soundtracks together; the viewer should let the owner select A or B at comparable levels.

The baseline's quieter or less differentiated audio may legitimately be weaker. Record both with sound enabled, consistent master playback settings, and comfortable headroom. Do not win the comparison merely through higher output level. Record a muted viewing check as a review observation; duplicate full silent movies are unnecessary.

Provide one concise `REVIEW.md`: the creative idea, exact baseline/runtime/evidence references, how to launch and enable sound, reproducible charge actions, sound/time-control policy, observed improvements and limitations, representative timing/resource evidence, asset/dependency provenance, and what was actually seen/heard/tested. Save this commission as `FOLLOW-UP.md`. Record actual session model/reasoning only if reliably available; otherwise mark unverified.

Keep historical media and other model builds intact, and add only the small continuation notice needed to distinguish this version. Leave working effect/audio entry points and useful recipes easy for the next agent to inherit. No new roadmap or universal library.

Finish with checkpoint status, new unmerged PR, exact result commit, launch instructions, one revealing thing to try, and the ZIP's real local path. Give a candid assessment, including what still belongs to the inherited destruction limitations. Do not claim owner acceptance, an arbitrary quality multiplier, or successful listening/playback checks you did not perform.

**The standard: the same small demolition experiment becomes substantially more absorbing because its real events are expressed with coherent visual and acoustic character. A new layer of depth, not a larger world and not a curtain over unfinished physics.**
