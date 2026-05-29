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
- `fractal-tree` - recursive branching structure with palette depth.
- `ice` - crystalline shard texture using the selected palette.
- `julia-set` - bounded Julia fractal with smooth palette coloring.
- `koch-snowflake` - framed recursive snowflake with palette strokes.
- `mandelbrot-set` - bounded Mandelbrot detail region with smoother coloring.
- `shapes` - composed geometric layers with controlled scale and opacity.
- `sierpinski-triangle` - recursive triangular subdivision with palette depth.
- `snow` - snowflake crystal field with seeded rotation.
- `water` - concentric ripple fields over a palette-water backdrop.
- `waves` - layered sinusoidal wave fields.

Generator metadata and registration live in `src/generators/index.js`. The current frontend still posts to the legacy-compatible `/generate` route, and generator metadata is available at `/api/generators`.

## Notes

- Generated wallpapers are written under `output/`, which is ignored by git.
- `package-lock.json` is intentionally not used; pnpm is the package manager for this project.
- The old README described CLI flags for `node index.js`, but the current `index.js` starts the web server. CLI support can be reintroduced later as a dedicated command if needed.
