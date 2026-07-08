# Three.js Demolition Playground

Procedural browser demolition toy built from code-only geometry and materials.

## Run

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:4173/`.

## Checks

```sh
npm run check
npm run verify
```

The runtime is intentionally unbundled. `index.html` owns the browser import map for Three.js, and app modules import Three.js only as `three` and `three/addons/...`.

