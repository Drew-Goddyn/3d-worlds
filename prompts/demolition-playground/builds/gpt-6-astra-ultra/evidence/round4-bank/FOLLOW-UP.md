# Astra demolition world — Round 4: commission the bank as a world in itself

Repository: https://github.com/Drew-Goddyn/3d-worlds
Application: `prompts/demolition-playground/builds/gpt-6-astra-ultra/`
Preceding work: PR #2, `round3/astra-bank-breach`

Execute this commission in the existing application. Carry it through a complete implementation, actual browser inspection, meaningful revision, and a new unmerged PR. Do not stop at a proposal or ask the owner to choose a technical architecture.

## The ambition

Recommission Mercantile Bank as an exceptional, complete demolition subject inside the existing district. Give this one building the concentration of effort and design freedom that the original world-building commission spread over the entire world.

The current bank is working material, not a blueprint you must decorate.

Create a coherent bank-scale experience that is compelling intact, increasingly interesting as it is damaged, and convincing as the particular ruin produced by the player's actions. Architecture, construction, materials, inhabited depth, movement, failure, and aftermath should belong to one authored whole. Decide what will make that whole exceptional; do not merely collect missing features and implement them independently.

This is an attempt at another substantial creative leap, not a promise of a numerical quality multiplier. The owner wants to discover what becomes possible when a fresh, ambitious commission begins with earlier successes already available. Use that advantage to attempt something richer, not just deliver the existing experience with minor repairs.

## What we learned from the owner

The first bank-focused round was a substantial success: localized breaking and crumbling made demolition meaningfully better than the original bulky movement of entire storeys.

The subsequent banking hall also earned its place. It makes the bank feel inhabited and less like an empty model. Its contribution is primarily to the completeness of the setting; it does not need to remain visible after a major collapse or become a separate furniture-manipulation activity.

The owner usually experiences the world at building and district scale, with occasional closer inspection. They prefer charges for precise, controlled demolition. They do not want this commission diverted into steering the wrecking ball, perfecting its collision, or exposing tiny details that can only be appreciated from a special close-up.

Preserve the value of localized destruction and inhabited depth. Do not assume that the best next step is a smaller room, more furniture, more fragments, or a checklist of physics defects. A specific repair may enable the new design, but it is not the organizing ambition.

## Your design authority

You own the creative interpretation and the technical approach within the bank's responsibility.

You may substantially change the bank's construction, internal organization, material treatment, structural representation, fracture approach, dynamics, and arrangement of interiors where those changes serve a stronger whole. Retain its recognizable warm-stone civic-bank identity, approximate site and scale, and fit with the bright, stylized district. You need not preserve every mesh, formula, room arrangement, or architectural choice.

Preserve achieved quality and capabilities, not every line of code. A larger coherent bank-local change is preferable to a pile of exceptions that perpetuates an unsuitable representation. Conversely, do not rewrite working foundations just to create a blank canvas.

Choose the central idea yourself. After inspecting the starting experience, state it in a short paragraph: what will distinguish your version, how the player will experience the difference at ordinary viewing distances, and which existing decisions you intend to reconsider. Then proceed. Do not ask the owner to pick among proposals or turn this paragraph into an extensive design document.

Existing concerns about kit-like rubble, clean fracture edges, connections, or material response are possible clues, not mandatory features or established root causes. You may find a stronger direction. The goal is not to mechanically implement a previous reviewer's repair list.

## Preserve the checkpoint, then start a new round

Read applicable repository instructions. Inspect the working tree, remote refs, PR #2, and any review discussion. Preserve unrelated work; never reset, discard changes, force-push, or bypass branch protections.

