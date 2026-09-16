# Bank demolition follow-up: independent verification

**All executed checks pass: 63/63 application tests and 4/4 bounded independent checks.** The suite ran at `02e3fb29b9c39642709bab1433c2e959372bce73`; the runtime is byte-identical to `a1c75deba4e1e07361f92807badc515f8e20a571`, used by the supplemental checks. Natural structural-sleep restoration remains unverified.

The review used only the application/test diff, supplied follow-up criteria, applicable instructions, and standing support/contact/history invariants. The verifier made no application or repository test edits. There were no skipped tests, waivers, or unchanged reruns to obtain green.

| Independent run | Result | Preserved proof |
| --- | --- | --- |
| Earlier support repair, 0799b75 | 60/61; one loose piece after ordinary six-charge demolition | `suite-before-contact-repair.log` |
| Repaired runtime, a1c75de | 62/63; local roof-charge setup lacked six street-level roof pieces | `suite-before-fixture-update.log` |
| Final suite, 02e3fb2 | 63/63, zero failures/skips/cancellations; 170.43 s | `suite-final.log` |
| Independent runtime checks, a1c75de | 4/4; 64.00 s | `independent-checks.log` |

The original loose-piece settling test now passes unchanged. The later roof test changed only its setup: six ordinary lower front/side charges now create street-level roof rubble. Every original assertion still requires at least six eligible pieces, correct selected-piece charge ownership, and rejection of a seventh charge. This preserves the tool safeguard without requiring a local roof wound to produce substantial demolition. No runtime source changed with that setup adaptation; source-tree identities are recorded in `runtime-equivalence.json`.

Independent proof obtained:

- All 18,640 sampled geometry queries matched direct current-pose matrices and solid-part bounds across the 1,864 retained members. Fresh and warmed-cache restoration reproduced exact futures; interpolated replay preserved resumable state and immutable snapshots. A later ordinary charge produced a different future.
- A wholly unsupported carrier fell. Removing the current real support under settled construction made it fall, with exact fresh-restoration reproduction. The complete suite also passes support-cycle rejection, off-center narrow-seam support/removal, and empty-window-frame rejection.
- Three ordinary side charges at `(-4.8,1.3,10)`, `(-4.8,1.3,14)`, and `(-4.8,1.3,17.8)` left no standing/asleep pier without a current solid-part support path at 10 or 15 simulated seconds. The 15 s sample retained 1,864 members: 10 failed bays, 801 settled pieces, zero loose pieces. The oracle includes real off-center solid contacts and does not infer support from a frame's empty center.
- A normal lower-front charge at `(-6.3,1.3,19.65)` left seven failed bays at both 5 and 25 simulated seconds; all 444 released members had settled by 25 s. A later normal cut at `(-11,1.3,19.65)` changed the construction to eight failed bays. This proves a persistent partial state for that selected input, not a preferred failure threshold.
- Eighteen height-index cases matched an independent direct scan, including negative/positive bin boundaries and downward sweeps. The full suite preserves directional motion, transferred contact momentum, retained architecture, charge budget, event restoration, the rolling minute, and pristine rebuild.

These supplemental checks use the actual bank recipe and ordinary charge API without the district or browser. The word “native” in original machine observation labels means ordinary charge calls, not native browser input.

The earlier central-footprint oracle rejected two stationary piers but did not establish that they were floating: other rooted rubble contacted their real parts off-center. That inconclusive trace and the original failed assertions remain preserved in the `astra-followup-final-prior-0799b75-*` files. The former empty-frame resting calculation is now covered by an explicit regression; the owner's unspecified visual symptom is not independently certified as reproduced or fixed.

The partial-wound and gravity-loaded intact fixtures did not naturally reach structural sleep. No sleep flag was forced; sleep-state restoration remains an explicit coverage gap. The checks establish support using the application's collision solid-part bounds. No independent browser inspection, visual acceptance, performance comparison, audio review, or final ZIP validation was performed. PR must remain draft and unmerged.

Reproduction uses Node v26.3.0 and npm 11.16.0. From the repository root, run `npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test`. The portable `independent-checks.mjs` is repository-only at `prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round7-directional/followup/independent-checks.mjs`, excluded from the evidence-only ZIP. Run it with `node --test` from the application directory, or set `ASTRA_APP_ROOT` to that application directory. Machine observations and the script hash are in `independent-results.json`; file references in this report are relative to this proof packet.
