# Abstract Wallpaper Generator

Generate abstract wallpapers with a Node.js server, the `canvas` drawing API, and a Vite-powered React studio. The current app serves a creator workspace for choosing a generator and inspecting API-backed metadata, while the existing generation API returns PNG previews for download.

## Prerequisites

- Node.js 22.13 or newer
- pnpm 11.x

This project is pnpm-first. Do not use npm to install dependencies. The pinned pnpm version requires Node.js 22.13 or newer.

## Setup

```sh
git clone https://github.com/raystanza/abstract-wallpaper-generator.git
cd abstract-wallpaper-generator
pnpm install
```

## Development

Start the full development workflow:

```sh
pnpm run dev
```

This runs the Express API on port 3000 and the Vite React app on port 5173. Open:

```text
http://localhost:5173
```

Run the servers separately when needed:

```sh
pnpm run dev:server
pnpm run dev:web
```

Build the frontend for production:

```sh
pnpm run build
```

After building, start the Express server without file watching:

```sh
pnpm start
```

Then open:

```text
http://localhost:3000
```

## UI Workflow

The React app opens directly into the wallpaper studio foundation:

1. Loads generator metadata from `GET /api/generators`.
2. Shows the available generator selector and selected generator details.
3. Displays API connection status and a preview workspace placeholder.

The existing generation API still returns image bytes directly, so normal API preview usage does not leave generated files behind. Rich React controls and live preview orchestration will build on this foundation.

## API Usage

List available generators:

```sh
curl http://localhost:3000/api/generators
```

Generate a PNG through the API:

```sh
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "width": 1280,
    "height": 720,
    "shapes": 40,
    "colorPalette": "ocean",
    "background": {
      "type": "linear-gradient",
      "colors": ["#101820", "#243B55"],
      "direction": "diagonal"
    },
    "generationType": "flow-field",
    "seed": "demo-seed"
  }' \
  --output wallpaper.png
```

Successful generation responses use `Content-Type: image/png` and include headers such as `X-Wallpaper-Filename`, `X-Wallpaper-Seed`, and `X-Generation-Time-Ms`. Invalid requests return structured JSON with an `error` string and a `details` array.

## Verification

Run the baseline checks:

```sh
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm test
```

Run all current verification checks:

```sh
pnpm run verify
```

Format the repository with:

```sh
pnpm run format
```

## Current Scripts

- `pnpm start` - starts the Express server with Node.js.
- `pnpm run dev` - starts the Express API and Vite React app together.
- `pnpm run dev:server` - starts the Express server through `nodemon`.
- `pnpm run dev:web` - starts the Vite development server.
- `pnpm run build` - builds the React frontend into `dist/`.
- `pnpm run typecheck` - runs TypeScript checks for the frontend.
- `pnpm run lint` - runs JavaScript syntax checks over the server, generation source, and tests.
- `pnpm test` - runs Node's built-in test runner.
- `pnpm run verify` - runs linting, typechecking, frontend build, and tests.
- `pnpm run format` - formats supported files with Prettier.

## Project Structure

```text
abstract-wallpaper-generator
├── index.js                  # Express server entry point
├── package.json              # Project metadata and pnpm scripts
├── pnpm-lock.yaml            # pnpm dependency lockfile
├── index.html                # Vite frontend entry point
├── tsconfig.json             # Frontend TypeScript configuration
├── vite.config.ts            # Vite React config and API proxy
├── docs
│   └── architecture.md        # Technical design and request flow
├── src
│   ├── generateWallpaper.js  # Backward-compatible generation entry point
│   ├── generation            # Validation, output, palettes, and rendering core
│   ├── generators            # Generator registry and individual generators
│   ├── random.js             # Seeded random helpers
│   ├── utils.js              # Legacy shared helper functions
│   └── web                   # Vite React studio foundation
├── dist                      # Production frontend build output, ignored by git
└── dev                       # Modernization prompts and planning docs
```

## Available Generators

The current app includes these generator modules:

- `barnsley-fern` - dense iterated fern points over the selected background.
- `bokeh` - multi-depth blurred light circles with glow.
- `bubbles` - translucent bubble fields with highlights and outlines.
- `fire` - bounded noise-driven heat texture.
- `flow-field` - coherent-noise vector field strokes.
- `fractal-tree` - recursive branching structure with palette depth.
- `ice` - crystalline shard texture using the selected palette.
- `julia-set` - bounded Julia fractal with smooth palette coloring.
- `koch-snowflake` - framed recursive snowflake with palette strokes.
- `mandelbrot-set` - bounded Mandelbrot detail region with smoother coloring.
- `particle-orbits` - simulated particles orbiting seeded attractors.
- `shapes` - composed geometric layers with controlled scale and opacity.
- `sierpinski-triangle` - recursive triangular subdivision with palette depth.
- `snow` - snowflake crystal field with seeded rotation.
- `topographic-contours` - noise-warped elevation contour rings.
- `voronoi-cells` - cellular nearest-site diagram.
- `water` - concentric ripple fields over the selected background.
- `waves` - layered sinusoidal wave fields.
- `circuit-board` - orthogonal trace routing with nodes.

Generator metadata and registration live in `src/generators/index.js`. The frontend reads metadata from `GET /api/generators` and posts generation requests to `POST /api/generate`. The generation endpoint returns PNG bytes directly with response headers for filename, generator, palette, background, resolution, seed, and render time. The legacy-compatible `POST /generate` route remains available as an alias.

Shared frontend/server contract types live in `src/shared/contracts.ts`, with the current JavaScript runtime adapter in `src/shared/generationContract.js`. Public generator metadata includes normalized parameter `kind` values, defaults, and renderer capability data so the React studio can render controls dynamically in later migration prompts.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the server API, request flow, generator contract, output behavior, and testing strategy.

## Notes

- Browser previews are returned directly by the API, so normal UI usage does not accumulate generated files. Direct generation code can still pass an explicit `outputFile`; those generated wallpapers are written under `output/`, which is ignored by git.
- `package-lock.json` is intentionally not used; pnpm is the package manager for this project.
- There is no dedicated CLI command yet; `pnpm start` starts the web server. CLI support can be reintroduced later as a dedicated command if needed.
