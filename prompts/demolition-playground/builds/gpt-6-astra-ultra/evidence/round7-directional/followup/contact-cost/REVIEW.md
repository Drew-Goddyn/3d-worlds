# Bank contact performance — reproduced at about 5 FPS

The current Astra draft becomes unusably slow after one ordinary corner charge. This diagnostic confirms the owner's frame-rate report. It does not fix or accept the bank physics.

Source: `a8c62e0aa72d6fb3d83b66891e5770f1448a7039` on the existing `round7/astra-shape-the-fall` branch. Runtime and tests were unchanged during this investigation. PR #6 remains draft and unmerged.

| Unrecorded interval | Mean frame | Equivalent frame rate | Worst frame |
|---|---:|---:|---:|
| Idle, 1–9 wall seconds | 18.06 ms | 55.38 FPS | 33.4 ms |
| After one charge, 0.5–4 wall seconds | 208.82 ms | 4.79 FPS | 249.9 ms |
| After one charge, 4–10 wall seconds | 217.27 ms | 4.60 FPS | 366.6 ms |

Only **3.06 simulated seconds advanced in 10.193 wall seconds**. At the last timed sample (9.810 wall seconds), 2 bays had failed, 240 pieces were loose and 7 were marked settled; the full bank retained 1,865 pieces. This was not a large six-charge demonstration. The input still causes a substantial local release, so it does not prove that every harmless touch has the same cost.

A separate Chrome CPU trace of the same native input places 88.05% of sampled JavaScript stacks inside bank physics. The moving-piece contact routine occupies 39.25%, structural support assessment 21.86%, and inserting support geometry into collision-search data 18.94%. These are sampled inclusive subtrees, not wall-time percentages or GPU measurements; nested entries in the [profile summary](profile-summary.json) overlap and must not be added together. The sampled garbage collector accounts for 5.74% of self samples. The full trace spans about 12.71 seconds, including setup and tail time around the 10.11-second profiled timing window; the sampling percentages describe that whole trace.

The source rebuilds collision-search grids each simulation step, repeatedly assesses the support network, and transforms/clips detailed moving contact surfaces against nearby pieces. The profile supports targeting those operations in a coherent collision repair. It does not justify removing contacts, hiding construction, reducing the retained history, or treating the existing invalid rubble trajectories as required behavior. There is no measured speedup in this diagnostic.

The clean timing run and the trace ran separately, without recording, encoding or project tests. The previous unrelated verification workers were absent, although the machine still had background load; see [environment.json](environment.json). Settings were read from the page: 1440×900 viewport, DPR 1, High quality, audio disabled. A separate profiled run reproduces a similar slowdown but is not substituted for the unprofiled figures above.

Exact requested point: `[-15.7,1.3,19.65]`, camera `[16,20,47]` toward `[-11,6.8,14]`. The normal pointer placement and accepted charge anchor are recorded in [single-timing.json](single-timing.json). Both timing windows include requestAnimationFrame timestamps and simulation progress. Their first callback can have a small negative delta because its frame timestamp predates the observer setup; the reported intervals start later and exclude that sample. The separate finalBank record is captured after the timed window and must not be used as its exact workload. The helper delegates observation to the existing render method; it does not step the simulation manually or inject an impulse.

Reproduction from the repository root, with the application running at port 4184:

```sh
PORT=4184 node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
PATH="/opt/homebrew/bin:$PATH" python3 prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round7-directional/followup/contact-cost/measure-contact-cost.py /tmp/astra-contact-cost-repro unprofiled
PATH="/opt/homebrew/bin:$PATH" python3 prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/round7-directional/followup/contact-cost/measure-contact-cost.py /tmp/astra-contact-cost-repro profiled profile
```

The helper retains the exact original checkout path; adapt it when running elsewhere. The full raw trace remains local and is identified by [result.json](result.json). No new dependencies or application changes were introduced. No product tests were run for this read-only diagnostic; the previous contact failures and incomplete full-suite status remain open. Earlier ZIPs remain unchanged. The [independent audit](independent-audit.json) verifies the arithmetic and available provenance with the stated limits; it grants no product acceptance.
