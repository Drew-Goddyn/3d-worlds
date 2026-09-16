# Demolition Playground - Skills Build Loop (3 rounds)

## Status

Frozen build 03 is imported into the collection as a bounded, human-directed workflow result. This record accompanies the source import on `publish/demolition-skills-build-loop`, with `main` as the PR target. Git history and the publication handoff provide the actual import commit and PR identity; those values are intentionally omitted here to avoid a self-referential commit field. A branch or PR does not imply a merge, release, or deployment. The experiment ended after build round 3. Publication is administration, not round 4.

## Original task and interpretation

The original prompt is 6,308 UTF-8 bytes with SHA-256 `934156d73fa6451150d8c13da45465eee6621658e7d0e8af46a843826dd2f8a7`. The supplied extract, the original-prompt section of the frozen brief, and the [shared prompt](../../PROMPT.md) were compared and match byte for byte, with no trailing newline. See the [prompt verification](publication/prompt-verification.json).

The source's `docs/BUILD_BRIEF.md` keeps the original prompt separate from six accepted interpretations: causal engineering-inspired game physics; a simulation-time history clock; whole-current-run recorded reset rather than a rolling-window reconstruction; replacement futures after accepted historical actions; compact discoverable controls without onboarding; and a modular desktop-first local browser application with measured performance.

## Workflow, people and model provenance

The human supplied the task, accepted the six recommendations in one clarification round, relayed assignments and results, and controlled acceptance and publication. A fresh local coding-agent session implemented the first build and continued for the related rounds. ChatGPT supplied interpretation, assignments and review using Grilling, Domain Modeling, Codebase Design, Build Loop, and Writing for Agents.

There were **three build-and-review assignments**, not three model calls. Builder self-correction and reported independent reviews happened inside assignments. This is not a one-shot entry or a controlled estimate of the effect of any individual skill. Exact total compute remains unverified. The historical handoffs did not verify implementation model or effort; subsequent recovery from this attempt's own creation-session metadata establishes the lead builder settings below.

**Implementation:** `gpt-6-astra`, reasoning effort `max`, for all three implementation assignment starts and their recorded continuation contexts. The implementation session began **September 15, 2026**, at `2026-09-15T21:05:16.281Z`. This is the session-start date, not the final freeze or collection-import date. The [minimal evidence extract](publication/builder-session-settings.json) identifies local Codex `turn_context` settings correlated with the three assignment requests. Later publication turns are excluded. The label covers the lead local coding agent; it does not identify every helper call. Raw transcripts and unrelated session data remain private.

**Thinking/review partner:** ChatGPT using Grilling, Domain Modeling, Codebase Design, Build Loop, and Writing for Agents. Its exact model and reasoning effort remain **unverified**. Builder settings are not attributed to the reviewer. Historical evidence retains its original uncertainty statements.

The build and its final assessment were isolated from other attempts. Shared collection metadata was inspected only after freeze for publication conventions; it was not used for another implementation pass.

## Immutable source identity

Source repository: `Drew-Goddyn/blind-3d-world-astra-build-loop`.

The builder reported an uncommitted implementation on `main`, based on `186001a2f22b98f3c127a535f742e1eca1935343`. That baseline is not an implementation-creation commit. The frozen archive is the authoritative deliverable.

- Archive: `build-03.zip`, 64,303,553 bytes.
- ZIP SHA-256: `0b5a4c310e89d70a6fc47c61fb846d0d0adb517aee25c028fc9734d8504f9e01`.
- Complete source-manifest SHA-256: `ba7b31d92c2fb163ddb564d989fb1668b5ef289b5026f80707adf16868d5ed7f`.
- Runtime source SHA-256: `1c7af145f00ccad9359d1c8d8f389fa021431de4b79f77137d09f727549eb2c4`.
- Source files: 52, listed in the [frozen source manifest](publication/SOURCE_SHA256SUMS.txt).

Preserve those files byte for byte. Add publication metadata outside their manifest. A subsequent collection import commit is a publication commit, not evidence about the original build model or time of creation.

