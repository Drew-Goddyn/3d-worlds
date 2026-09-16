# Final review: three-round demolition-playground experiment

## Decision

Freeze build 03 as the final comparison artifact. The experiment has reached its agreed stopping point: three implementation assignments and their reviews. No fourth assignment is recommended or prepared.

The result is a functioning, procedurally detailed, reversible demolition toy with substantive improvements to temporal presentation, physical ownership, contact, settling, and resource use. It is not full delivery of the original maximum-ambition visual and physical brief. The central distinction is **experiment completed; product brief only partially fulfilled**.

This is an assessment of the uploaded frozen source and evidence, not an assertion that the local worktree or a remote repository has been frozen by a Git operation. No repository writes or publication actions were performed by the review partner.

## Frozen identity

- Repository named by the user: `Drew-Goddyn/blind-3d-world-astra-build-loop`.
- Builder-reported branch and baseline: `main`, `186001a2f22b98f3c127a535f742e1eca1935343`.
- Builder-reported publication state: implementation uncommitted; no push, pull request, deployment, or publication.
- ZIP size: 64,303,553 bytes, approximately 61.3 MiB.
- ZIP SHA-256: `0b5a4c310e89d70a6fc47c61fb846d0d0adb517aee25c028fc9734d8504f9e01`.
- Complete source-manifest SHA-256: `ba7b31d92c2fb163ddb564d989fb1668b5ef289b5026f80707adf16868d5ed7f`.
- Runtime source SHA-256: `1c7af145f00ccad9359d1c8d8f389fa021431de4b79f77137d09f727549eb2c4`.

The reviewer independently verified ZIP CRC, the ZIP hash, all 52 source-manifest entries, and application of the supplied patch to a separate extraction of build 02. Every resulting source hash matched build 03. The locally available earlier ZIPs also matched their preserved hashes. Source hashes were checked again after review execution and still matched.

The current remote head and the builder's local worktree were not independently inspected in this final review. The independently identified deliverable is the ZIP.

## Evidence attribution and review limits

### Independently executed

The reviewer ran the three dependency-free original test files: 39 tests passed, none failed. Seven additional original contact/history cases were run with only import and fixture paths relocated; their test bodies and assertions were unchanged. All seven passed. This gives **46 independently rerun test cases**, not an independent rerun of the complete 47-case npm suite.

The one remaining original case imports Three.js to compare the custom oriented-box contact routine with Three's independent geometry implementation. `npm ci` failed with `EAI_AGAIN` while resolving the dependency registry, so that original case could not be run in this environment. The builder's complete 47/47 result remains packaged evidence. The supplied static check passed independently.

Additional independent work included the temporal diagnostic, action-only collapse/settling diagnostic, replay of the old and new tank control sequences, and a separate Python/SciPy geometric check of their endpoints. The Python check does not call the application's contact routine.

The reviewer inspected all ten final stills, representative decoded frames spanning each recording, relevant changed execution paths, the history representation, the new support/contact implementation, the adjusted velocity fixture, and the packaged measurements. All three complete video files decoded successfully. The recordings are 1440 x 900 H.264 at 30 fps, with durations approximately 35.23, 35.67, and 24.63 seconds.

### Builder evidence inspected, not independently repeated

The full Three-backed interval exclusion checks, live browser controls, final browser renderer-input comparisons, comparable M2 Pro frame measurements, and the precise 91-second comparative payload measurement were inspected in the archive rather than rerun on the same hardware.

The independently rerun original history test does cover 91 simulation seconds, early and later destruction, repeated exact-state restoration, and an animated reset through the complete retained run. Its destruction schedule is not the exact four-stage browser comparison workload, so it must not be substituted for the reported 442.5 MiB figure.

There was no independent GPU browser session or full normal-speed viewing of every recording. Decoding and sampled-frame review establish less than a complete interaction/playback watch. Subjective satisfaction and physical-display smoothness remain matters for human judgment.

## Findings closed by the final round

### Temporal presentation and transport

The temporal diagnostic now gives 120 presentation changes over 120 samples for ordinary 10% speed, hold-to-slow, held crane rotation, passive crane replay, and passive ball replay. The corresponding physical state changes 12 times. This is the intended distinction: authoritative fixed simulation steps can remain coarse while presentation moves between them.

