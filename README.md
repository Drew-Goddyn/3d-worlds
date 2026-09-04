# 3D Worlds

**One prompt. Multiple builds.**

A showcase of independent, AI-built browser worlds: the same creative brief, tried with different models and reasoning settings. Each build keeps its own implementation, controls, dependencies, and rough edges.

Each prompt has a folder containing its original brief, independent builds, and previews:

```text
prompts/
  demolition-playground/
    PROMPT.md
    builds/
      gpt-5.5-xhigh/
      gpt-5.6-sol-ultra/
      gpt-6-astra-ultra/
    previews/
```

## Prompt 01 · Demolition playground

A sunlit downtown district built to be destroyed—and rebuilt. Wrecking cranes, demolition charges, structural collapse, slow motion, and a scrubbable rewind.

**[Browse this prompt and its builds →](prompts/demolition-playground/)** · [Read the complete original prompt](prompts/demolition-playground/PROMPT.md)

| Build | Lead model | Reasoning | Created | Source |
| :--- | :--- | :--- | :--- | :--- |
| [Demolition Site](#demolition-site) | GPT-5.5 | xhigh | July 7, 2026 | [Browse](prompts/demolition-playground/builds/gpt-5.5-xhigh/) |
| [District 08](#district-08) | GPT-5.6 Sol | ultra | July 9, 2026 | [Browse](prompts/demolition-playground/builds/gpt-5.6-sol-ultra/) |
| [Demolition District](#demolition-district) | GPT-6 Astra | ultra | September 4, 2026 | [Browse](prompts/demolition-playground/builds/gpt-6-astra-ultra/) |

The three original prompt attachments have the same SHA-256 hash. Model and reasoning labels were recovered from the creation turns in local Codex records, rather than inferred from appearance or the task's latest settings. [Provenance and comparison notes](showcase/README.md) · [Machine-readable attempt catalog](showcase/attempts.json)

These were iterative coding sessions with different follow-up instructions, tools, and agent workflows. They are a showcase of resulting artifacts, not a controlled model benchmark or a ranking.

### Demolition Site

**GPT-5.5 · xhigh**

[![Demolition Site, generated with GPT-5.5 at xhigh reasoning](prompts/demolition-playground/previews/demolition-site.png)](prompts/demolition-playground/builds/gpt-5.5-xhigh/)

The earliest attempt: an unbundled Three.js sandbox with a compact control strip. Its original adversarial review is [preserved with the build](prompts/demolition-playground/builds/gpt-5.5-xhigh/docs/adversarial-review.md).

From the repository root:

```sh
PORT=4174 node prompts/demolition-playground/builds/gpt-5.5-xhigh/server.mjs
```

Open **http://127.0.0.1:4174**. Requires a current Node.js installation and internet access for the pinned Three.js browser imports. [Build documentation](prompts/demolition-playground/builds/gpt-5.5-xhigh/README.md)

### District 08

**GPT-5.6 Sol · ultra**

[![District 08, generated with GPT-5.6 Sol at ultra reasoning](prompts/demolition-playground/previews/district-08.png)](prompts/demolition-playground/builds/gpt-5.6-sol-ultra/)

A separate implementation with a styled district, crane controls, material effects, and timeline playback. The task requested distinct systems, experience, and executive roles; the recovered execution records identify Sol for the lead and the recorded helpers.

From the repository root, with **Node.js 22.13 or newer**:

```sh
npm --prefix prompts/demolition-playground/builds/gpt-5.6-sol-ultra ci
npm --prefix prompts/demolition-playground/builds/gpt-5.6-sol-ultra run dev -- --port 4175
```

Open **http://localhost:4175**. [Build documentation](prompts/demolition-playground/builds/gpt-5.6-sol-ultra/README.md)

### Demolition District

**GPT-6 Astra · ultra**

[![Demolition District, generated with GPT-6 Astra at ultra reasoning](prompts/demolition-playground/previews/demolition-district.png)](prompts/demolition-playground/builds/gpt-6-astra-ultra/)

Eight downtown buildings, an aimed wrecking crane, staged charges, source-geometry fragments, individual glass panes, a bursting water tank, and sixty seconds of reversible history. Three.js is vendored locally; no installation or runtime network access is needed.

From the repository root:

```sh
node prompts/demolition-playground/builds/gpt-6-astra-ultra/server.mjs
```

Open **http://127.0.0.1:4173**. [Build documentation](prompts/demolition-playground/builds/gpt-6-astra-ultra/README.md) · [Recorded verification](prompts/demolition-playground/builds/gpt-6-astra-ultra/evidence/verification.json)

```sh
npm --prefix prompts/demolition-playground/builds/gpt-6-astra-ultra test
```

## Adding another attempt

Create `prompts/<prompt-id>/PROMPT.md` for a new brief, or reuse the existing prompt folder when the brief matches exactly. Put each independent attempt in `prompts/<prompt-id>/builds/<model>-<reasoning>/` and its screenshot in the same prompt’s `previews/` folder. Use the verified creation settings in the folder name; add an attempt suffix for repeated runs of the same configuration. Save the exact prompt, record the model and reasoning setting **at build time**, note additional instructions or follow-up changes, and add an entry to [the catalog](showcase/attempts.json) with a real screenshot and a working local launch command. Group attempts by their shared prompt; keep prior outputs intact.

All previews above are actual browser captures at 1440 × 900. Existing root `npm run dev`, `check`, and `verify` scripts still belong to the first Demolition Site build; they are not aggregate checks for the showcase.