## Outcome and evidence

Round 1 established the district and reversible-state foundation. Round 2 repaired temporal presentation and time-based transport and improved physical fragment ownership, while exposing contact/support failures and increasing resource use. Round 3 repaired the demonstrated tank contact and tower-settling failures and reduced the round-2 recording cost.

The builder reports 47 passing tests. The final review independently reran 46 original cases, with one Three.js-dependent case unavailable because dependency-registry resolution failed. Seven of the rerun cases used relocated imports/fixture paths without changed test bodies or assertions. The review also independently checked temporal behavior, the demonstrated shell-contact endpoints, and complete tower settling. See [the final review](publication/evidence/reviewer/FINAL_REVIEW.md) and [public reviewer evidence](publication/evidence/reviewer/README.md) for exact attribution and limits. Those historical checks were not rerun during packet preparation. Subsequent collection-import verification separately passed all 47 cases after successful dependency installation, plus the static check and a browser smoke check. The [publication check record](publication/evidence/publication/checks.json) identifies that local coding-agent run. Provenance-only continuation reuses it because the checked source bytes are unchanged.

Comparable builder measurements on an M2 Pro, Chrome 149 with Metal, 1440 x 900, DPR 1 and High quality report 442.5 MiB history payload after 91 simulation seconds, a 16.7 ms collapse p95 frame interval, and a 25.0 ms maximum sampled collapse interval. These are not independent cross-machine benchmarks. The payload excludes object, rendering, event-trace and temporary memory. The same workload produced different destruction as the implementation changed.

The final result is a functioning stylized demolition toy, not full delivery of the prompt's visual ambition. Coarse contacts, grouped debris, partial whole-tower lean/material effects, particle water, and growing history remain limitations. The separate 91-second workload still has 30 moving bays. Full normal-speed review of every recording and byte-for-byte final GPU-pixel comparisons remain unverified.

## Launch and collection verification

From the collection repository root, with Node.js 22 or newer:

```sh
npm --prefix prompts/demolition-playground/builds/skills-build-loop ci
PORT=4176 npm --prefix prompts/demolition-playground/builds/skills-build-loop start
```

Open **http://127.0.0.1:4176**. Dependency installation requires registry access. The application serves pinned Three.js locally and uses no external scene assets or runtime network origins. The imported source is present in this public checkout; running it does not require the original source repository or archived ZIPs.

All 52 source files and the [preview](../../previews/demolition-skills-build-loop.png) retain their frozen bytes. Verify the import from the collection root with:

```sh
python3 prompts/demolition-playground/builds/skills-build-loop/publication/verify-import.py
```

The collection-path run passed 47 tests, the static check, and 15 browser smoke checks with Node.js 22.23.2. Smoke coverage includes initial rendering, local imports, pause/slow motion, quality, camera controls, charges/detonation, timeline inspection, rewind, and exact initial-state rebuild. It is not a new performance benchmark. The initial smoke driver's range-input formatting error and its correction are retained in the check record; no application bytes changed.

The full Git whitespace check reports two inherited defects in the frozen build brief and architecture source. Both were reproduced directly from the archive and preserved to maintain byte identity. Publication-only files pass their whitespace check. See the [exception evidence](publication/evidence/publication/frozen-whitespace.json).

## Publication boundaries and export record

This entry uses the exact frozen initial-view capture. Existing entries, application trees, historical labels, previews, comparison films, and releases are preserved. The historical films do not include this entry. The original source repository and all three build archives remain unchanged.

The [evidence index](publication/evidence/README.md) separates builder reports, the thinking partner's final review, and subsequent collection verification. The [documentation export record](publication/documentation-exports.json) maps packet files to public copies with original and exported hashes. Only the publication drafts were revised for recovered builder metadata, public navigation, launch instructions, and collection-check attribution. Reviewer evidence is byte-identical; its sandbox and archive references are explicitly labeled as historical in the public index.

Large ZIPs and videos remain outside this source commit. No raw private transcripts, credentials, dependency caches, or unrelated files are included. This import creates no release and performs no merge or deployment.
