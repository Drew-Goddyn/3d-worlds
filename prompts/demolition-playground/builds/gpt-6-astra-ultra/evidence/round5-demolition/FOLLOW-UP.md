# Astra demolition world — Round 5: make demolition the creative leap

Repository: https://github.com/Drew-Goddyn/3d-worlds
Application: `prompts/demolition-playground/builds/gpt-6-astra-ultra/`
Checkpoint: PR #3, `round4/astra-bank-as-a-world`

Execute this commission through implementation, browser inspection, meaningful revision, and a new unmerged PR. This is not a request for a plan, a technology survey, or a standalone physics demonstration.

## The commission

The bank has become a distinctive, inhabited place. Now create a demolition experience worthy of it.

Give the bank's entire transformation—from intact architecture, through damage and failure, to the particular ruin left by the player's actions—the concentrated effort and design freedom that originally brought the whole district into existence. The inherited bank, hall, court, galleries, roof, and working world are starting advantages. Use them to attempt more, not merely to deliver familiar behavior with additional decoration.

This is a complete act of creation at building scale, not a backlog of repairs. You own the central conception and its execution. Decide what makes destroying this bank exceptional, then author its appearance and behavior together. A different location or sequence of charges should be worth exploring because of the consequences, not because a report announces new systems.

The principal gain must be perceptible during damage, movement, breakup, and aftermath at ordinary building/district viewing distances. A more attractive intact building alone will not satisfy this round. New architecture or materials are welcome when they serve that transformation. More fragments, more technical complexity, or a new library are not achievements by themselves.

Do not turn earlier observations about clean-edged rubble, connected movement, fracture, or material response into a mandatory feature checklist. They are clues. Find and execute a coherent creative direction, including a substantial representation change when warranted.

## What the owner actually values

The owner wants ambitious commissions whose successful results accumulate as useful starting material for later creation. They do not want to become a game developer, prescribe algorithms, select a physics engine from a menu, or operate Blender manually.

The first localized-bank round was a major behavioral improvement. The hall improved the sense that the building contains a place. The vaulted court improved architectural identity and recognizable ruins. Keep those gains, while recognizing that the latest demolition still feels substantially familiar.

Charges are the primary interaction for this commission. The owner uses them to make controlled interventions and usually does not use the difficult-to-aim ball. Keep the ball functioning, but do not divert the round into crane controls or a ball-led furniture activity.

The owner values architecture, appearance, construction, motion, placement, and integration together. Do not separate a beautiful art deliverable from a gray-box physics deliverable and assume their sum is the experience. A major collapse may legitimately bury the hall; do not secretly protect rooms or remove important debris to keep them visible.

## Keep the current achievement; work on a new branch

Read applicable repository instructions and inspect the working tree, remote refs, PR #3, and its review discussion. Preserve unrelated work and historical evidence. Do not reset, discard changes, force-push, or bypass protections.

Known references to verify:
- PR #3 reviewed head: `58ed7ec6915bd81f4111346a5dcf8c439d13a256`.
- Recorded round-four implementation: `051ca436e6110955b53c572ee40d89eed46322ff`.
- PR #3 base / round-four starting point: `08184ad5b20db59f7e2fe674e42cf9c42e7805b7`.
- Original showcase baseline: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`.

By giving you this prompt to execute, the owner authorizes checking and merging PR #3 as the retained architectural checkpoint. This is acceptance of its useful architectural gains, not a claim of perfect physics or the desired demolition leap. Check applicable status, discussion, and the current suite; do not commission another artistic round or duplicate a complete verification campaign before closeout. Do not silently include materially new, unreviewed work beyond the identified head.

If already merged, verify that the expected work is present. From updated main, create `round5/astra-demolition-leap` (a non-conflicting suffix is fine). Record the actual baseline and continue in the SAME Astra application. A temporary worktree or clean inspection view is fine; a separate replacement application is not the deliverable.

Commit, push, and open one new PR against main. Leave it unmerged for the owner's review. Do not deploy. If the checkpoint merge is blocked, explain the exact issue without bypassing protections; work may continue locally from the verified checkpoint, but do not silently publish a stacked or misleadingly based PR.

## Design authority and tool freedom

Preserve achieved capabilities, not every existing implementation decision. The current geometry recipes, fracture scheme, custom solver, asset-authoring approach, and snapshot layout are not protected solutions. You may replace substantial bank-local machinery and make necessary shared integration changes.

For this continuation, the original creative prompt's procedural-only/no-external-assets rule and prescribed structural-simulation method are explicitly relaxed. Older task-specific method restrictions are historical context, not a ceiling on this commission. Do not rewrite the original prompt/SPEC or historical results to imply the original attempts had these different starting conditions. Record the new permissions in this continuation's notes. Security, permission, and branch-protection requirements still apply.

You may use:
- Existing code or a new bank-local representation, without a requirement to preserve the old solver.
- Suitable browser-compatible libraries, including a physics library and required local WebAssembly/runtime files.
- Blender or other already available offline authoring tools, procedural preparation scripts, and locally delivered assets with suitable usage/redistribution permissions and recorded provenance.
- A combination of prepared construction and procedural assembly when that helps appearance, behavior, and future editability.

Blender is installed on the owner's machine. Verify whether its executable and version are accessible in this session rather than assuming a path or asking the owner to operate it. Use automation where useful. Blender is optional: neither its presence nor the popularity of soft bodies is a reason to choose them. An offline Blender result must become usable working material in the browser application, not a substitute rendered movie.

Keep editable source or a reproducible preparation recipe for generated/prepared content, plus the local runtime outputs needed for ordinary launch. Record library versions and relevant asset provenance. Do not download opaque executable assets or run untrusted embedded scripts. Do not purchase assets, use paid generation, create accounts, or transmit project material to an external service without explicit authorization.

The finished application must remain browser-based, self-contained at runtime, and straightforward for the owner to launch. Agent-managed project-local setup/build steps are permitted; do not make the owner learn an authoring tool or assemble dependencies by hand. A physics-library change does not, by itself, authorize abandoning the surrounding Three.js application.

## Investigate freely; adopt substantial changes on evidence

Begin with the actual accepted bank and a few native charge interventions. Read the short current review and relevant code; do not consume the session reading every archived probe or every past discussion.

Starting commands, from repository root; verify current requirements:

    node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
    npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test

Default local address: `http://127.0.0.1:4173`.

