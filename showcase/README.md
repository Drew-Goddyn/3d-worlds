# Attempt provenance

This catalog records the settings used to create each artifact. It does not relabel an old build when a later administrative turn uses a different model or reasoning effort.

## Shared prompt

All three original demolition prompt attachments were compared byte for byte on September 4, 2026:

- Length: **6,308 bytes**.
- SHA-256: `934156d73fa6451150d8c13da45465eee6621658e7d0e8af46a843826dd2f8a7`.
- Public copy: [demolition playground prompt](../prompts/demolition-playground.md).

## Recovered settings

| Artifact | Creation settings | Evidence and qualifications |
| :--- | :--- | :--- |
| Demolition Site | `gpt-5.5` / `xhigh` | Creation and refinement turns record this pair. The build went through a planning stage, implementation, requested polish, and a separate adversarial review. Initial commit: `be95634`; folder relocation: `aeeee89`. |
| District 08 | `gpt-5.6-sol` / `ultra` | Creation and July follow-ups record this pair; committed as `67590c3`. A later August 17 turn used `xhigh` to package a ZIP, not to generate this committed build. The workflow named Terra/Luna roles, but the recovered helper execution contexts also identify `gpt-5.6-sol` / `ultra`; role names are not evidence that different models ran. |
| Demolition District | `gpt-6-astra` / `ultra` | The implementation turn records this pair; committed as `f06437f`. Later `xhigh` turns handled remote/public-repository administration. |

The evidence source is the local Codex `turn_context` metadata correlated with user requests, working directories, and commits. Private task transcripts are not included in this public repository. The labels above describe the lead build model; they do not imply that every activity across the repository's lifetime used that configuration.

## How to read the comparison

The creative brief matches exactly. The surrounding conditions do not: planning, follow-up requests, tool availability, helper agents, verification effort, and total iteration time differed. No attempt was rebuilt or modified to improve its position in this showcase. Screenshots show the current committed artifacts in their initial view; they are not synthetic mockups.

Existing verification reports belong to their individual builds and environments. In particular, the first build's historical verification script includes an author-local output directory; it is retained as part of that artifact and is not advertised as a portable showcase-wide test command. The newer build's measured frame rates are local observations, not cross-model benchmark scores.

## Catalog fields

[attempts.json](attempts.json) groups attempts by an exact prompt and records their folder, creation commit, lead model, reasoning effort, screenshot, and local launch instructions. Use `unverified` rather than guessing when provenance cannot be recovered.
