# Astra — the demolition event

The creative idea is **pressure, fall, aftermath**. A charge makes a compact outward disturbance; real moving masonry sheds a light trail; contact mass shapes low plumes and material voices; suspended dust clears to expose the retained ruin. The falling windows, galleries and roof remain the event. Sound distinguishes stone, glass and metal without asking every small piece to make a full blast.

## Checkpoint and result

PR #4 was merged under the commission’s explicit authorization at **9a4b9a7713502488c712ed2a07afcd1dbcf80659**. Its head matched **5df5068fe01d5a81f75c459bc553eda6671ec789**; its runtime was **8535020890ad135f85fec68cebc009ddd89b1d54**. No later unrelated implementation was included. The no-recording closeout trace advanced 13.7761 simulated seconds in 14.0005 wall seconds; the inherited 60 ms frame cap discarded approximately 0.24 seconds. This transient pacing limit was disclosed on PR #4 before merge. The checkpoint passed 43/43 independent tests.

Round six starts at that exact merge on `round6/astra-demolition-event`. Final runtime: **e9ecb689ef97b9fd677903d5adea4bd38c36b062**. Later commits package evidence and continuation documentation only. The new PR remains unmerged; nothing was deployed. Session model/reasoning are **unverified**.

## Launch and reproduce

From the repository root:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
```

Open http://127.0.0.1:4173. Enable **Sound** in the right rail; the level starts at 35%. Orbit, pan and zoom remain under player control. No new camera shake or forced motion was added.

Choose **Charges**, click low on the left front corner, then detonate. Rebuild and repeat at the right corner. For the substantial collapse, place three low across the front and three along the right side. The exact projected targets, accepted body attachments and action timestamps are in the recording metadata. The comparison camera is `[16,20,47]` toward `[-11,6.8,14]`; the alternate view is `[-16,24,53]`. Physical neighbors remain present in every final recording.

Extract the ZIP and open [viewer.html](viewer.html). A/B selects one soundtrack at a time, at a common 80% player level. The small-wound, different-corner and large-collapse movies retain all wall time. The time-control movie demonstrates slow motion, pause, rewind, retained replay, an accepted new charge that discards the old future, and rebuild. Native frame timing changes the coarse solver’s trajectory, so the two large-collapse ruins are not forced to match.

## Time and ownership

Visible effects are reconstructed from immutable event births at simulation time, including births before the rolling history cutoff. Forward retained replay uses the recorded sound choices. Pause, free scrubbing, timeline jumps, branching, mute and rebuild transitions stop stale voices. Slow motion lowers playback rate and stretches material tails. Rewind uses restrained reversed material grains as event births are crossed; free scrubbing is silent. Resume never emits a backlog.

The record ceiling is 1,536 events, separate from fixed limits of 480 cloud instances, 960 grit points, three local light responses, 12 audio voices and 192 cached buffers. Quality affects presentation only. At saturation, minor presentation admission is bounded and sixteen slots remain reserved for blasts. The isolated-bank six-charge verification peaked at 897 events with **zero suppressed requests**, and all events expired by 15 simulated seconds. The real district recording peaked at 932 records, also with zero suppression, and ended with no active events.

## Inspection, revision and proof

The first complete treatment was too faint at building scale and its single blast peaked above the baseline. Revision gave pressure a clearer outward direction and contacts more readable low plumes, added trails at actual moving construction, lowered output, and spaced material voices. Inspection then found early event-buffer saturation; the final representation retains later contacts without raising rendered-particle or voice counts. Four contact tests exposed a required presentation callback in isolated physics fixtures; the callbacks became optional and every original contact assertion stayed intact.

Independent verification passed **51/51 application tests and 6/6 additional probes**, with no skips. Two 900-step charge routes exactly matched current main’s structural snapshots and RNG at seven checkpoints apiece. Tests include real audio-controller lifecycle/cleanup, identical retained sound choices, exact reversed buffers, actual visual-buffer reconstruction, history cutoff births, immutable ownership, alternate futures and permanent pristine restoration. These are technical checks, not a listening or owner-acceptance verdict.

Native input checks exercised the ball (83 damage tonnage), camera movement, quality/mute controls, two six-charge/rebuild cycles, and history eviction beyond 65 simulated seconds. Both cycles returned to zero active events, clouds, grit and voices, with no queued audio. Rebuild restored the exact pristine bank, including after eviction. The audio cache ended at 131 of 192 entries. Browser errors and console messages were empty. The alternate-future recording verifies the new charge was actually accepted after the original six fired.

A separate, unrecorded sound-enabled pair used 1440 × 900, DPR 1, high quality, headless Chrome 152 on an Apple M2 Pro, with other verification jobs stopped. Over roughly 14 wall seconds, baseline advanced **13.2895** simulated seconds and candidate **12.8164**. During the 0.5–6 second collapse window, mean / p95 frame times were **26.31 / 100 ms** baseline and **34.16 / 116.7 ms** candidate; both settled near **16.67 ms**. This is added transient runtime cost and inherited time loss, not authored slow motion. One paired pass is not a universal hardware benchmark. No structural or history quality was reduced. Raw traces are [baseline timing](baseline-timing.json) and [candidate timing](candidate-timing.json).

I inspected native screenshots and dense extracted motion strips, including the muted visual presentation, alternate angle and real district. This environment cannot listen to audio or directly perceive continuous video playback; no external artistic/listening verdict is claimed. The included application sound was decoded and checked for signal, headroom and timing, not judged from a waveform. Owner review of actual motion and sound remains necessary.

My assessment is a clearer sequence of local force, carried construction and contact aftermath, with more to inspect in slow motion and reverse. The small corner wound stays modest. Indivisible frames, prepared material boundaries, regular rubble bands, approximate contacts and a hall that can become buried remain inherited limitations; effects do not solve or certify them.

## Provenance and evidence

No dependency, asset or service was added. Existing locally vendored Three.js 0.180.0 is retained. Visual noise, dust, grit and all material sound buffers are authored in source; there are no external samples or paid assets. The editable presentation and synthesis entry points are described in the application README.

Recordings route the actual application output into a browser MediaStream alongside the canvas, with no microphone and no added soundtrack. PCM avoids the browser’s incomplete Opus silence packets; H.264/AAC delivery preserves original timestamps. No idle sections were cut and no footage was sped up or slowed in postproduction. Every encoded source video timestamp is retained. Maximum recorded frame gaps span 54–295 ms; the gaps include rendering/recording stalls and remain in the movies. All seven stereo soundtracks decode without errors or clipped samples. The large-collapse mean / peak levels are −33.8 / −11.4 dBFS for baseline and −36.2 / −11.5 dBFS for candidate; these are signal measurements, not listening judgments. First candidate sound onsets follow the first recorded voice/effect frame by approximately 29–40 ms. [media.json](media.json) contains stream/signal and captured-frame timing checks; [baseline-recordings.json](baseline-recordings.json) and [candidate-recordings.json](candidate-recordings.json) retain frame/action timing. The exact brief is [FOLLOW-UP.md](FOLLOW-UP.md).

Selected [independent verification](verification/verification.json), [native checks](native-checks.json) and [checkpoint verification](checkpoint/verification.json) are included. The capture/timing Python recipes are **repository-only** under `prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round6-event/`. Small independent verification probes and logs are included; they refer to repository source and are not standalone application code. The ZIP contains review evidence, not the application checkout. Source hashes in verifier reports refer to the committed repository, not ZIP members.
