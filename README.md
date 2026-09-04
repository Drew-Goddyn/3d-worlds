# 3D Worlds

**One prompt. Multiple builds.**

A showcase of independent, AI-built browser worlds: the same creative brief, tried with different models and reasoning settings. Each build keeps its own implementation, controls, dependencies, and rough edges.

## Prompt 01 · Demolition playground

A sunlit downtown district built to be destroyed—and rebuilt. Wrecking cranes, demolition charges, structural collapse, slow motion, and a scrubbable rewind.

**[Read the complete original prompt →](prompts/demolition-playground.md)**

| Build | Lead model | Reasoning | Created | Source |
| :--- | :--- | :--- | :--- | :--- |
| [Demolition Site](#demolition-site) | GPT-5.5 | xhigh | July 7, 2026 | [Browse](worlds/demolition-site/) |
| [District 08](#district-08) | GPT-5.6 Sol | ultra | July 9, 2026 | [Browse](worlds/demolition-playground/) |
| [Demolition District](#demolition-district) | GPT-6 Astra | ultra | September 4, 2026 | [Browse](demolition-district/) |

The three original prompt attachments have the same SHA-256 hash. Model and reasoning labels were recovered from the creation turns in local Codex records, rather than inferred from appearance or the task's latest settings. [Provenance and comparison notes](showcase/README.md) · [Machine-readable attempt catalog](showcase/attempts.json)

These were iterative coding sessions with different follow-up instructions, tools, and agent workflows. They are a showcase of resulting artifacts, not a controlled model benchmark or a ranking.

### Demolition Site

**GPT-5.5 · xhigh**

[![Demolition Site, generated with GPT-5.5 at xhigh reasoning](showcase/previews/demolition-site.png)](worlds/demolition-site/)

The earliest attempt: an unbundled Three.js sandbox with a compact control strip. Its original adversarial review is [preserved with the build](worlds/demolition-site/docs/adversarial-review.md).

From the repository root:

```sh
PORT=4174 node worlds/demolition-site/server.mjs
```

Open **http://127.0.0.1:4174**. Requires a current Node.js installation and internet access for the pinned Three.js browser imports. [Build documentation](worlds/demolition-site/README.md)

### District 08

**GPT-5.6 Sol · ultra**

[![District 08, generated with GPT-5.6 Sol at ultra reasoning](showcase/previews/district-08.png)](worlds/demolition-playground/)

A separate implementation with a styled district, crane controls, material effects, and timeline playback. The task requested distinct systems, experience, and executive roles; the recovered execution records identify Sol for the lead and the recorded helpers.

From the repository root, with **Node.js 22.13 or newer**:

```sh
npm --prefix worlds/demolition-playground ci
npm --prefix worlds/demolition-playground run dev -- --port 4175
```

Open **http://localhost:4175**. [Build documentation](worlds/demolition-playground/README.md)

### Demolition District

**GPT-6 Astra · ultra**

[![Demolition District, generated with GPT-6 Astra at ultra reasoning](showcase/previews/demolition-district.png)](demolition-district/)

Eight downtown buildings, an aimed wrecking crane, staged charges, source-geometry fragments, individual glass panes, a bursting water tank, and sixty seconds of reversible history. Three.js is vendored locally; no installation or runtime network access is needed.

From the repository root:

```sh
node demolition-district/server.mjs
```

Open **http://127.0.0.1:4173**. [Build documentation](demolition-district/README.md) · [Recorded verification](demolition-district/evidence/verification.json)

```sh
npm --prefix demolition-district test
```

## Adding another attempt

Keep each build in its own folder. Save the exact prompt, record the model and reasoning setting **at build time**, note additional instructions or follow-up changes, and add an entry to [the catalog](showcase/attempts.json) with a real screenshot and a working local launch command. Group attempts by their shared prompt; keep prior outputs intact.

All previews above are actual browser captures at 1440 × 900. Existing root `npm run dev`, `check`, and `verify` scripts still belong to the first Demolition Site build; they are not aggregate checks for the showcase.