Both input-sparse and input-dense recordings reverse approximately 1.0 simulation second over 0.5 represented wall seconds. Their record counts differ, but transport no longer depends on record density.

Source review confirms that the renderer consumes sampled presentation state. Continuous transforms are treated separately from identity, lifetime, fracture, visibility, and score transitions. Exact recorded moments remain authoritative. An accepted action from a fractional historical view resumes from the preceding physical record, at most 1/60 simulation second earlier; this is the disclosed implementation convention, not arbitrary-precision intervention at every possible timestamp.

The independently rerun tests preserve rejected-input behavior, passive future replay, replacement futures, ordered same-time input, pool reuse, and score restoration.

Evidence: `inspection/reviewer-temporal-regressions.json`, the test outputs, `source/src/presentation.js`, and `source/src/world.js` History/Playback.

### Tank intersection

The same accepted control sequence was independently replayed on build 02 and build 03. Python/SciPy intrinsic XYZ transformations were used to move the original 6,305 shell samples into each floor's local coordinates.

| Endpoint | Intersecting shell samples | Result |
|---|---:|---|
| Build 02, original failing sequence | 268 / 6,305 | Floor 199 intersects the shell |
| Build 03, identical sequence | 0 / 6,305 | Original endpoint defect no longer reproduced |
| Build 03, final tank recording's accepted controls | 0 / 6,305 | Delivered endpoint is also clear |

The final recording replay's tank state differs from the recorded tank state by at most approximately 3.1e-13 in this review environment. This supports reproducibility to numerical precision; it is not a claim of cross-engine bitwise equality.

The builder's stronger interval evidence reports zero inset-envelope overlap frames across 5,344 steps for the original and nearby cases and another 1,569 steps for the final recording. Those full interval geometry checks were inspected, not independently rerun here. The independent endpoint check does not establish universal contact correctness.

The source repair is physical: shared rotated bounds and contact separation replace the center-only support search. Rendering does not independently lift the tank. Tipping, rupture, discharge, support loss, and surviving wreckage are preserved.

Evidence: `inspection/reviewer-contact-endpoints.json`, `inspection/reviewer-replay.mjs`, `source/src/contact.js`, `source/src/world.js:162-202`, and the packaged tank diagnostics and media.

### Valid support, full collapse, and settling

The action-only diagnostic confirms the earlier elevated remnant has three healthy middle foundations. After six outer foundations are destroyed, 33 tower bays remain standing and 66 are moving. Preserving that modeled support was the correct response; an unconditional full-collapse trigger would have weakened causality.

Removing the three remaining foundations produces 99 resting tower bays, zero standing or moving tower bays, and a highest bay-center height of about 6.48 world units. The tower's full numeric state is unchanged between 30 and 40 seconds. The same diagnostic records 28 neighboring hotel-bay failures from the physical consequences of the collapse.

The regression based on the recorded player inputs also passes its 30-to-40-second stability assertion. The final still and sequence show the tower reduced to a rubble pile with visible neighboring damage.

Source review supports the reported mechanisms: detached columns release their former constraints, and resting slabs require a support path to standing structure or the ground. Contact cycles alone no longer qualify as rooted support. This is a useful shared physical contract rather than a renderer workaround.

These results establish the deliberate full-collapse case. They do not establish that every possible destruction state settles, that every moving pair is collision-resolved, or that the tower behaves as one convincing rigid leaning assembly before breakup.

Evidence: `inspection/reviewer-collapse-support.json`, `inspection/reviewer-contact-history-7.txt`, `source/src/world.js:203-215,297-310`, and `captures/05-complete-tower-rubble.png`.

## Runtime and memory comparison

These are builder measurements from the packaged same-environment browser comparison: Apple M2 Pro, 32 GiB RAM, hardware-accelerated Metal, headless Chrome 149, 1440 x 900 viewport, DPR 1, High quality. The reviewer did not independently repeat the hardware benchmark.

| Build | Payload at 91 simulation seconds | Collapse p95 frame interval | Worst sampled collapse interval |
|---|---:|---:|---:|
| 01 | 262.3 MiB | 16.7 ms | 29.4 ms |
| 02 | 603.3 MiB | 25.0 ms | 50.0 ms |
| 03 | 442.5 MiB | 16.7 ms | 25.0 ms |

