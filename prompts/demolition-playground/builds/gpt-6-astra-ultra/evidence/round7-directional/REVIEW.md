# Mercantile Bank — shape the fall

The candidate makes a damaged facade travel as recognizable connected construction before impact breaks it apart. Three low front charges pull the arcade toward the street; three low side charges turn the gallery wing and fold the vault into the opened court. The retained checkpoint already had lateral movement. The gain here is the shared movement of the taller construction and the roof's response to the wing leaving. **This is an unmerged experimental candidate, with a significant busy-collapse performance cost. Owner acceptance is still pending.**

Open [viewer.html](viewer.html) for the matched muted comparisons, the presentation-suppressed inspection, transport demonstration, and different ruins. [progression.jpg](progression.jpg) samples the final front/side films at marked wall times. [before.jpg](before.jpg) shows the intact bank and charge setup. Movies preserve captured wall time; their slower periods are not authored dramatic pacing.

## Checkpoint and exact source

PR #5 was checked and merged only at the authorized reviewed head `3d2e55e6ae4036fc6c91797acc4d2255b55ba1d9`, retaining runtime `e9ecb689ef97b9fd677903d5adea4bd38c36b062`. Baseline footage was served from that reviewed head; its application source tree is identical to the merged checkpoint. The new branch starts from the exact merged baseline `e4dc0d032020417efc09b519722c4cfafa118ea4`. The owner values the visual sense of movement, sound is secondary, and known heavy-collapse cost was accepted provisionally. That checkpoint decision does not approve perfect physics, verified audio quality, or universal performance.

**Final verified result: `9b9a743e7c0fc536da1e94cec74801cba9348a7a`.** This is the exact application and test commit used for final evidence. Later commits only add review material and continuation documentation. Branch: `round7/astra-shape-the-fall`; one new PR against main, left unmerged. No deployment. Session model and reasoning settings are unverified. The exact commission is retained in [FOLLOW-UP.md](FOLLOW-UP.md).

## Ordinary play

Launch from repository root:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
```

Open `http://127.0.0.1:4173`, choose Charges, and click low structural members. Rebuild between comparisons. The original six-charge budget and ordinary charge strength apply throughout.

| Intervention | What to try and watch |
| --- | --- |
| Three across the front | Left, middle, right at the base of the front facade. Watch the tall arcade lean together, then break near contact. |
| Three down the right side | Rear, middle, front at the base of the right wall. Watch the gallery wing turn away and the vault yield into the court. |
| One front-right charge | A useful small wound: the final native run released local material while all 27 bearing bays remained standing. |
| One front-left charge | A larger partial failure: the demonstrated run released 10 bays while 17 remained. The bank is not symmetrically predictable. |
| Later cut | Pause during a fall, rewind, then place another charge on surviving upper construction. This replaces the retained future and acts on the changed geometry. |
| Substantial demolition | Combine the front and right sequences, using all six ordinary charges. |

The input records contain requested world points, projected mouse coordinates, actual accepted body anchors, camera, and simulation/wall-time traces: [baseline-recordings.json](baseline-recordings.json), [final-recordings.json](final-recordings.json). Camera position was `[16,20,47]`, target `[-11,6.8,14]`, viewport 1440×900. Charges and transport used real mouse/button/range controls; camera setup and observation used the existing inspection API. Requested front points were `[-15.7,1.3,19.65]`, `[-11,1.3,19.65]`, `[-6.3,1.3,19.65]`; side points were `[-4.8,1.3,10]`, `[-4.8,1.3,14]`, `[-4.8,1.3,17.8]`. Raising only the middle side point by 22 cm still produced the same broad side-wing event. See [placement-family.jpg](placement-family.jpg).

The clean comparison hides only dust, event clouds/grit and event lights. Physical district neighbors, furnishings, retained bank construction and rubble remain enabled. Movies are silent canvas recordings; no new audio-quality claim is made. H.264 copies are scaled to 1280×800 for a small portable package, with variable frame timestamps retained. The paired viewer starts playback together, not at certified matching simulation frames. Native frame intervals and the simulation clock differ between runs; input traces disclose them. Secondary breakup and neighboring-building motion differ between the separate clean and ordinary runs. The clean instrumentation changes visibility only; these are not identical fixed-step replays. Screenshot/strip timestamps are observational wall-time samples, not a smoothness guarantee.

## What changed and what the revision taught

The central change is to let remaining supports and connections carry and redirect the bank's actual mass. Previously each support bay had its own support-loss countdown and pivot response. The bank now has 27 interacting bearing bays and ten separately supported half-arches. Pier feet, touching masonry ties, arch feet and crown connections constrain gravity-driven movement. Damage changes stiffness and capacity; surviving construction takes the reaction. Breaking connections releases the carried motion into existing connected sections and finite architectural rubble. No scenario label, camera-dependent rule, extra directional kick or authored final pose chooses a fall.

