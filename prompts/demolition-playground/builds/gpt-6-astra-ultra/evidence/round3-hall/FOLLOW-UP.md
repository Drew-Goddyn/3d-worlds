# Astra demolition world — Round 3: breach the banking hall

Repository: https://github.com/Drew-Goddyn/3d-worlds
Existing application: `prompts/demolition-playground/builds/gpt-6-astra-ultra/`
Previous commission: PR #1, `round2/astra-mercantile-bank`

This is an implementation commission for the local agent, not a request for a proposal. Complete the previous checkpoint, then build, inspect, revise, and deliver the next playable improvement in the SAME Astra application. Do not create a sibling application or generalize the bank to the other buildings.

## The owner's decision

The owner played round two and found its localized breaking and crumbling a significant improvement over the original bulky destruction. Treat that as an accepted improvement worth retaining—not a declaration of perfect physics or completion of the bank.

The next ambition is not simply more fragments. Make breaking through the bank reveal and disturb a convincing banking hall: a place that was visibly there before the impact and participates in what happens afterward.

The owner should not have to choose a physics architecture, identify technical bottlenecks, tune parameters, or prioritize a backlog. Own those decisions. Use the visual review below to sharpen the work, not to hand those responsibilities back to the owner.

## First, preserve the successful checkpoint

Read applicable repository instructions before changes, including any AGENTS.md files that actually govern this directory. Inspect the working tree, current PR #1 status, relevant review discussions, and remote refs. Preserve unrelated work; do not reset, force-push, or bypass protections.

Known references, to VERIFY rather than assume:
- Original showcase baseline: `ac854cea3d554f34f39ca9f91a3197ad422b79ee`.
- Last inspected PR #1 head: `01ab16128ecf6580321d6d0c7e5e6b076ca15294`.

You are authorized to finish and merge PR #1 as the accepted round-two checkpoint, after checking its current changes and relevant tests and resolving any actual blocking issue. Do not expand its implementation into round three.

Before merging, make the smallest necessary provenance correction: the root/Astra documentation and relevant showcase explanation must distinguish the original attempt and historical media from the continuing application. Keep an explicit link to the original commit. Fix present-tense claims that the current Astra source is unchanged. Do not relabel historical evidence, invent session settings, regenerate films, duplicate applications, or redesign the catalog. Record the owner's acceptance accurately in the PR discussion or closeout; do not fabricate an independent review.

If PR #1 is already merged, verify the accepted work is in main and skip duplicate closeout. After the checkpoint is merged, start `round3/astra-bank-breach` from updated main; use a non-conflicting suffix if needed. Record that exact round-three baseline.

Commit and push round-three work and open ONE new PR against main. Leave it unmerged for owner review. No deployments. If permissions or another genuine blocker prevent the checkpoint merge, report it and do not bypass protections or silently create a stacked PR. Local round-three work may proceed from the verified accepted head, with the dependency recorded, until a correctly based PR can be opened.

## Establish the baseline, then get on with building

Read the root and Astra READMEs, original brief/SPEC, and `evidence/round2-bank/ROUND-TWO.md`. Inspect the bank construction, physics, targeting, history integration, and relevant tests. Read additional code where needed; do not turn this into a repository-wide audit.

From the repository root:

    node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
    npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test

Verify the runtime requirements and local address; the existing default is `http://127.0.0.1:4173`. Root-level npm scripts are not the Astra suite.

Run the accepted bank and capture a short baseline of the front hall area: intact, a localized native ball hit, a follow-up hit, and the exposed aftermath. Use reproducible framing and inputs for the later comparison. Existing round-two captures can supplement this but are not automatically matched comparisons.

## The commission: a place behind the façade

The central player experience should be:

> I can see a real banking hall through the front of the bank. I break through its glazing and surrounding construction. The opening exposes the room; falling material and further impacts disturb its contents. Different materials respond differently. A second hit acts on the changed scene, and rewind reconstructs that particular event.

Concentrate on the front ground-floor banking hall and the architecture needed to make that experience coherent. This is a complete room-scale experience, not one isolated pane and not an entire furnished skyscraper.

### A hall worth revealing