Build 03 retains 463,948,380 payload bytes, a 26.7% reduction from build 02's 632,574,464 bytes. All 5,483 records remain. On that same input schedule the reported simulated tonnage increases from 912 to 2,608 and fragment identities from 5,073 to 7,586. The improvement therefore was not obtained simply by avoiding the intended destruction, although changed physics means the resulting workloads are not identical.

The source representation explains a concrete saving: per-changed-field deltas use a 4-byte index plus 8 bytes of reversible XOR data rather than a 4-byte index plus two 8-byte values. Checkpoints and state restoration remain in place. The corresponding bit-preservation regression passes, including signed zero and extreme finite Float64 values.

Frame intervals are requestAnimationFrame samples, not a universal guarantee about physical-display presentation. The collapse sample contains 710 frames. Long retention was accelerated separately and does not establish long-session real-time performance. Video capture used a frame-limiter workaround; performance sampling did not. The reported 1,250 moving-pose comparisons in the slow-motion take are capture-session samples, not a 60 Hz hardware benchmark or 1,250 encoded video frames.

The final payload is still substantial and excludes JavaScript object/array overhead, event traces, renderer memory, and temporary allocations. History grows without eviction. Ninety-one simulation seconds is the longest documented tested duration. The separate comparison workload still contains 30 moving bays at its endpoint. Complete run restoration is supported over the tested interval, not unlimited practical playtime.

Evidence: `checks/performance-retention.json`, `checks/comparison.json`, the profile reports, and `source/src/world.js:450-489`.

## Assessment against the original experience

The evidence supports the core toy: a bright procedural district; immediately available ball and charge controls; support-dependent damage and neighbor consequences; differentiated architectural debris; a tank that ruptures and remains in the wreckage; persistent rubble; smooth temporal inspection; and recorded restoration rather than an invented rebuilding animation.

The original experience remains only partially fulfilled. The final imagery reads as a compact stylized diorama, not the overwhelming richness of a dense, individually considered downtown. Large rectangular floor plates and grouped architectural strips dominate the destruction. Whole-tower leaning, rich steel deformation, concrete crumbling with exposed rebar, glittering material-specific fracture, and rolling volumetric street dust do not reach the original description. Crowd and pigeon activity are implemented simply and are not a dominant, richly demonstrated part of the final media.

The tank is now meaningful persistent wreckage, but remains one coarse shell/roof body with particle water. Conservative contact envelopes can produce gaps, grouped debris can overlap, and general moving-debris pair contact is incomplete. These are material compromises to the original promise, not invisible implementation details.

The appropriate conclusion is **stronger functional and verification quality than the initial attempt, with a persistent gap to the visual/physical ceiling of the brief**. Passing the checks does not convert the result into full compliance, and the final freeze does not lower the original criteria retroactively.

## What this says about the workflow comparison

This run used the original prompt, six agreed clarifications, one substantive clarification round, and three build-and-review assignments. Each assignment allowed implementation, testing, and self-correction; the builder also reports internal independent reviews. Three rounds therefore does not mean three model calls or a fixed amount of compute.

The most demonstrable gains are repairs to specific observable failures: low-cadence slow motion, record-density-dependent rewind, facade/tank physical continuity, intersection, support anchoring, and settling. The third round also recovered much of the resource regression introduced by the second. The visual transformation is less complete than the behavioral one.

This supports a comparison of a **bounded, skills-assisted workflow** with the user's one-shot workflow. It does not isolate the causal contribution of a particular skill from extra compute, clarifications, review evidence, or additional implementation time. Exact builder model/effort settings and total model-call or token cost were not independently established. No cross-model ranking is inferred from this run.

Suggested comparison description:

> Three-round skills-assisted build with one clarification round and six agreed interpretations. The final procedural demolition playground has tested reversible state, smooth time inspection, causal support failure, and a demonstrated full tower collapse. The result remains stylized, uses coarse contacts and material effects, and retains a substantial growing history payload. It is not a one-shot result or full fulfillment of the original maximum-ambition brief.

## Completion and publication

The final build is ready to serve as this experiment's frozen comparison artifact. Human aesthetic acceptance and any later publishing decision remain separate. The builder reports no commits, pushes, or deployment. The review partner did not alter the builder's repository or publish anything.

Keep the three archived rounds and identify this final result by its ZIP hash. Remaining limitations belong in the comparison record; they are not an automatic fourth round.
