# District 08 agent workflow

This folder is a standalone project. Do not inspect, import from, or reference sibling projects in `3d-worlds`.

## Sol: executive lane

Sol owns the brief, product priorities, architecture, shared contracts, task boundaries, integration, browser/build gates, and final decisions. Sol should keep the visible toy coherent and may reject work from either implementation lane when it weakens the first-frame city, the destruction loop, performance, or rewind fidelity.

## Terra: systems lane

Use Terra for structural simulation, state recording, numerical stability, collision/damage propagation, performance budgets, deterministic behavior, and focused verification. Give Terra a stable typed contract and a bounded module. Terra should return measurements, edge cases, and integration caveats rather than redesigning the experience.

## Luna: experience lane

Use Luna for procedural modeling, materials, lighting, composition, scene density, cinematic effects, compact interaction details, and rapid visual variations. Give Luna the world scale, performance envelope, and stable scene contracts. Luna should preserve simulation hooks and never substitute decorative animation for the structural model.

## Working sequence

1. Sol freezes the user-facing priorities, world scale, types, and file ownership.
2. Terra and Luna implement non-overlapping modules in parallel.
3. Sol integrates those modules, resolves contract mismatches, and owns interaction/UI code.
4. Terra reviews failure modes and performance; Luna reviews visual hierarchy and spectacle.
5. Sol runs the complete build and interaction gates and decides whether the result is shippable.

## Non-negotiable project rules

- All city art is procedural; do not add external models, textures, images, or fonts.
- Import Three.js only as `three` or `three/addons/...`. Keep the import map ahead of module execution and pin both mappings to the same Three.js version.
- Structural simulation runs on coarse assemblies. Instancing creates visual density; never turn every decorative brick into an always-awake rigid body.
- Rewind is a simulation-state feature, not a video trick. Any new destructive state must be recordable and restorable.
- Keep the first frame bright, detailed, legible, and immediately playable. Avoid title screens, tutorial modals, and dashboard chrome.
