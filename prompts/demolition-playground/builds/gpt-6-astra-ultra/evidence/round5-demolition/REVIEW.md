# Mercantile Bank: connected demolition

The bank now falls in recognizable sections: cutting its bearings tips the arcade and gallery, then contact and later charges break the moving construction into retained rubble. The clearest gain is the descent at ordinary building scale. Small wounds remain useful; the settled ruin still has overly regular masonry bands. This is a completed review candidate, not owner acceptance of the creative result.

## Checkpoint and source

PR #3 was checked at its exact reviewed head, `58ed7ec6915bd81f4111346a5dcf8c439d13a256`, with no review discussion or required checks reported and 36/36 current tests passing independently. It was merged under this commission's explicit authorization. Main/baseline is `cdeeb901cfe50361dc5bfcf63b48e3e0e8399e1f`. Baseline films were captured at the reviewed head; the merge contains that same application.

Final implementation: **`8535020890ad135f85fec68cebc009ddd89b1d54`** on `round5/astra-demolition-leap`. All `final-*` media and final technical verification use this source. Later commits only package evidence and update continuation documentation. The new PR remains unmerged; no deployment. Session model/reasoning settings were not independently verified. The inherited directory name records the original attempt, not this continuation's settings.

## Launch and explore

From the repository root:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
```

Open <http://127.0.0.1:4173>. Choose **Charges** and place one low on a front corner. Rebuild, then place three across the front ground floor and three along the right side; detonate. Watch the windows, roof and floor edges as their supports fail. Try the glazed roof followed by an upper side pier, rewind before the second action, and choose another location. Rebuild restores the pristine district even after damage leaves the rolling minute.

Extract the evidence ZIP and open `viewer.html` for the paired normal-speed films, roof/gallery progression, and rewind/branch/rebuild recording. Videos contain the canvas; accompanying stills include controls. The viewer starts both films together, without claiming exact frame synchronization.

## What changed and why

The former collapse quickly separated architecture into individual pieces. A finite graph derived from the actual solid construction now carries connected sections, pivots around surviving bearings, and fractures at impacts or subsequent damage. Section-to-rubble contacts exchange motion in both directions. Each piece has one motion owner and one settlement score. Snapshots include section membership, momentum and support pivots, allowing continued simulation after restoration.

The existing local Three.js **0.180.0** and bank solver were retained after a focused actual-bank feasibility check established connected movement, exact restored continuation, bounded section state and an integration path. The final isolated diagnostic retained every body and replayed exactly; its CPU timings include concurrent work and are not browser performance. The tradeoff is approximate contacts and prepared member boundaries rather than arbitrary cracking. Blender **5.1.2** was accessible but unused. No dependencies, external assets, hosted services or asset preparation steps were added. The existing bank, court and hall construction recipes remain the editable source. The continuation permits other tools/assets; it does not rewrite earlier constraints or provenance.

## Evidence and checks

- **Independent technical verification:** 43/43 tests, zero failures/skips, plus preserved contact regressions and exact original/alternate futures in fresh simulation instances. The verifier used clean detached source and criteria, without builder reasoning. It first found pieces passing through sections and wide edges missing contacts; a subsequent repair exposed reverse-contact, settlement and table-contact regressions. All were fixed without relaxing existing assertions. Selected before/after proof and the final report are in `verification/` in the repository.
- **Native integrated play:** matched left, right and six-charge cuts; roof then gallery; three exact timeline scrubs; slow replay, rewind, a new action in the past, and exact pristine rebuild. History retained 60.0475 seconds across 1,202 samples after its initial state was evicted. Both repeated large events settled with all **1,865** bank bodies retained. The isolated Node bank has 1,864 because the browser adds the inscription. Neighbor charges, ball impact, orbit/zoom and quality controls worked; collected console/errors were empty. `native-summary.json` contains selected measurements.
- **Local performance:** Apple M2 Pro, 32 GB, macOS 14.5, headless Chrome 152 with Metal, 1440×900/DPR 1. A 240-frame active-collapse sample averaged **21.86 ms**, p95 **70.30 ms**, max **88.90 ms**. Intact/settled samples averaged about 16.66 ms. Collapse has visible-cost spikes; these are neither universal performance guarantees nor strict capture-continuity certification. Matched films were recorded while other verification work ran. The final large-collapse clip contains 247 frames over 10.56 seconds (about 23.4 encoded frames/s against a 30 fps request); sparse capture during its busiest motion is a review limitation.
- **One anonymous media review:** alpha was the complete earlier candidate `bafd8e32cbe41528aec57d358af9432faf4092bb`; beta was the checkpoint. The reviewer narrowly preferred alpha's connected descent and preferred beta's more irregular aftermath. Its one suggestion prompted localized impact shock so the rest of a section keeps momentum. Final media were refreshed after that correction and technical fixes; no second artistic review was commissioned. The review used stills and dense extracted frames, not continuous video viewing. Final self-inspection likewise does not certify every transition or input feel. `paired-review.md` preserves the original critique.

## Reproduction and limits

The matching camera is `[16,20,47]` looking at `[-11,6.8,14]`; alternate ruin views use `[-16,24,53]`. Inputs, accepted charge attachments and detonation offsets are retained in the two `*-inputs.json` files. Identical target positions and camera were used, with small native tool timing differences; outcomes are not forced to match. Neither bank nor physical neighbors were hidden/removed in the final films. Dense strips sample 1.6–4.6 seconds at 0.2-second intervals and supplement the full recordings.

Run `npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test` for the suite. Repository evidence contains `reproduce.py` and `inspect-controls.py`, which reuse the existing native capture helper and local agent-browser session. Launch the server first, set that session to 1440×900, then run reproduction followed immediately by controls with the same output directory and `final` prefix. Scripts are excluded from the evidence-only ZIP.

My judgment: this makes the bank's falling architecture substantially more legible and gives subsequent cuts coherent construction to act on. The familiar single-charge response and orderly aftermath limit the overall leap. Contacts remain coarse, large rubble can bury the hall, and no exhaustive collision-space or human taste acceptance is claimed. The exact commission remains in `FOLLOW-UP.md`; the archive manifest identifies its selected media and hashes.