After observing the baseline, state your central design idea in one short paragraph: what the player will experience differently, why it matters at their viewing scale, and which assumptions may need to change. Then proceed. Do not ask the owner to invent the design or choose a technical architecture.

If a substantial simulation replacement or new dependency is promising, consult current primary documentation and make a focused feasibility check before committing the entire implementation to it. It should use relevant bank construction and establish the decisive behavior, state restoration/continued simulation, representative performance, and an integration path. A generic library demo or impressive offline render is not enough.

Make and execute the recommendation yourself when the approach stays within the authorized scope. Briefly record the expected benefit and the main tradeoff. Keep this investigation proportional; it must lead into the complete candidate, not become an exhaustive engine comparison or permanent research framework. You are not required to replace technology when the current tools can support the chosen leap.

For a whole-application platform migration, mandatory hosted service, expenditure, new hardware requirement, or removal of a defining player capability, return a concise evidence-backed recommendation before adopting it. Do not smuggle that commitment into a completed PR. Continue other useful work where possible rather than treating every ordinary technical choice as a blocker.

## Build in a useful workspace; deliver in the real world

You may use a lightweight unobstructed inspection view of the actual bank, hide controls, or temporarily isolate it to understand and author the result. Do not waste effort fighting neighboring buildings in every diagnostic capture. Reuse existing helpers rather than building an editor.

Distinguish visibility-only hiding from removal of physical neighbors. Label isolated checks accordingly; invisible colliders and removed interactions must not be misrepresented as normal district play. Revisit the real district throughout development. Final acceptance evidence must include ordinary views, native charges, and the normal integrated application.

Keep the existing bank's recognizable warm-stone civic identity, site, inhabited depth, and fit with the bright district. You may rework its construction and geometry substantially to support the new demolition experience. No obligation to preserve each mesh, exact floor layout, or formula; no unrelated city redesign.

A candidate branch may temporarily be incomplete during serious development. The checkpoint exists to protect the working experience. Do not cripple the creative attempt merely to keep every intermediate representation compatible with every old implementation-specific assertion.

Build a complete candidate, inspect its temporal behavior, and revise the most consequential weakness of your own conception. One lead owns the whole result; delegate where useful without fragmenting the commission into disconnected art, physics, and review projects.

## The delivered experience must hold together

Damage should act on the current construction and support relationships, not trigger a fixed collapse sequence. Subsequent interventions must interact with what the earlier ones left. Local damage and major destruction should coexist; do not make every charge cause total collapse or make important structure artificially indestructible.

Prepared fractures and visually designed approximations are acceptable. Canned destruction substituted for responsive behavior, vanishing major rubble, hidden collision bypasses, and capture-only modes are not. Artistry and physical plausibility must reinforce the same event.

Preserve charges, ordinary camera controls, slow motion, scoring without duplication, the ball's availability, and surrounding-building behavior. If simulation responsibilities change, explicitly handle interactions at their boundaries rather than having two systems independently move or ignore the same object. This does not require a generic multi-engine abstraction.