Preserve the bank's warm stone architecture, bright stylized district, scale, and established localized failure. Compose an attractive, recognizable banking space with convincing depth, floor/wall thickness, and intentional placement of furnishings. A teller counter and a compact selection of furniture, equipment, and paper/cash details should make it feel like a bank rather than a generic room. Choose a coherent design; this is not a quota of props.

Make it readable through the glazing and especially through a damaged opening using the existing orbit/pan/zoom controls. Let the normal exterior view benefit too. Do not hide the entire improvement behind an unavailable camera, a cutaway toggle, or a separately lit showroom. Modest lighting/material adjustments are allowed; do not restyle the whole world to make a flattering capture.

Important objects must exist before impact. Broken walls should reveal the room that was behind them, not spawn a replacement interior. Avoid an indestructible inner box, paper-thin exposed surfaces, floating furnishings, and contents embedded in structure.

### Glass, stone, and contents should have different fates

Make a targeted window hit produce convincing glass failure rather than simply releasing a few large rectangular panes. Aim for visible, impact-related fracture and shards, with framing and nearby stone responding differently. Choose a browser-friendly approach: prepared patterns and bounded small fragments are acceptable; a scientific crack solver is not required.

Material distinctions must read in the motion and aftermath, not only in colors. Heavy architectural pieces should not behave like paper; paper should not behave like stone. Select a few memorable interactions and execute them well rather than superficially simulating every possible object.

Furniture and equipment should be displaced, tipped, damaged, or broken when the event actually reaches them. Loose contents can scatter from plausible sources. Do not launch every prop at once because a generic demolition event fired. Decorative motion cannot substitute for contact where contact is central to the scene.

The ball must be able to enter a cleared opening and interact with reachable contents instead of hitting an invisible original façade. Address targeting and collision integration where necessary, while preserving sensible existing charge placement and player controls. Do not add a new manual prop-editing interface.

### The second hit matters

A first hit must be able to leave an interesting partially damaged scene. A subsequent hit should interact with what remains: retained glazing, a weakened frame, exposed furniture, or loosened construction. Demonstrate a second location or angle so the result is not a single staged trick.

Retain round two's local structural consequences. The hall must also survive inspection during a larger bank collapse: do not improve a small window demonstration while breaking the surrounding destruction. Significant architecture and furniture should remain recognizable in the aftermath; fine particles can be bounded. Do not hide missing interactions behind overwhelming dust or vanishing important objects.

No fixed breach animation, invisible easy-collapse mode, scripted destruction timer, or camera-dependent physics. Approximation is welcome; an unresponsive spectacle is not.

### This actual event must rewind

Include new fracture, attachment, object, motion, random, and lifetime state needed by the existing history. Rewind must restore which pieces broke and where the contents went—not replay a fresh random scattering. Earlier snapshots must remain immutable.

Preserve replay of retained history, a different future after a new action in the past, the rolling minute, and permanent pristine rebuild. Repeated hits or rebuilds must not duplicate contents or repeatedly award the same destroyed mass.

## Implementation freedom

Own the technical approach. You may replace bank-local assumptions and add focused modules where needed. Necessary shared integration changes are allowed, with regression checks. Do not freeze a bad representation just to minimize the diff.

Keep the procedural, self-contained, offline application and pinned Three.js runtime. Do not introduce downloaded art packs, paid services, runtime network calls, or a new engine. No generalized building/asset framework, other-building rollout, new editor, walk-through mode, mission system, atom-scale simulation, or complete bank inventory.

Keep the player interface compact. Details should be authored and tuned by you, not exposed as a dashboard the owner must operate. Preserve the successful bank and surrounding world while expanding this one experience.

## A bounded visual review—not an endless critic loop

Where the environment supports a fresh vision-capable review context, use it twice: once after the baseline capture, once for the complete before/after candidate. Do not commission a new reviewer after every change.

Provide the reviewer ONLY the media, neutral action/time labels, and the review brief below. Do not give it code, diffs, test counts, builder explanations, this implementation prompt, or earlier review conclusions. Do not advertise model names or which final comparison is newer. Give comparable evidence for both versions. The builder retains responsibility for interpreting recommendations and technical feasibility.

