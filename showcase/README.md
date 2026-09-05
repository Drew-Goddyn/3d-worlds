# Attempt provenance

This catalog records the settings used to create each artifact. It does not relabel an old build when a later administrative turn uses a different model or reasoning effort.

## Shared prompt

All three original demolition prompt attachments were compared byte for byte on September 4, 2026:

- Length: **6,308 bytes**.
- SHA-256: `934156d73fa6451150d8c13da45465eee6621658e7d0e8af46a843826dd2f8a7`.
- Public copy: [demolition playground prompt](../prompts/demolition-playground/PROMPT.md).

## Recovered settings

| Artifact | Creation settings | Evidence and qualifications |
| :--- | :--- | :--- |
| Demolition Site | `gpt-5.5` / `xhigh` | Creation and refinement turns record this pair. The build went through a planning stage, implementation, requested polish, and a separate adversarial review. Initial commit: `be95634`; folder relocation: `aeeee89`. |
| District 08 | `gpt-5.6-sol` / `ultra` | Creation and July follow-ups record this pair; committed as `67590c3`. A later August 17 turn used `xhigh` to package a ZIP, not to generate this committed build. The workflow named Terra/Luna roles, but the recovered helper execution contexts also identify `gpt-5.6-sol` / `ultra`; role names are not evidence that different models ran. |
| Demolition District | `gpt-6-astra` / `ultra` | The implementation turn records this pair; committed as `f06437f`. Later `xhigh` turns handled remote/public-repository administration. |

The evidence source is the local Codex `turn_context` metadata correlated with user requests, working directories, and commits. Private task transcripts are not included in this public repository. The labels above describe the lead build model; they do not imply that every activity across the repository's lifetime used that configuration.

## How to read the comparison

The creative brief matches exactly. The surrounding conditions do not: planning, follow-up requests, tool availability, helper agents, verification effort, and total iteration time differed. No attempt was rebuilt or modified to improve its position in this showcase. Screenshots show the original showcase artifacts in their initial view; they are not synthetic mockups.

Existing verification reports belong to their individual builds and environments. In particular, the first build's historical verification script includes an author-local output directory; it is retained as part of that artifact and is not advertised as a portable showcase-wide test command. The newer build's measured frame rates are local observations, not cross-model benchmark scores.

## Recorded comparison previews

**[Watch the side-by-side preview](https://github.com/Drew-Goddyn/3d-worlds/releases/download/demolition-demo-v1/demolition-comparison.mp4)** · **[Download the synchronized viewer](https://github.com/Drew-Goddyn/3d-worlds/releases/download/demolition-demo-v1/demolition-viewer.zip)** · [All release assets](https://github.com/Drew-Goddyn/3d-worlds/releases/tag/demolition-demo-v1)

These are labeled previews. Astra’s charges chapter includes unexplained capture holds up to 100 ms; native presentation between captures is unknown. Do not use the films for FPS or performance ranking. These films and preview images document the [original showcase checkpoint](https://github.com/Drew-Goddyn/3d-worlds/tree/ac854cea3d554f34f39ca9f91a3197ad422b79ee). The Astra application continues to evolve; its current source includes the accepted round-two bank improvement. Historical media and creation labels remain unchanged.

The four films use shared chapter boundaries and matched camera framing. Native automatic/manual charge placement, misses, destruction and rewind semantics are retained. Independent review verified unchanged original sources, native controls, marker timing, video format, complete normal-speed playback and the offline viewer. The strict continuity review remains inconclusive; the user explicitly authorized publication with that limitation disclosed.

[Evidence archive](https://github.com/Drew-Goddyn/3d-worlds/releases/download/demolition-demo-v1/demolition-evidence.zip) · [Release metadata](demo-release.json) · [Checksums](https://github.com/Drew-Goddyn/3d-worlds/releases/download/demolition-demo-v1/SHA256SUMS).

## Catalog fields

[attempts.json](attempts.json) groups attempts by an exact prompt and records their folder, creation commit, lead model, reasoning effort, screenshot, and local launch instructions. Use `unverified` rather than guessing when provenance cannot be recovered.