Preserve faithful replay of the recorded event, the rolling minute of history, permanent pristine rebuild, and valid alternate futures after actions in the past. New solver, connection, fracture, random, and content state must be restored sufficiently to continue correctly. Restoring visible transforms while leaving incompatible hidden simulation state is not sufficient. Cross-platform bit-identical results are not a new requirement.

Keep representative charge-driven play responsive and the retained history/memory bounded. Do not trade away the surrounding world, major rubble, or history duration to flatter performance. Report environment-specific evidence without claiming universal laptop performance.

Preserve behavioral safeguards in existing tests. Tests tied to a replaced representation may change, with equivalent protections explained; do not require old bay counts or array layouts at the expense of the new design, and do not remove a real safeguard simply to pass.

No generalization to all buildings, agent-harness migration, universal asset framework, tuning dashboard, or new review infrastructure. Leave the actual achievement understandable and usable by the next builder; a short entry-point note and working preparation scripts are sufficient.

## Compare the experience, not the feature inventory

Establish modest baseline footage before substantial changes. Use native charges for comparable interventions in both versions: limited local damage, another location or follow-up, and a larger event. Comparable intent and input should be preserved; changing construction need not preserve identical numerical outcomes. Record any camera/input differences honestly. Allow an additional demonstration of capabilities the baseline cannot express, labeled as such.

Look at normal-speed progression and use denser timestamped frames or slow motion to inspect important transitions. A sparse frame strip cannot establish continuous motion quality. Do not let an intact render substitute for the demolition comparison.

Where a fresh vision-capable reviewer is already available, use ONE anonymous media-only paired review after the complete candidate exists. Supply neutral labels, comparable views/actions, timestamps, and this brief, but no code, test counts, technology labels, or explanations of which version is newer:

> Compare these versions as complete charge-driven demolition experiences at normal building/district scale. What has become more compelling during damage, connected movement, breakup, and aftermath? Judge the appearance and behavior together; a nicer intact building alone is not the requested leap. Preserve what already works. Ground up to three observations in visible moments and recommend at most one change that would most strengthen the candidate's central experience. A tie or regression is valid. Distinguish observation from speculation and unobserved behavior. Major collapse burying a room is not automatically a defect. Keep the review short.

Interpret the advice rather than treating the critic as an authority. Allow one externally prompted artistic correction pass; ordinary debugging and your own inspection remain part of implementation. Do not reopen an endless critic loop. If a separate reviewer is unavailable, say so and continue with honest self-inspection; do not build one.

## Proportionate checks, portable evidence, candid handoff

Run the current suite and focused tests for what materially changed. Exercise native charge placement and detonation, different damage locations, substantial/repeated collapse, time controls and branching, pristine rebuild after history eviction, and a surrounding-world smoke test. Check conspicuous overlaps, unsupported pieces, unstable state, and severe slowdown where relevant. Diagnostic injections can test invariants but are not evidence that the player can produce the same event.

Do not create a second verification project or commit a growing archive of every intermediate failure. Retain selected final results and a concise explanation of meaningful fixes. Only describe an independent verification as independent if it actually used a separate context and ran the checks claimed.

Save selected final evidence in `evidence/round5-demolition/`, preserving prior rounds. Include matched useful views, short actual before/after normal-speed recordings, a different location or progression, a brief rewind/branch demonstration, and a small timestamped frame strip. The central comparison must make the demolition gain visible, not merely showcase new assets.

Save this exact commission as `FOLLOW-UP.md` and one concise `REVIEW.md`: central idea, exact baseline/result commits, launch and reproduction instructions, verified or explicitly unverified session settings, relevant technology/asset choices and preparation entry points, what improved and what remains disappointing, and meaningful verification/reviewer results. Identify final source separately from later evidence-only commits when applicable. Do not infer reasoning settings from the historical directory name or rewrite the original showcase's provenance.

Produce an evidence-only `bank-demolition-round5-review.zip` containing selected images, recordings, and brief notes. Reuse the working local packaging/viewer approach; exclude application source, dependencies, previous evidence folders, and redundant dumps. Do not commit the ZIP alongside its contents. Report an exact accessible local path so the owner can attach it for review.

Finish with checkpoint merge status, new unmerged PR, result commit, simple launch/what-to-try instructions, ZIP path, and a candid judgment of the creative result. Never equate passing tests, adopted technology, or more fragments with success. Do not claim the owner accepted the new result or invent a quality multiplier.

The standard: a fresh, substantial act of creation whose main leap is felt in destroying the bank—and whose working result becomes better starting material for the next commission.