Reviewer brief:

> You are a demanding visual director for a bright, stylized demolition world. The intended experience is to breach a convincing bank, reveal its banking hall, and disturb architecture and contents in materially different, responsive ways. Judge design, placement, materials, motion, damage, interior, and aftermath together. Photorealism is not the required style.
>
> Give at most three important observations, each grounded in a specific image location or recording timestamp. Distinguish visible failure, missing evidence, and a proposed new experience. State what already works and must survive. Fewer findings are welcome.
>
> For the baseline, recommend one high-value emphasis within the banking-hall commission. For a paired result, say which better delivers that experience—or that they are tied/inconclusive—and explain the most consequential improvement or regression. Recommend at most one correction before owner review.
>
> Do not infer source implementation, prescribe architecture, manufacture defects, assign numerical quality scores, or generate an exhaustive backlog. Do not claim timing or motion facts from still images alone. Keep the review short and state uncertainty.

Use the first review to challenge and sharpen this commission, not expand it into unrelated work. Select a coherent direction and proceed without asking the owner to prioritize findings.

Build and inspect a complete candidate. Use the final comparison to make at most one additional focused visual correction pass, then check that correction yourself. Fix actual correctness blockers as necessary, but do not keep reopening artistic scope.

If a genuinely separate media-only reviewer is unavailable, disclose that once, perform your own visual inspection, and continue. Do not call a code-aware self-review independent or build reviewer infrastructure. Save portable evidence for external review instead. Reviewer preference is advisory; it is not owner acceptance.

## Verify the experience proportionally

Use real player inputs for the breach, follow-up hit, larger collapse, and time controls. A camera helper may establish reproducible framing; injecting damage/state is not proof of player interaction. Inspect the result at normal speed as well as slower/frame-by-frame where useful. Use an additional angle, not just the flattering front view.

Run the existing Astra tests and focused checks for newly introduced damage/interaction state and rewind. Preserve safeguards. Check the surrounding world and look for conspicuous overlap, unreachable targets, missing contents, major slowdown, or runaway memory during representative repeated play. Report the actual environment and observed limits; no sprawling performance campaign or unsupported hardware claims.

Do not substitute tests for visual judgment. Do not stop at a gray-box room, intact-only render, first passing suite, or an uninspected first implementation. Preserve what worked when a revision regresses it.

## Lightweight evidence and handoff

Use a new directory such as `evidence/round3-hall/`; leave historical captures and notes untouched.

Deliver a small review packet:
- Matched before/after intact and breached views, plus one useful second-angle view.
- Short baseline and candidate recordings using comparable native actions. Show the candidate's initial breach, follow-up consequence, and settled aftermath at normal speed; include a brief replay/rewind demonstration, separately only when needed. Use real timestamps, not a recorder that compresses idle time.
- One modest timestamped frame strip extracted from actual candidate footage, so a reviewer can inspect event progression even when video transfer is awkward.
- One short `REVIEW.md`: exact baseline/result references, inputs/cameras, media timing, tests actually run, reviewer observations and any correction, what improved, and remaining limitations. Record session model/reasoning only when verified; the directory's historical label is not evidence. Retain this exact commission as `FOLLOW-UP.md`.

Reuse working capture tools where practical. Do not create a capture service, CI packaging project, or a second independent runtime verification campaign. Do not generate illustrations and present them as game captures.

Also make an evidence-only `bank-breach-review.zip` from the selected media and short notes, and report its exact local path so the owner can attach it to ChatGPT. No source checkout, dependencies, node_modules, old evidence archive, or redundant intermediate captures. Do not commit the ZIP as a duplicate of already committed media.

Finish with the checkpoint merge status, the new unmerged PR, result commit, launch instructions, the most revealing actions to try, direct evidence paths, and the ZIP path. Explain plainly what changed and what is still disappointing. Do not claim a quality multiplier, verified session settings you do not have, or owner acceptance of round three.

The standard: the bank is no longer merely an elaborate exterior that crumbles. Breaking into it reveals a coherent place, and continuing to destroy it produces new, readable consequences worth watching and replaying.
