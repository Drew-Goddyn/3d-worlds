# Independent demolition-event verification

Technical verdict: **PASS for the audited runtime**, with the bounded-presentation limitation below. This does not certify aesthetic quality, listening, native browser integration, performance, evidence media, or owner acceptance.

Source: `ad36dfe2431c966d6d41a476ca8c9b6a4d2a2a9e` in a clean detached checkout at `/tmp/astra-round6-verification/checkout`. Base/current main: `9a4b9a7713502488c712ed2a07afcd1dbcf80659`, independently fetched from origin. All work was read-only against runtime source. No runtime/test edits, merge, push, dependency addition, or browser session was performed by this verifier.

The verifier received source, the round-six commission, scope and invariant criteria without builder reasoning. Root/Astra documentation, the original brief and the preceding review were read. The standing invariant set used here includes ownership and immutability, exact restored futures, structural determinism and conservation, bounded resources and cleanup, causal event/material sourcing, preserved input/quality/history contracts, and scope/network/dependency preservation. Existing tests were not skipped or weakened.

## Readable proof

| Check | Result | Evidence |
| --- | --- | --- |
| Complete Astra regression suite | 51 pass, 0 fail/skip/cancel | `suite-ad36dfe.log` |
| Independent actual audio controller and actual visual reconstruction | 5 pass, 0 fail/skip | `targeted-ad36dfe.log`, `targeted-ad36dfe.mjs` |
| Identical localized charge, 900 steps at 1/60 second | Exact complete structural snapshots and RNG at 7 checkpoints | `structural-equivalence-ad36dfe.log`, `structural-equivalence.mjs` |
| Identical six-charge front/right route, 900 steps at 1/60 second | Exact complete structural snapshots and RNG at 7 checkpoints | `structural-equivalence-ad36dfe.log`, `structural-equivalence.mjs` |
| Pristine reset and restored final event state | Exact captured-state equality for both paired routes | `structural-equivalence.mjs` |
| Source scope and whitespace | Only Astra continuation changes; clean checkout and diff check | `verification-ad36dfe.json` |

The paired comparison removes only the newly added event-track field before comparing complete snapshots. It compares structural bodies, supports, section membership/momentum, debris, legacy dust, charge timers, scoring and structural RNG. Both versions construct their bank from their own source. Each route retains all 1,864 diagnostic bank bodies. This is an isolated bank diagnostic, not the real district or browser, and does not establish native performance or visual acceptance.

The independent controller probes instantiate the real `EventAudio` implementation with a deterministic fake AudioContext that tracks node connections, source starts/stops, playback offsets, reversed sample data and buffer lifetimes. They check default mute/no autoplay, forward, pause, resume, 10% slow-motion policy, seeking/discontinuities, reverse, mute, zero volume, voice eviction, natural completion, repeated resets, bounded buffers, and no queued backlog. Live selections from recorded/grouped event snapshots reproduce the same sample choices, offsets and rates on retained replay. These are lifecycle and signal-data checks, not listening or real browser audio-device checks.

The visual probe instantiates the real `EventVisuals`, restores a dust birth preceding the rolling-history cutoff, and confirms nonzero rendering plus identical instance transforms at the same reconstructed time. Repeated renders and reset remain within 480 clouds, 960 grains and 3 lights; low quality stays within 240 clouds and 320 grains. The audio cap remains 12 simultaneous voices and 192 cached buffers, with zero tracked queued sounds and disconnected transient nodes after cleanup.

## Findings and disposition

1. **Resolved contact-check regression.** The initial candidate `5e5c77dacde3169b15228f348a69a4e323bb3e13` passed 47/51 tests. Four unchanged contact tests crashed because presentation callbacks became mandatory on their standalone simulation. All four passed on freshly fetched current main, so this was a candidate regression. The final correction makes presentation observers optional without changing any contact assertion. All four then pass within the full 51-test suite. Before/after evidence: `suite.log`, `baseline-contacts.log`, `suite-ad36dfe.log`.
2. **Bounded admission remains visible as a limitation.** After coarser grouping, true visual expiry and reserved blast capacity, the localized route peaks at 39 recorded events with no suppression. The six-charge route peaks at 752 events and records 294 suppressed minor presentation requests. All six blast births survive, no active birth is evicted by admission, and the event list returns to zero by 15 simulation seconds. This protects bounded work and important blasts, but does not mean every release/contact request receives a visible or audible response. Native district inspection remains necessary to judge the creative consequence. Do not describe saturation as eliminated.
3. **Verifier fixture corrected, implementation unchanged.** The first added visual probe supplied a synthetic event missing direction fields guaranteed by EventTrack, causing NaN matrices. The fixture was corrected to the real record contract; assertions were retained and then passed. The initial log remains in `targeted-incomplete-fixture.log`; the original-source pass is in `targeted-original.log`.

## Audit observations

- Event records are frozen and aggregation replaces records; captured event arrays are frozen copies. Restoring copies the array, so future aggregation cannot mutate a recorded frame. Individual active births remain in each history snapshot, including births before the rolling minute cutoff. Material-specific lifetimes cover the actual visual lifetimes.
- All new bank hooks observe real release, motion or contact sites. Material mapping distinguishes glazing, metal members, furnishings and masonry. No charge power, supports, fracture/contact integration or structural RNG calls changed; paired snapshot evidence substantiates that static review.
- Seeking, branching, pause, rewind, rebuild, sound enable/mute and page hiding stop active voices/reset the audio transport. Slow-motion mode/rate changes stop stale voices on the next animation update. New futures restore the event serial/list and clear transport history; pristine rebuild restores the separately retained pristine snapshot. Retained replay reads captured events, not only live callbacks.
- Visual work is reconstructed from recorded time; it does not accumulate particles by frame or move the player camera. Audio noise is deterministic and separate from structural randomness. Cached material voices are generated locally, with a compressor and finite voice admission; signal-data checks do not certify perceived loudness or mix quality.
- No sibling build, architecture recipe, external dependency, hosted service, secret, persistence, or permission surface was added by the audited runtime diff. The existing legacy dust state is still simulated and recorded but its old mesh is hidden in normal presentation.

Reproduce the suite with `npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test` from the detached checkout. The two independent scripts have exact absolute source locations embedded for this evidence checkout and require its current local Node runtime. All verification processes exited before browser timing was cleared to proceed.