Known references to verify:
- Original showcase: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`.
- PR #2 base / merged round-two checkpoint: `6d583d11b73e337114f597a772a5924f769cd562`.
- Last inspected PR #2 head: `de472e5ef4a3ffa69b39422858852bb721b8b1cb`.

By executing this commission, you are authorized to close out and merge PR #2 as a retained banking-hall improvement after checking the current diff, applicable checks, and any genuine blockers. Describe the owner's decision accurately: keep the hall for its contribution to the bank's completeness; this is not acceptance of perfect physics or a major leap in demolition. Do not require a new ball-focused pass, a perpetually visible room, or additional furnishings before closeout. Do not silently include materially new, unreviewed work that appeared after the identified head.

If already merged, verify the expected work is in main. From the resulting updated main, create `round4/astra-bank-as-a-world` (a non-conflicting suffix is fine), record the exact baseline, and continue in the SAME Astra application.

Commit and push this round, and open one new PR against main. Leave it unmerged for owner review. No deployment. If permissions or protections block the checkpoint merge, report the exact blocker; do not bypass it or silently open a stacked PR. You may continue locally from the verified PR #2 head, recording the dependency, but do not publish a misleadingly based PR.

## Use the inherited world, then author the bank

Read the root/Astra READMEs, original creative brief and SPEC, and the short round-two and round-three review notes. They provide intent, launch details, and provenance. Their old task-specific prescriptions are historical context; this commission supersedes the earlier requirement to prioritize ball-led hall interaction. Standing repository rules still apply.

Inspect the relevant construction, simulation, fracture, history, and charge-input code. Follow dependencies where needed, not a repository-wide audit. Do not read every archived probe or discussion before starting creative work.

Current commands from the repository root; verify runtime requirements:

    node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
    npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test

The default address is `http://127.0.0.1:4173`. Root npm scripts are not the Astra suite.

Launch the starting bank. Use native charges to inspect local damage, a differently located comparable intervention, and substantial collapse. Establish a few reproducible inputs and views for later comparison. Record enough baseline media to compare the result fairly; do not build a capture system.

Build a complete candidate of your chosen interpretation. Inspect it as a player and viewer, including normal-speed movement, not just individual stills or a state log. Revise the most consequential weakness of that interpretation. Continue until you have a coherent, inspected candidate rather than stopping at an intact render, a grey-box mechanic, or the first passing tests.

## The experience must hold together

The new quality must be apparent at the usual building/district scale. Closer views should reward attention, not be the only place the improvement exists. The result should invite trying different charge placements because consequences are worth observing, not because the owner has been told new systems exist.

Do not prescribe identical outcomes for every input. A localized intervention and extensive demolition need not end in the same state. A later intervention must act on the actual changed structure. Interesting partial damage and a satisfying large collapse should coexist, without requiring an arbitrary fixed sequence to reveal the best behavior.

The architecture, its movement, exposed construction, and its remnants must visibly agree. Choose the right approximations for the desired result; scientific structural accuracy and atom-scale detail are not required. More geometry or independently moving bodies is not a success criterion by itself.

Keep inhabited depth as part of the architecture. You may integrate or extend it where your design needs it, but an inventory of props or a perfect room close-up must not consume the commission. Large collapse may legitimately bury interiors. Do not remove important rubble, switch off collisions, secretly protect a room, or use a special demonstration-only mode to obtain flattering evidence.

Use the actual damage and simulation state, not a canned collapse animation substituted for player-responsive behavior. Avoid a fixed collapse timer unrelated to damage/support. Changes to the bank's representation must remain integrated with existing charge placement, slow motion, cameras, score, rebuild, and time controls.

Rewind must restore this event: structure, fragments, contents, velocities, random state, attachments, and other newly required state. Preserve immutable earlier snapshots, replay of retained history, alternate futures after a new past action, the rolling minute, and permanent pristine rebuild. Keep the surrounding district working and the ball available, without making ball improvements the project.

## Boundaries that preserve the focus

Keep the browser-based, procedural, self-contained, offline application. Do not migrate the whole engine, introduce hosted services, or require the owner to set up a new toolchain. Bank-local implementation may change substantially; necessary shared integration changes are allowed with regression checks. Do not categorically preserve an unsuitable solver just for a small diff, but any replacement must serve the bank rather than become an engine project.

No Prime Agent migration, self-improving harness, memory platform, universal building framework, other-building rollout, new editor, walkthrough mode, or mandatory tuning dashboard. Do not re-create already working capture helpers unless a concrete failure requires it.

