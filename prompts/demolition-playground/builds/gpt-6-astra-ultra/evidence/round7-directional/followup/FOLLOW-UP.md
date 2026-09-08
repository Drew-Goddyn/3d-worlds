# Astra / PR #6 follow-up — let the bank hold, then let it fall

Repository: https://github.com/Drew-Goddyn/3d-worlds
Existing PR: https://github.com/Drew-Goddyn/3d-worlds/pull/6
Existing branch: `round7/astra-shape-the-fall`
Application: `prompts/demolition-playground/builds/gpt-6-astra-ultra/`
Last reviewed head: `bdfde0a8930a17e190e12e93c5481e97fea3b6a3`
Last recorded application/test result: `9b9a743e7c0fc536da1e94cec74801cba9348a7a`

Continue the existing PR through diagnosis, implementation, browser inspection, focused verification, and an updated evidence-only ZIP. This is a completion pass on Round Seven, not Round Eight. Do not create another branch or PR. Do not merge, mark ready for review, or deploy anything. Commit and push the scoped follow-up to the existing branch, leaving PR #6 draft and unmerged.

## The owner's judgment and the objective

The owner likes the new directional collapses overall. Front cuts carrying the arcade outward and side cuts turning the gallery while the roof yields are gains worth preserving. However:

> “It's generally pretty weak — large structural failures too easily, too easy to domino local failures — and a bit of floating pillars.”

Treat this as player feedback, not a proven diagnosis. We have not identified exact root causes or an exact reproduction for the floating pillars.

**Preserve the new ways the bank can fall, not how readily it starts falling.**

Make the bank a convincing structure to work on: cause meaningful local damage, inspect what remains standing, make another targeted intervention, and eventually cause a substantial directional failure. Where surviving construction can carry the load, partial damage should remain a useful state rather than a short delay before inevitable collapse. Where a critical support genuinely is lost, a large consequence is still legitimate.

The work has three priorities: correct disproportionate propagation, correct genuinely unsupported remnants, then reduce the active-collapse cost of the corrected behavior. Profiling may begin early, but do not optimize the current defects as though they were required behavior.

## Establish the actual starting point

Read applicable repository instructions. Check the working tree, the actual PR head and discussion, and the existing branch. Preserve unrelated work; do not reset, force-push, or overwrite another agent's changes. Verify the known references rather than assuming the PR has not advanced. If another checkout owns this branch, use it safely or report the concrete conflict; do not manufacture a new branch to bypass this instruction.

This follow-up supersedes the earlier task's checkpoint-merge and new-round instructions. Nothing in this task authorizes merging any PR. If PR #6 has already merged or the branch has unexpected work, report that mismatch rather than silently choosing a new workflow.

Read the concise Round Seven review and relevant construction/contact tests. Start with `src/bank-structure.js`, `src/bank-cohesion.js`, `src/bank-physics.js`, and their immediate construction/history dependencies. Do not reread the entire project history or archived verification reports.

From the repository root, verify the existing commands:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test
```

Default address: `http://127.0.0.1:4173`. Root-level npm tests are not the Astra suite.

Retain a reproducible baseline at the actual starting commit. Use a small family of native charge placements, including both lower front corners and at least one different structural location; compare limited damage, later damage, and substantial front/side failure. The previous record reports one front-left charge releasing ten bearing bays while the front-right example releases none. Verify and investigate that contrast rather than declaring either outcome automatically correct or requiring perfect symmetry.

## 1. Believable resistance and persistent partial damage

Find why small interventions too readily become large failures. Distinguish direct charge damage, legitimate transferred load, secondary physical contact, and unintended propagation or numerical instability. Use focused instrumentation where needed. Report the decisive cause or causes in plain language, with evidence; do not invent certainty when several factors contribute.

Correct the behavior at its cause. Adjusting strengths, capacities, compliance, or damage tuning is allowed when justified. Do not substitute an unexplained global strength multiplier, a weaker explosion, or extra charge requirements for understanding the problem. Keep the normal charge tool, six-charge budget, and established blast setting as the starting comparison. If a localized change to damage interpretation is necessary, disclose and demonstrate it rather than quietly retuning the whole tool.

A successful partial wound must remove or disturb meaningful architecture while allowing surviving construction to hold. Show it remaining stable for a useful observation interval — roughly 20–30 simulated seconds is sufficient for the selected checks — then receiving another deliberate cut that changes its fate. This checks persistence, not a prescribed waiting period or a general physical-stability certificate.

Do not achieve apparent stability by freezing damaged assemblies, resetting strain arbitrarily, disabling transferred load, adding invisible anchors, or imposing a scripted number of hits. Do not merely lengthen a countdown to the same inevitable collapse.

Preserve the class of behavior the owner liked: coherent front/side travel, roof response, and later interventions acting on altered construction. Exact old trajectories, failure thresholds, number of failed bays, and charge placements need not survive unchanged. Large collapses must remain attainable through ordinary play, not a hidden easy-collapse mode. Nearby variations in placement should not require exact choreography to produce sensible behavior.

## 2. No unsupported frozen architecture

Inspect standing and settled remnants from useful angles, including after pause, rewind, retained replay, and a second intervention. Identify whether an apparently floating pillar is:

- legitimately attached to surviving construction above or beside it;
- resting on a real current support;
- physically detached but incorrectly asleep or still owned by an obsolete carrier;
- visually misplaced relative to its actual simulation or interpolated state.

These are diagnostic possibilities, not an assumed root cause. A legitimate hanging element need not be forced to the ground, but its visible connection should make sense. Check the actual path of support, not only a cached state flag. A detached unsupported object must move, and a settled object must react when its current support is removed. An unsupported group must not hold itself up through circular support bookkeeping.

