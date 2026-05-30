# Abstract Wallpaper Generator

Generate abstract wallpapers with a Node.js server, the `canvas` drawing API, and a lightweight browser interface. The current app serves a web UI for choosing a generator, resolution, palette, and shape settings, then returns a generated PNG preview for download.

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

Start the development server with automatic restarts:

```sh
pnpm run dev
```

Start the server without file watching:

```sh
pnpm start
```

Then open:

```text
http://localhost:3000
```

## UI Workflow

The web app opens directly into the wallpaper workspace:

1. Choose a generator from the algorithm selector.
2. Pick a resolution preset or enter a custom width and height.
3. Select a palette and detail level.
4. Optionally enter a seed for reproducible output.
5. Generate a preview and download the PNG.

The preview workflow returns image bytes directly from the API, so normal browser usage does not leave generated files behind.

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
- `pnpm run dev` - starts the Express server through `nodemon`.
- `pnpm run lint` - runs JavaScript syntax checks over server, source, and public scripts.
- `pnpm test` - runs Node's built-in test runner.
- `pnpm run verify` - runs linting and tests.
- `pnpm run format` - formats supported files with Prettier.

## Project Structure

```text
abstract-wallpaper-generator
├── index.js                  # Express server entry point
├── package.json              # Project metadata and pnpm scripts
├── pnpm-lock.yaml            # pnpm dependency lockfile
├── docs
│   └── architecture.md        # Technical design and request flow
├── public                    # Browser UI
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src
│   ├── generateWallpaper.js  # Backward-compatible generation entry point
│   ├── generation            # Validation, output, palettes, and rendering core
│   ├── generators            # Generator registry and individual generators
│   ├── random.js             # Seeded random helpers
│   └── utils.js              # Legacy shared helper functions
└── dev                       # Modernization prompts and planning docs
```

## Available Generators

The current app includes these generator modules:

- `barnsley-fern` - dense iterated fern points over a subtle palette field.
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
- `water` - concentric ripple fields over a palette-water backdrop.
- `waves` - layered sinusoidal wave fields.
- `circuit-board` - orthogonal trace routing with nodes.

Generator metadata and registration live in `src/generators/index.js`. The frontend reads metadata from `GET /api/generators` and posts generation requests to `POST /api/generate`. The generation endpoint returns PNG bytes directly with response headers for filename, generator, palette, resolution, seed, and render time. The legacy-compatible `POST /generate` route remains available as an alias.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the server API, request flow, generator contract, output behavior, and testing strategy.

## Notes

- Browser previews are returned directly by the API, so normal UI usage does not accumulate generated files. Direct generation code can still pass an explicit `outputFile`; those generated wallpapers are written under `output/`, which is ignored by git.
- `package-lock.json` is intentionally not used; pnpm is the package manager for this project.
- There is no dedicated CLI command yet; `pnpm start` starts the web server. CLI support can be reintroduced later as a dedicated command if needed.