Keep the original showcase, historical media, and other model builds untouched. Update only the small amount of current documentation/provenance needed to identify this continuation. Do not mislabel it as a fresh one-shot attempt or infer session settings from the historical directory name.

Leave the working construction and behavior easy for the next builder to find and start from. Preserve the usable achievement, not just its pictures. This requires understandable code and a short entry-point note, not a generic plugin or skill library.

## Review without surrendering authorship

You are responsible for looking at the result and revising it. Where a fresh vision-capable reviewer is already available, use ONE paired media-only review after the complete candidate exists. Do not spend a series of preliminary reviews letting a critic design your assignment.

Supply matched actual media, neutral version labels, input descriptions/timestamps, and a short statement of the intended bank-scale experience. Do not supply code, test counts, builder explanations, model labels, or an explanation of which version is newer. Do not condition the reviewer to prefer the new version. Use this brief:

> Compare these two versions as complete demolition experiences in a bright, stylized district, primarily operated with charges. Does either deliver a substantially richer, coherent building-scale experience, rather than merely more detail? Judge architecture, appearance, placement, failure progression, and aftermath together. Name what works and must survive. Ground up to three important observations in specific visible evidence. Recommend at most one change that would most help the intended experience. A tie or inconclusive result is valid. Distinguish observed behavior from hypotheses, absent evidence, and possible creative opportunities. Do not prescribe implementation or make continuous-motion claims from sparse frames. A room being buried after major collapse is not automatically a defect. Keep the review brief.

Interpret the advice and make at most one additional externally prompted artistic correction pass. Ordinary debugging and your own visual iteration are still required; this cap is not permission to knowingly ship broken behavior. Do not reopen an endless critique loop or automatically turn the latest criticism into a new feature.

If a separate reviewer is unavailable, disclose that once, inspect the result yourself, and continue. No reviewer infrastructure. Preference is evidence to consider, not owner acceptance.

## Proportionate verification and portable evidence

Run the existing Astra suite and targeted checks needed by the new behavior. Preserve safeguards, adapting implementation-specific assertions only while retaining their protections. Exercise the normal charge UI, different placements, substantial destruction, time controls, pristine rebuild, and a surrounding-building smoke test. Synthetic diagnostics are useful but must be labeled separately from player interaction.

Check representative repeated play for conspicuous clipping, unstable state, missing geometry, severe slowdown, and runaway allocation. Report the actual environment and limitations. No second independent runtime campaign, sprawling probe archive, or unsupported hardware-performance claims. Tests protect the experience; they do not establish its quality.

Save selected evidence in `evidence/round4-bank/`, without overwriting earlier rounds:
- A matched intact overview and useful damage/aftermath views, including a second angle.
- Short before/after real-time recordings of comparable native charge actions. Include a different placement or progression to show the result is responsive rather than a single staged shot, and a brief rewind demonstration.
- A modest timestamped frame strip from actual footage for reviewers who cannot inspect video directly.
- One concise `REVIEW.md` with the central idea, exact baseline/result references, reproducible inputs/views, what improved, what did not, meaningful checks, any reviewer advice and response, and verified or explicitly unverified session settings. Retain this prompt as `FOLLOW-UP.md`.

Reuse existing capture/packaging tools. Save only selected final evidence and useful reproducibility material in the PR; keep redundant intermediate dumps local. Make an evidence-only `bank-world-round4-review.zip` with the selected media and brief notes, and report its exact accessible local path. No application source, dependencies, old evidence folders, or duplicated ZIP committed alongside its contents. Do not claim a clip was watched when only frames were inspected, or present generated illustrations as captures.

Finish with the checkpoint merge status, new unmerged PR, result commit, how to launch and what to try, ZIP path, and a candid plain-language assessment of the result. No invented multiplier, no automatic claim that newer is better, no claim of owner acceptance.

The standard: another complete act of creation at a scale that matters in play. The bank should feel meaningfully more extraordinary as a demolition subject, while leaving the next commission better starting material than this one received.
