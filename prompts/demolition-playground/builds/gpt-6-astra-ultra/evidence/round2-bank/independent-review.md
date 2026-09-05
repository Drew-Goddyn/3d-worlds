# Mercantile Bank final independent review

Commit **585c0b8** passes the scoped technical verification. **20/20 tests pass, zero skipped**, and the independent probe passes. No remaining implementation blocker was confirmed. This is an inspected candidate, not the owner's visual acceptance.

Baseline: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`. Working source/tests matched 585c0b8 exactly when checked, including this evidence-only refresh. The prior 20-test and independent-probe results remain applicable; no physics tests were rerun because implementation was unchanged. `independent-reviewed-source.sha256` records the reviewed source and test files. Review used the diff, commission, and operating contract without builder reasoning; the verifier changed no implementation.

## Technical proof

- `independent-suite-output.txt`: all 20 checks pass, including local versus opposite-corner failure, original neighboring-building behavior, six-charge protection, material/quality behavior, and restored future state. New normal-strength charges release at least 18 bays and settle over 1,000 pieces under varied frame intervals, with no moving pieces left. Original safeguards were preserved; only the old verification harness import mechanism changed.
- `independent-probe-output.txt`: exact future equality after mid-event restore with 7–56 ms input steps; immutable earlier snapshots; historical interpolation preserves resume state; a different past action creates a different future.
- Full diagnostic collapse: 27 failed bays, all 1,525 non-fixed pieces settled, all 1,537 fixture bodies retained, finite physical state, 5.48 m maximum rubble height. No sleeping fragment exceeded the solver's central-support surface by 0.3 m, including after three additional impacts. This is a check of the coarse solver's support convention, not exact collision certification.
- Rolling history retains 60.05 seconds; permanent pristine rebuild restores the entire captured state exactly after eviction.
- The previously found scoring defect is fixed: repeated hits used to increase 1,694.13 tonnes to 2,544.53. Identical repeated impacts now stay at 1,694.13, with scoring state preserved by history.
- Reviewed changes remain inside Astra. Other builds, original prompt/SPEC, showcase entries, vendor runtime, and history duration are unchanged. No external dependency or runtime service was introduced.

Standing invariants checked: finite retained architecture, immutable history ownership, complete deterministic restoration, retained replay versus new-action semantics, score conservation, support placement under the chosen collision approximation, surrounding-building regression protection, scope preservation, and unchanged test protections.

## Saved browser evidence independently inspected

The capture recipe uses actual mouse/button/range inputs for demolition and time controls; camera framing uses a diagnostic helper. `native-playthrough.json` records six charges, progression to 15/27 failed bays, 1,006 settled pieces, three exact recorded bank/charge comparisons, future truncation from 18.31 s to 5.28 s, and pristine rebuild. These are builder-run browser results corroborated through artifacts, not a second independently driven browser session.

Matched baseline/final images show the same district framing with changed bank architecture. The final ordered collapse sequence shows local ground-floor breakage followed by upper sections separating and settling around a surviving portion. Final rubble retains recognizable windows, slab pieces, and masonry; the final ball images show partial damage with much of the structure standing. No taste verdict is inferred.

Four final VP9 recordings are valid 1440×900 media: ball captures 5.76/5.85 s, charges 17.39 s, time controls 37.50 s. Refreshed metadata is saved in `independent-media-metadata.json`. Screenshot suffixes are target wait times, not exact timestamps: the nominal 0.4 s sample was read about 1.20 s after the pre-click timestamp. Use recorded times for precise chronology.

`extra-native-controls.json` additionally records different native ball outcomes (three versus two failed bays), the action-camera toggle enabled, and held crane controls changing cable length from 27 to 30.33 m and yaw from -2.72 to -2.96 radians. These support control activation and different hit outcomes; the toggle flag alone does not establish camera quality.

The refreshed `performance.py` closes and reopens the browser for each baseline/candidate run. The current `performance.json` supersedes the earlier reused-browser measurements. Each phase has 240 samples at 1440×900, DPR 1, Apple M2 Pro Metal renderer. Baseline mean intervals are 16.61/16.65/16.64 ms for pristine/bank/multi-building; candidate 16.62/16.66/16.67 ms. Baseline p95 is 17.2/17.3/17.4 ms; candidate 17.2/17.8/18.0 ms. Used heap samples are baseline 43.0/38.0/53.4 MB and candidate 37.8/82.1/101.4 MB. These runs have similar frame cadence but differing destruction outcomes; heap values remain single samples, not peak or sustained-memory measurements.

`charge-performance.json` adds a candidate-only close-camera six-charge event, explicitly associated with 585c0b8. Its 240-frame sample records mean 16.62 ms, p95 18.6 ms, maximum 19.8 ms, and 64.1 MB used heap. At sample completion, 15 bays had failed, 937 fragments had settled, and 69 still moved. This covers substantial collapse in progress; it is not comparable to the overview phases and does not prove a worst-case bound or the absolute first-blast peak.

## Limits and reproduction

No second browser session or independent performance run was performed. Movie metadata and an ordered image sequence do not certify subjective motion quality. Collision remains a central-footprint/AABB approximation. Performance now samples substantial six-charge collapse, but does not establish the absolute peak or a full minute of heap growth. No physical-simulation or player-taste acceptance is claimed.

```sh
npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test
node prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round2-bank/independent-probe.mjs
```