Repair the demonstrated cause. Do not delete floating pieces, hide them behind dust, add invisible supports, snap them to the ground for the camera, or trigger unrelated collapse to remove the symptom.

No precise owner reproduction is supplied. First attempt reproduction using the existing ordinary charge family and inspect the aftermath. If the particular reported pillar cannot be reproduced, state that honestly, retain the coverage you achieved, and continue with the other work. Do not claim that passing a synthetic test proves the observed symptom is fixed.

## 3. Recover performance without erasing the improvement

The reviewed head reported early active-collapse mean frames of 87.30 ms versus 22.73 ms at its preceding checkpoint, with substantial simulation-time loss. Those are prior measurements, not a required result on your machine or a proven cause.

Profile representative substantial demolition to identify the dominant costs. Choose changes from actual measurements rather than assuming the bottleneck is the constraint solver, collision checks, rendering, history, or allocation. Bank-local refactoring and necessary integration changes are permitted; this is not a renderer migration, a new physics-platform project, or an excuse to revert to the old disconnected fall.

Retain a pre-optimization reference or timing trace for the corrected behavior. Separate two possible improvements in the report:

1. Local damage now causes less unintended destruction and therefore less work.
2. A comparable substantial collapse executes more efficiently.

The first is valuable, but it is not proof of the second. Use comparable native inputs and disclose differing workloads, active construction, and failed/settled counts. When useful, use a small fixed-step diagnostic to compare equivalent simulation progress; do not present it as live browser performance.

Measure without recording or concurrent project tests/encoding, and capture media separately. Include active and settled frame intervals, tail stalls, and simulation advancement versus elapsed wall time. Keep settings and environment comparable. Repeat briefly where necessary to separate a real gain from noise; no extended benchmarking campaign is needed.

Do not manufacture a speedup by removing meaningful construction, turning off relevant contacts, shortening the rolling minute, concealing dropped time, changing playback speed, or reducing solver accuracy without checking the resulting behavior. Internal representations and algorithms may change. Exact cross-version numerical equality is not required; valid restoration within the new implementation and the visible capabilities are.

If a substantial speed improvement cannot be achieved within this scope, report the measured result and specific remaining obstacle. Do not promise that optimization later will necessarily be easy. Leave the PR unmerged.

## Protect the complete experience

Keep the existing bank/court/hall identity, the compact district, normal charge interaction, directional failure, effects, and meaningful retained rubble. Do not add furnishings, expand the environment, redesign the crane, or turn this into another sound or material-fracture commission. Existing method freedom remains available for necessary repairs; no mandatory new tool or library is required.

Preserve accurate event restoration, immutable snapshots, valid continued simulation after restore, retained-future replay, alternate futures after a past action, the rolling minute, and permanent pristine rebuild. Include any new sleep, support, or cached state needed for correct restoration; derived caches must rebuild correctly. Restore in a fresh simulation instance where the existing test facilities support it.

Use the existing suite and add focused regressions for the defects actually found. Adapt implementation-specific assertions where necessary while retaining the underlying safeguard. Do not freeze an excessive failure count or the old trajectory into a test merely because it previously passed; equally, do not remove a protection to make the suite green. Explain substantive assertion changes.

A lightweight unobstructed inspection view is allowed, using the actual bank. Distinguish visual hiding from physical isolation. Final evidence must include ordinary district play, with real charge inputs and no demonstration-only behavior. A legitimate major collapse may bury the hall.

## Deliver a small, decisive review packet

Use the current capture helpers and viewer. No new review framework, recursive audits, or expanded artistic-critic loop. Builder inspection and focused technical verification are required; reuse independent verification if readily available without making another campaign of it.

Keep the original Round Seven evidence intact. Save follow-up material under `evidence/round7-directional/followup/`, with a short pointer from the existing review note. Include:

- A small matched before/after example of disproportionate propagation, plus a different local placement. In the corrected version show a genuinely damaged standing state, an observation interval, and a later cut that changes it.
- Before/after support-defect evidence from a revealing angle when reproduced, identifying the relevant remnant and explaining what supported it or failed to release it.
- A representative substantial collapse showing that directional behavior remains, with a short normal-speed recording and concise unrecorded timing results. Do not trim away stalls. A few timestamped frames can supplement, not replace, the recording.
- Brief exact commit/input references, causes found, changes made, tests actually run, comparison limitations, and remaining disappointments. Record session settings only if verified; do not infer them from the directory name.

Multiple checks can share a short recording. Use existing time labels and notes to distinguish a stable observation interval from edited waiting or runtime lag. No need to package every diagnostic dump or repeat the entire historical evidence archive. Audio is secondary; do not create an audio-review requirement.

Produce a new evidence-only `bank-direction-round7-followup-review.zip` without overwriting the earlier ZIP. Include selected media, the existing lightweight viewer if useful, and concise notes — no application checkout, dependencies, or duplicate ZIP committed alongside its contents. Confirm the selected files and viewer references work, without creating an audit project.

Commit and push only the follow-up on `round7/astra-shape-the-fall`. Update PR #6's description with the current result and remaining limitations, and leave it draft/unmerged. Finish with the PR link, result commit, launch command, a few revealing ordinary inputs, exact local ZIP path, and an honest account of the gains.

**Success means the new directional collapse remains worth watching, the bank has convincing damaged-but-standing states, unsupported remnants do not persist through bookkeeping errors, and the active event is measurably more usable — not merely stronger, less destructible, or accompanied by more passing tests.**
