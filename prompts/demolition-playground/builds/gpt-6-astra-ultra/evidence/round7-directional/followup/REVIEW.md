> Superseded by the [unfinished loose-piece repair review](settlement/REVIEW.md). The current draft still has invalid solid contact; earlier passing results below are historical and do not establish current acceptance.

# Mercantile Bank — support and performance follow-up

The bank keeps the directional front and side collapses, while local wounds can remain useful standing states. Falling construction now damages the member it actually strikes; surviving supports decide whether a larger failure follows. This is a draft candidate for owner review, not an engineering certification or visual acceptance.

Open [viewer.html](viewer.html). All selected films preserve their captured wall-time frames and timestamps, including stalls. Ordinary district play is distinguished from the separate bank-only support diagnostic.

## Exact result and inputs

Starting PR #6 head: `bdfde0a8930a17e190e12e93c5481e97fea3b6a3`. Final application: `a1c75deba4e1e07361f92807badc515f8e20a571`; the subsequent test-only commit `02e3fb2` changes the street-level tool-test demolition setup, with identical application sources. Branch: `round7/astra-shape-the-fall`; PR #6 remains draft/unmerged. No new dependency, branch, PR, merge, ready transition or deployment.

From the repository root:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test
```

Open http://127.0.0.1:4173. Select charges and place one low on either front corner, or one midway along the right side; inspect the remaining bank, then add a deliberate cut. Three low charges across the front carry the arcade outward. Three along the right side turn the wing while the roof yields. Front plus side uses the ordinary six-charge budget.

Exact requested world points, using camera `(16,20,47)` aimed at `(-11,6.8,14)`:

| Route | Points (x, y, z) |
|---|---|
| Left / right | `(-15.7,1.3,19.65)` / `(-6.3,1.3,19.65)` |
| Front | Left, `(-11,1.3,19.65)`, right |
| Side | `(-4.8,1.3,10)`, `(-4.8,1.3,14)`, `(-4.8,1.3,17.8)` |
| Single side | `(-4.8,1.3,14)` |

Native evidence uses real pointer inputs in the ordinary district, high quality, 1440×900, DPR 1, muted. Accepted anchors and frame/simulation times are in [native-recordings.json](native-recordings.json). The left ray hits glass deeper in the facade; the right ray hits a projecting column. That real geometry difference contributes to asymmetric wounds; matching projected points does not imply mirrored blast origins.

## What was wrong and what changed

A falling bay could fracture an entire healthy receiving bay when an impulse exceeded a threshold based on one small contacted piece. In the recorded bank-only trace, a roof fragment triggered this despite intact piers and less than a millimeter of receiver translation. The repair preserves transferred momentum and applies damage locally. Joint rupture remains real, but a broken lateral connection no longer arbitrarily crushes a bearing piece. Charge power 118, blast radius 3.9 and six charges are unchanged. See [causes.json](causes.json).

Standing pieces could borrow support merely by belonging to the same carrier, even after their physical connections disappeared. Current solid connections now determine which islands remain attached; detached islands release with carrier momentum. Resting rubble needs a path to ground or standing construction, so a mutually supporting cycle cannot freeze in midair.

Independent verification then caught a loose glass fragment that never settled. A narrow roof seam supported the pane physically, but a center-only contact test repeatedly rejected it. Landing and continued support now use overlapping solid parts. This also removes empty window-frame envelopes as resting platforms. The original failing suite log is retained in [suite-before-contact-repair.log](suite-before-contact-repair.log), with a step trace in [contact-before.jsonl](contact-before.jsonl).

Inspection also exposed a pause-button press being lost when its SVG was replaced during the press. The icon now changes only when its meaning changes. Native held presses, transport, alternate futures and rebuild are checked in [controls.json](controls.json).

## What the evidence does and does not show

The selected wounded states are inspected at roughly 5, 15 and 25 simulated seconds, then after retained replay and a later ordinary charge. These are paused observation samples, not a sped-up waiting film. The left and right wounds held the same failed-section counts from the early to final sample; later charges increased damage. The single side cut continued from three to six failed sections between roughly 6 and 16 seconds, then held through 26 seconds. That delayed local progression remains in the evidence. Exact times and later changes are in [inspections.json](inspections.json). Front, side and six-charge films retain the actual district and effects; substantial ruins can bury the hall. A low left cut can still take much of one wing when it removes critical supports.

The bank-only fixed-step side route reproduced four frozen court piers without a current solid path to ground at the starting head. The corrected diagnostic finds none. It retains more construction, so the before/after image alone does not establish that those same four piers fell; the disconnection regression proves release after their actual links are removed. Ordinary native side runs did not reproduce that exact defect. An independent trace of two other settled piers was inconclusive because they also touched rooted rubble off-center. The owner's specific observed instance remains unidentified. See [support-evidence.json](support-evidence.json) and [independent-review.md](independent-review.md).

## Performance of corrected behavior

Profiling first identified repeated bank bounds, structural contacts and support checks as major costs. Geometry now caches only an exact current pose; carrier corrections invalidate it immediately. Contact section membership is reused and rebuilt after fracture. The final support repair added accurate solid-part contacts, then a height index eliminated searches through irrelevant surfaces. No contacts, construction, solver steps, rendering quality or history duration were removed.

The final matched pair uses the fully corrected contact implementation before the height index (`2a8f4ae`) and after it (`a1c75de`). Both observed 16 unrelated verification workers; no Astra tests, recording or encoding ran during either measurement. Inputs/settings match but variable frame intervals produce different ruins, so these are workload-disclosed live measurements, not exact cross-version physics comparisons.

| 24-second native run | Before height index | Final |
|---|---:|---:|
| Busy mean, wall seconds 0.5–6 | 140.78 ms | 73.33 ms |
| Busy p95 / worst frame | 183.4 / 183.4 ms | 116.7 / 150.1 ms |
| Late mean, wall seconds 18–24 | 173.52 ms | 26.09 ms |
| Late p95 / worst frame | 183.4 / 183.5 ms | 33.4 / 33.4 ms |
| Simulated time advanced | 9.260 s | 22.532 s |
| Failed bays / settled pieces / loose | 15 / 1280 / 0 | 18 / 1291 / 0 |

The busy mean improved 48% despite more architecture falling in the final run. Active stalls remain visible; this is not 60-fps demolition. The earlier clean 64→42 ms pair belongs to a superseded contact implementation, not the final head. All runs, differing counts and external-process observations remain in [measurements.json](measurements.json). The bank-only 900-step diagnostic used 44% less CPU over the first five simulated seconds (27.49→15.28 CPU seconds), then about 77% less in the settled interval (23.57→5.48 CPU seconds per five simulated seconds). Both ended at 21 failed bays, 1441 settled pieces and zero loose pieces. At five seconds, 167 versus 171 pieces remained loose. Saved snapshot hashes differ; this supports comparable work and capability, not exact cross-version equality. CPU timings are not live browser performance.

## Verification and reproduction

Independent verification passes 63/63 suite tests with no skips or waivers, plus four focused checks. Final proof is recorded in [independent-review.md](independent-review.md) and [suite-final.log](suite-final.log). Existing assertions remain intact; six focused regressions cover actual defects and geometry invalidation. One tool-test setup changed: a single roof wound now leaves its 43 loose-source pieces settled on surviving construction, so substantial ordinary front/side demolition supplies the street-level roof rubble. The same minimum of six eligible pieces, six exact selected-owner anchors and rejection of a seventh charge are still asserted. The direct check found 204 eligible pieces; all six anchors and the budget check passed. The original 62/63 run is retained in [suite-before-fixture-update.log](suite-before-fixture-update.log). Natural structural-sleep restoration is a stated coverage limitation where a selected fixture never reached that state; fresh live continuation, immutable interpolation, retained replay and pristine rebuild have separate proof.

Repository-only reproduction helpers live alongside this note under `prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round7-directional/followup/`: `measure.py`, `fixed-step.mjs`, `inspect-native.py`, `inspect-support.js`, `support-view.html` and `prepare-media.py`. They reuse the existing Round Three recorder and Round Seven native capture/control helpers. The ZIP intentionally excludes these source helpers and the application. Temporary raw capture/profile paths inside metadata identify provenance, not required packet assets.

The original Round Seven evidence and ZIP remain preserved. The new evidence-only ZIP is `/Users/Drew/Downloads/bank-direction-round7-followup-review.zip`. [manifest.json](manifest.json) lists the selected payload and hashes; [media-check.json](media-check.json) records timestamp preservation and strict decoding. Package integrity does not establish owner acceptance.
