# Mercantile Bank · a world in itself

**Unmerged review candidate.** A warm-stone treasury now encloses a tall, daylit banking court: monumental glazed arches, green galleries, an open stair and a copper-glass barrel vault. Damage exposes the same construction that makes the intact bank distinctive. The strongest gain is architectural identity before and after destruction; small ground-level charges still behave much like the retained checkpoint.

## References and launch

- Original showcase, untouched: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`.
- PR #2 was merged, retaining the hall for completeness—not accepting perfect physics or another major demolition leap. Its checked head was exactly `de472e5ef4a3ffa69b39422858852bb721b8b1cb`, with no later unreviewed work. Fresh checkpoint verification passed 29 suite tests and 3 additional checks.
- Exact round-four baseline / checkpoint merge: `08184ad5b20db59f7e2fe674e42cf9c42e7805b7`. Baseline footage uses the identical application source at the checked PR head.
- Final implementation: `051ca436e6110955b53c572ee40d89eed46322ff`. Subsequent commits package evidence/provenance only. Branch: `round4/astra-bank-as-a-world`, against main. No deployment or owner acceptance.
- Session model/reasoning: **unverified**. The directory label describes the original attempt.

From the repository root:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test
```

Open **http://127.0.0.1:4173**. Tested with Node 26.3.0; no installation, network or new toolchain is required. The short construction entry-point note is in the application README. The exact commission is `FOLLOW-UP.md`.

## What to try and compare

Open **viewer.html** beside its files. Choose one left charge, one right charge, or six front/right charges; play the matched recordings at normal speed. Also inspect the roof-then-gallery progression and the rewind/rebuild recording. The last two are additional final-version interactions, not matched baseline comparisons.

Matched camera: position `[16,20,47]`, target `[-11,6.8,14]`, 1440×900. Alternate angle: `[-16,24,53]`, same target. Native charge world targets:

- Left: `[-15.7,1.3,19.65]`; right: `[-6.3,1.3,19.65]`.
- Large collapse: left, `[-11,1.3,19.65]`, right, then `[-4.8,1.3,10]`, `[-4.8,1.3,14]`, `[-4.8,1.3,17.8]`.
- Different progression: `[-8.7,14.8,17.15]` on the roof, then `[-5.3,7.6,17.6]` on the upper side, with six seconds between aftermath samples.

The input JSON records actual screen coordinates, accepted charges and timing. `reproduce.py` and `inspect-controls.py` reuse the existing recording helper; they are repository-only. Run with `PYTHONDONTWRITEBYTECODE=1 python3 <script> <output-directory> <label>` after launching the app. The controls script follows the capture script in the same browser session.

## Revision and assessment

The first complete candidate still looked like stacked rooms. The consequential revision replaced the repeated upper windows with a single monumental arcade, making the court and galleries legible from the street. Complementary fracture plates expose warm cores; roof panels depend on physical ribs. Fallen pieces retain their geometry and can receive subsequent charges. Selecting a moving piece during rewind preserves its local attachment point when a new future begins.

One anonymous paired media review (alpha: `308a4c1`; beta: the checked PR #2 head) preferred the tall hall, roof silhouette and recognizable ruin. It found richer charge interaction unproven and suggested a more legible, location-specific glimpse through local damage. I kept the bounded ground damage and inspected the separate roof/gallery progression; no additional externally prompted artistic pass was made. Preference is advisory. The review used frames, not continuous video. Later changes fixed charge attachments; final selected captures use `051ca436`.

The result is more particular to this bank, including its ruin. Dense pale rubble, long rigid window frames and approximate contacts remain visible limitations. Major collapse can bury the teller hall. This is prepared fracture and a stylized support simulation, with possible transient overlap—not validated structural engineering. No collisions or important rubble were removed to improve the images.

## Evidence and checks

Fresh independent verification passes **36/36 tests, zero skipped**. It found two real targeting bugs: landed roof debris initially rejected 10/10 charge attempts, and 8/20 interpolated replay selections attached to the wrong piece. Final checks accept all 10 debris targets and preserve all 20 selected pieces/local points, with the six-charge maximum intact. Exact replay, immutable snapshots, alternate futures, rolling history, pristine rebuild, score, quality and district safeguards pass. See `verification/third/report.json`; earlier failure evidence is retained. The independent handler probes are synthetic diagnostics, distinct from browser pointer interaction.

Final native browser checks restore bank/charge snapshots at all three scrubs, show slow replay and rewind, create a different future, and restore the exact pristine bank both before and after history eviction. Repeated six-charge runs each release 15/27 bays, retain all 1,865 bodies and settle 1,238 with zero loose bodies at the measured aftermath. The roof/gallery sequence releases only three bays. A neighboring building collapses, the ball remains usable, and camera/quality controls work. Browser error and console collections are empty. Details: `native-checks.json` and `native-run.txt`.

Apple M2 Pro, 32 GB RAM, macOS 14.5; headless Chrome 152, ANGLE Metal, high quality, 1440×900/DPR 1. Four-second samples without an active recorder:

| Phase | Mean / p95 interval | Sampled JS heap |
|---|---:|---:|
| Rebuilt intact | 16.65 / 17.6 ms | 51.8 MiB |
| Roof/gallery aftermath | 16.65 / 18.0 ms | 93.8 MiB |
| Repeated large collapses | 16.65 / 20.2 and 20.0 ms | 95.4 and 96.8 MiB |
| Final rebuilt district | 16.65 / 17.7 ms | 62.4 MiB |

These are short samples in one reused browser, with GC and prior recording allocations; they do not establish a hardware-wide FPS guarantee or long-run leak bound. No conspicuous slowdown or runaway retained-body count appeared in the repeated runs. A rear capture attempt was obstructed; its failed take remains local, and repetition used the verified front/right route.

The clips are actual canvas MediaRecorder footage with real timestamps; DOM controls are visible in corresponding screenshots. Strips are timestamped extracts from those clips. I inspected normal-speed browser runs through live captures and timed extracts, including denser collapse samples; I did not continuously watch the clips or certify frame-perfect capture continuity. No generated illustrations are used.

The evidence-only ZIP is **bank-world-round4-review.zip** in the owner's Downloads folder. It contains selected media, notes and recorded check outputs, excluding application source, dependencies, reproduction scripts and older evidence folders. The ZIP itself is not committed. `media.json` records media hashes and durations.
