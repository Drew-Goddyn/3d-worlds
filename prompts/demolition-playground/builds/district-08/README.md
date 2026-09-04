# District 08 — Demolition Rewind

A standalone, entirely procedural Three.js demolition playground. Swing a crane-mounted wrecking ball, place timed charges on structural members, trigger material-specific collapses, slow the action to 10%, and scrub or rewind the recorded simulation back to a pristine downtown district.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by the development server.

## Controls

- Drag / scroll: orbit, pan, and zoom the free camera.
- `A` / `D`: rotate the crane.
- `W` / `S`: hoist or lower the wrecking ball.
- `Space`: add swing momentum; `Shift` + `Space` kicks the opposite direction.
- `1` / `2`: switch between wrecking ball and charge placement.
- Click a structure in charge mode: attach a charge, up to six.
- `F`: fire placed charges in a staggered sequence.
- `T`: hold for 10% time; the SLOW control also toggles it.
- `R`: hold to rewind; the timeline supports direct scrubbing.

## Architecture

- `app/playground/city.ts`: procedural district, structural assemblies, crane, and ambient actors.
- `app/playground/simulation.ts`: coarse structural damage, rigid-piece motion, chain reactions, and the 60-second snapshot ring.
- `app/playground/effects.ts`: deterministic timeline-addressed dust, debris, glass, shock, and water effects.
- `app/playground/DemolitionPlayground.tsx`: Three.js runtime, camera, tools, controls, scoring, and integration.
- `AGENTS.md`: the durable Sol/Terra/Luna collaboration and ownership workflow.

The simulation intentionally treats columns, beams, floors, and facade panels as physical units while using instancing and pooled effects for visual density. Decorative bricks and windows are detail, not thousands of permanently awake rigid bodies.
