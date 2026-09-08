# Astra loose-piece follow-up — unfinished, do not merge

The bank still produces physically invalid rubble. The rising-window defect was traced to false landing surfaces and forced rotation, but the replacement contact handling is not acceptable: solid pieces can pass through each other and remain stopped in the same space. PR #6 stays draft and unmerged. This packet records a rejected repair, not completion of the commission.

Open [viewer.html](viewer.html) for the matched corner recordings and current front/side examples. All video frames retain their captured wall-time timestamps, including long stalls. Starting the comparison together does not align simulation progress. Audio is muted. The full district and ordinary charge tool are present.

## Exact sources and decisive evidence

- Starting candidate: `98633bf46e4e5c2ebd8a2ee02ad979bd9eb815fa`.
- Current rejected runtime: `24055bb553c792d97ec4f9eb592aa06becc7f352`. Later commits in this handoff contain evidence only.
- Same branch: `round7/astra-shape-the-fall`; [existing draft PR #6](https://github.com/Drew-Goddyn/3d-worlds/pull/6).
- Independent focused checks: **18 passed**, but two additional fast diagonal contact probes **failed**. Their trajectories cross actual solid volume without transferring a contact impulse. [Verdict](independent-review.json), [passing test log](current-focused.log), [failing probes](current-diagonal-failures.json).
- Native three-charge side collapse: two stopped column cores remain intersecting at identical poses for 0.9333 simulated seconds. Their common interior contains a sphere of radius **0.15656 m**; separating them requires **0.40727 m** of translation. This is solid material occupying the same space, not merely overlapping bounding boxes. [Independent geometry proof](current-native-penetration.json).
- The current full suite was **not completed**. An earlier repair at `5d52e88` had 65 passes, one settlement failure and one cancelled test file; another at `a4fc466` failed the unchanged six-charge settlement check with 192 loose pieces where zero are required. Version-labelled records remain in the repository; neither is a current full-suite result.

## What was wrong and what changed

The old landing check used enclosing boxes around tilted pieces as if their tops were real flat platforms. It also allowed a piece to land on a surface slightly above its previous foot, repeatedly lifting it. A separate rule drove glass, joinery and tall rubble toward a chosen angle without checking balance. Some off-centre pieces rotated around their construction origin instead of their centre of mass.

The draft now uses the rendered surfaces, accounts for centre of mass and balance, rejects upward landing steps, follows current rooted support, and checks contact with moving loose pieces. Derived geometry caches preserve exact poses and reduce repeated work. These changes address demonstrated causes; they do not establish that the resulting rubble is physically valid. Side-by-side footage shows the difference without claiming a successful repair.

The remaining gap is broader than a sleep flag: contact between moving solids can be missed when they cross several axes within one step. Dense rubble can also finish interpenetrating. A broader continuous-contact experiment caught additional crossings but failed four of seven selected physical regressions, including tipping and column contact. It was saved as a repository-only patch and is **not applied**. [Experiment result](continuous-experiment.json), [failed test log](continuous-experiment-selected.log).

The normal six-charge limit and blast setting were not reduced. No pieces were deleted or hidden to make the aftermath look clean. A substantive test fixture correction gives a pane two narrow off-centre supports so it is balanced; removing both still checks that it wakes and drops. A separate lone-support case checks tipping. No failing gate was loosened to obtain a pass.

## Ordinary inputs and inspection limits

From the repository root:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
```

Open `http://127.0.0.1:4173`. Select Charges. Aim low on the front-left corner and detonate one charge. For larger events, rebuild, then place three low charges across the front arcade; rebuild again and place three along the right-hand side. The captured camera is at `[16,20,47]`, looking at `[-11,6.8,14]`.

Exact requested targets are front-left `[-15.7,1.3,19.65]`; front-centre `[-11,1.3,19.65]`; front-right `[-6.3,1.3,19.65]`; side `[-4.8,1.3,10]`, `[-4.8,1.3,14]`, `[-4.8,1.3,17.8]`. Actual pointer-accepted body/local anchors are in [before-recordings.json](before-recordings.json), [current-recordings.json](current-recordings.json) and [current-native-inspection.json](current-native-inspection.json). Requested points and actual surface hits are distinct.

The current long side inspection waited 25.5668 simulated seconds after detonation; 651.4 wall seconds elapsed under heavy machine load. At that observation, 9 bays had failed, 264 pieces were loose and 552 were marked settled. Retained replay and native pristine rebuild were exercised; rebuild returned zero failed bays, zero loose pieces and zero settled pieces. This is a limited builder check, not full history acceptance. [Synthetic fresh-instance restoration](current-restoration.json) passed independently.

The current corner and directional videos show only early simulated progress because the collapse runs slowly. They do not prove persistent partial stability, a later-cut result, or complete directional aftermath. Those requirements remain open on this source. Earlier candidate inspections are not substituted as current acceptance.

## Performance remains unacceptable

The current recordings visibly stall. Their wall-time traces are capture evidence, not clean performance benchmarks. No accepted current-head active-and-settled comparison exists.

Earlier unrecorded profiling found contact-surface intersection and support searches dominated CPU work. On rejected earlier geometry implementations, caching and planar-face merging reduced sampled early mean frames from about 214.7 ms to 158.8 ms; later busy frames remained about 438 ms. Workloads and simulation advancement differed, and eight unrelated verification workers were active. The subsequent height-grid sample did not show a clear additional gain. These are historical measurements only, not a speedup claim for the current source. [Labelled timing research](measurements.json).

## Resume and verification

The next proposed repair is a coherent bank-local contact solver that prevents swept crossings, resolves existing penetration, and settles balanced rubble while allowing unbalanced pieces to tip. It must retain the owner's directional construction behavior. There is no promise that this is a small or fast fix.

After repair, run the unchanged whole suite and fresh independent native verification, including long partial wounds, later interventions, support removal, retained replay, alternate futures, the rolling minute and pristine rebuild. Then measure comparable active and settled intervals without recording or project tests:

```sh
npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test
```

Implementation stopped after repeated failed contact approaches under the operating instruction to surface that obstacle. This handoff does not waive any acceptance criterion.

Repository-only material, deliberately excluded from this evidence-only ZIP, lives under `prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round7-directional/followup/settlement/`: `continuation.json`, `continuous-contact-experiment.patch`, the independent reproduction scripts, `inspect-native.py`, historical rejection logs and `prepare-media.py`. The full application and dependencies are also excluded. Large raw native snapshots remain outside the packet; the portable penetration proof includes exact poses, geometry margins and their hashes. The independent verdict explicitly labels other excluded raw artifacts.

The original Round Seven ZIP and previous follow-up ZIP remain unchanged. [media-check.json](media-check.json) records frame/timestamp preservation and hashes; the manifest covers all selected payloads. Archive integrity is separate from product acceptance.
