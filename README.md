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
│   ├── generateWallpaper.js  # Current generation orchestration
│   ├── generators            # Individual wallpaper generators
│   └── utils.js              # Shared color/random helpers
└── dev                       # Modernization prompts and planning docs
```

## Available Generators

The current app includes these generator modules:

- `barnsley-fern` - fern-like fractal.
- `bokeh` - blurred light circles with depth.
- `bubbles` - layered bubble forms.
- `fire` - noise-driven fire texture.
- `fractal-tree` - recursive branching structure.
- `ice` - crystalline line texture.
- `julia-set` - Julia set fractal.
- `koch-snowflake` - Koch snowflake fractal.
- `mandelbrot-set` - Mandelbrot set fractal.
- `shapes` - randomized geometric shape composition.
- `sierpinski-triangle` - Sierpinski triangle fractal.
- `snow` - snowflake pattern.
- `water` - ripple pattern.
- `waves` - sinusoidal wave lines.

Generator registration is currently manual in `index.js`. A planned modernization step will move generator metadata and registration into a central registry.

## Notes

- Generated wallpapers are written under `output/`, which is ignored by git.
- `package-lock.json` is intentionally not used; pnpm is the package manager for this project.
- The old README described CLI flags for `node index.js`, but the current `index.js` starts the web server. CLI support can be reintroduced later as a dedicated command if needed.