The solver is local to the bank. It follows compliant position-constraint methods described in [XPBD, Macklin, Müller and Chentanez (2016)](https://matthias-research.github.io/pages/publications/XPBD.pdf), with actual retained-member mass/inertia and a bounded four substeps/five constraint sweeps. No library, asset, external service or dependency was added. Geometry remains editable in the existing construction recipes. New rigid poses, momenta, roof membership/state, connection rupture/strain and equilibrium sleep state join captured history. Membership is derived from the retained construction; live evolution cannot rewrite the saved frame.

One neutral external media review preferred the accepted checkpoint over the first complete candidate: that early candidate delayed, then produced two overly similar downward ruins. Its sole artistic correction was to retain distinct wall paths and let the roof yield toward missing support. The final revision lets wings carry their height through the turn, with independently hinged vault halves. The external reviewer inspected dense 0.25-second temporal strips, not continuous video perception. There was no second external artistic campaign. Final builder inspection covered chronological motion, clean presentation, normal and native slow motion, contact/breakup, and later ruins; it does not certify human taste or continuous playback feel.

Independent verification also caught and drove repairs to a missed roof wake, a contact impulse lost between a connected section and its members, and collision damage spreading through air to untouched construction. Falling pieces now damage the actual struck member; neighboring supports respond through connections or subsequent contact. Ordinary charge/ball damage retains its established behavior.

The small [fixed-step diagnostic](causal-check.json) is bank-only, without district/presentation, and is **not native player footage**. At two simulation seconds the largest still-connected upper-bay displacement was 3.02 m toward the front for the front cut, versus 2.97 m sideways for the side cut; the raised side placement produced 2.85 m sideways. Each retained substantial connected architecture; the full tests additionally check rigid member spacing and direction over time. These measurements establish differing construction paths, not a visual-quality multiplier. Exact saved-state continuation passed for all three diagnostic routes.

## Verification and cost

Independent verification passed **57/57 tests**, with no skips, weakened assertions or exemptions. The full run used `76e9ecf`; the final `9b9a743` follow-up completes only an isolated test fixture's existing particle sink, and its exact five contact tests also pass. Application source trees are byte-identical. Read [verification.log](verification.log) and [contact-after.log](contact-after.log). The original 51 tests retain their assertions; six new tests extend protection.

The property-level [before proof](contact-before.log) fails because an untouched neighboring member loses health to `0.8845561932`; after repair it remains exactly `1`. In the original far-corner support-loss fixture the opposite bay now has **zero damaged and zero released members**, rather than 35/119 pieces released. Independent [construction checks](construction-checks.log), [roof-only checks](roof-check.log), and [connected-section contact checks](section-contact-check.log) cover the earlier failures. Six ordinary charges settle to zero moving pieces at the original 12.3-second horizon under varied frame intervals, remaining quiet through 42.3 seconds with all 1,864 fixture pieces retained. The normal district has 1,865 pieces because its recipe differs slightly from the isolated fixture.

[Native controls](native-checks.json) passed normal/slow motion, pause/reverse, scrub, retained replay, a later accepted charge that truncates the old future, ball interaction, camera/quality controls, and exact pristine rebuild. The rolling minute retained 60.0476 seconds across 1,202 frames after eviction; pristine rebuild still restored the original bank exactly with zero remaining event births. Browser error and console collections were empty.

One unrecorded baseline/candidate pair used the same six native front/right charges, camera, 1440×900 viewport, high quality and muted sound. Project test, capture, encoding and diagnostic jobs were stopped for the pair; ordinary desktop background activity was not frozen. Media capture was separate. Raw evidence: [baseline-timing.json](baseline-timing.json), [final-timing.json](final-timing.json).

| Measurement | Accepted checkpoint | Round Seven |
| --- | ---: | ---: |
| Early 0.5–6 wall seconds, mean frame interval | 22.73 ms | 87.30 ms |
| Early interval, 95th percentile | 66.70 ms | 133.30 ms |
| Late 9–14 wall seconds, mean frame interval | 16.67 ms | 16.67 ms |
| Simulation advance over approximately 14 wall seconds | 13.663 s | 11.763 s |

This is a significant new busy-collapse cost. The prototype recovers after the active event, but the slow interval makes normal play less fluid. No history was shortened, moving construction removed, or frame gate relaxed to obtain these results. This PR remains unmerged so the owner can judge that tradeoff with the actual event.

## Verdict and package boundaries

My judgment is that this is a meaningful construction improvement: the front and side events now carry large recognizable wings through different paths, and the roof participates in the loss of support. The most convincing moment is the side wing turning while the vault comes down behind it. The speed cost is the largest disappointment. Prepared fracture boundaries, abrupt section breakup, coarse contacts, and orderly-looking rubble still limit realism; a major collapse can legitimately bury the hall. A single left charge can create a much larger event than a single right charge. No civil-engineering, exhaustive collision-space, universal performance or owner visual acceptance is claimed.

The evidence-only ZIP contains this viewer, selected media, exact input/check records, the commission and manifest. It contains no application checkout, dependencies or duplicate ZIP. The application and these reproducible helpers are **repository-only** beneath this evidence directory: `reproduce.py`, `check-native.py`, `measure-timing.py`, `causal-check.mjs`, `prepare-media.py`, `package-review.py`, and `continuation.json`. Capture helpers reuse the established round-three recorder. Absolute execution paths printed in verification logs identify the test environment; they are not missing packet assets. [media-check.json](media-check.json) verifies that every input frame timestamp survived conversion and every portable movie decoded; raw recording intermediates are intentionally omitted. The manifest identifies every selected payload and hash. Archive integrity is separate from product acceptance.


Follow-up: [support, persistent wounds and performance review](followup/REVIEW.md). The original Round Seven packet is preserved; PR #6 remains draft and unmerged.
