# Architecture

`abstract-wallpaper-generator` is a Node.js and Express application that renders abstract wallpaper images with the `canvas` package. The browser UI is now a Vite-powered React and TypeScript app under `src/web/`.

## Runtime Flow

1. In development, the browser loads the React studio from the Vite dev server at `http://localhost:5173`.
2. Vite proxies API calls such as `GET /api/generators` and `POST /api/generate` to the Express server on port 3000.
3. In production, `pnpm run build` writes the frontend to `dist/`, and Express serves that build output.
4. The React app requests generator metadata from `GET /api/generators`.
5. Existing API callers can post JSON to `POST /api/generate`.
6. `index.js` normalizes request fields and passes them to the shared generation core.
7. `src/generation/validation.js` validates dimensions, detail, palette, background, seed, shape types, and generator ID.
8. `src/generation/renderWallpaper.js` creates a canvas, paints the selected background, installs deterministic randomness for the render, invokes the selected generator, and returns a PNG buffer.
9. The API returns image bytes directly with metadata headers for filename, generator, palette, background, resolution, seed, and render time.

The API returns image bytes for normal browser previews so stale generated files do not accumulate. Direct programmatic generation can still pass an explicit `outputFile`; in that case the shared renderer writes the PNG to disk after rendering.

## Frontend App

The Vite entry point is root `index.html`, which loads `src/web/main.tsx`. The initial React studio is intentionally small: it renders a full-viewport workspace shell, loads generator metadata from the existing API, exposes a generator selector, shows API connection status, and reserves a preview workspace for later live rendering work.

Development commands:

- `pnpm run dev`: runs Express and Vite together.
- `pnpm run dev:server`: runs only Express through `nodemon`.
- `pnpm run dev:web`: runs only Vite with API proxying.
- `pnpm run build`: builds the frontend to `dist/`.
- `pnpm start`: serves the Express API and the built frontend from `dist/`.

The frontend uses typed API helpers in `src/web/lib/apiClient.ts`:

- `getHealth()`
- `getGenerators()`
- `generateWallpaper()`
- `exportWallpaper()`, currently a placeholder until Prompt 10 defines distinct export semantics.

## Server API

API routes are registered in `src/server/apiRoutes.js`. Request normalization for generation lives in `src/server/generationRequest.js`, and structured API error helpers live in `src/server/errors.js`. The server entry remains JavaScript for now; this prompt deliberately prepares the boundary for TypeScript modules without migrating every generator or the Express app.

### Error Format

API errors return JSON with a stable code:

```json
{
  "error": "Invalid wallpaper generation request.",
  "code": "INVALID_GENERATION_REQUEST",
  "details": ["width must be an integer between 128 and 7680."]
}
```

Known codes:

- `INVALID_GENERATION_REQUEST`
- `INVALID_JSON`
- `GENERATION_FAILED`
- `NOT_FOUND`

### `GET /api/health`

Returns server and contract health metadata.

```json
{
  "status": "ok",
  "contractVersion": 1,
  "renderer": "server-cpu"
}
```

### `GET /api/generators`

Returns public generator metadata. Render functions are intentionally omitted.

```json
{
  "generators": [
    {
      "id": "shapes",
      "name": "Shapes",
      "description": "Composed geometric layers over the selected background...",
      "category": "geometry",
      "version": 1,
      "parameters": [],
      "defaults": {
        "size": { "width": 1920, "height": 1080 },
        "generationType": "shapes",
        "shapes": 50,
        "shapeTypes": ["circle", "rectangle"],
        "colorPalette": "mixed",
        "background": {
          "type": "solid",
          "colors": ["#101820"],
          "direction": "diagonal"
        },
        "seed": "",
        "options": {}
      },
      "rendering": {
        "modes": ["server-cpu"],
        "preferredPreviewMode": "server-cpu",
        "exportMode": "server-cpu",
        "gpuPreview": false
      }
    }
  ]
}
```

### `POST /api/generate`

Accepts a JSON generation request and returns a PNG response.

```json
{
  "width": 1920,
  "height": 1080,
  "shapes": 50,
  "shapeTypes": ["circle", "rectangle", "triangle"],
  "colorPalette": "mixed",
  "background": {
    "type": "linear-gradient",
    "colors": ["#101820", "#243B55"],
    "direction": "diagonal"
  },
  "generationType": "flow-field",
  "seed": "portfolio-demo"
}
```

Successful responses use `Content-Type: image/png` and include:

- `X-Wallpaper-Filename`
- `X-Wallpaper-Generator`
- `X-Wallpaper-Metadata`
- `X-Wallpaper-Palette`
- `X-Wallpaper-Background`
- `X-Wallpaper-Resolution`
- `X-Wallpaper-Seed`
- `X-Generation-Time-Ms`

`X-Wallpaper-Metadata` is a JSON header with resolved generation settings and elapsed time:

```json
{
  "generationType": "flow-field",
  "width": 1920,
  "height": 1080,
  "colorPalette": "mixed",
  "background": {
    "type": "linear-gradient",
    "colors": ["#101820", "#243B55"],
    "direction": "diagonal"
  },
  "seed": "portfolio-demo",
  "filename": "flow-field_1920x1080_portfolio-demo_2026-05-30T12-00-00-000Z.png",
  "elapsedMs": 123.4
}
```

Invalid requests return structured JSON:

```json
{
  "error": "Invalid wallpaper generation request.",
  "details": ["width must be an integer between 128 and 7680."]
}
```

`POST /generate` remains as a compatibility alias for older UI or script callers.

### `POST /api/export`

Not implemented yet. Export still uses the existing binary generation path. A distinct export API is reserved for Prompt 10, when high-resolution export and batch-rendering semantics are introduced.

## Generation Core

The generation core is intentionally small and modular:

- `src/generation/validation.js` validates and normalizes request input.
- `src/generation/renderWallpaper.js` owns canvas creation, seeded render execution, buffer creation, and optional file output.
- `src/generation/palettes.js` defines named palette data.
- `src/generation/color.js` provides palette sampling, interpolation, and conversion helpers.
- `src/generation/output.js` centralizes safe filename and output directory helpers.
- `src/random.js` provides deterministic random number generation and a compatibility bridge for older helpers that still use `Math.random()`.

## Generator Contract

Shared cross-boundary TypeScript types live in `src/shared/contracts.ts`. The existing CommonJS server uses `src/shared/generationContract.js` for runtime constants, generator metadata normalization, and option validation while the backend remains JavaScript.

Generators are registered in `src/generators/index.js`.

Each registry entry should include:

- `id`: stable API identifier.
- `name`: UI display name.
- `description`: short explanation for the UI and docs.
- `category`: grouping such as `fractal`, `texture`, `algorithmic`, or `simulation`.
- `parameters`: control metadata normalized into the shared parameter model.
- `render`: drawing function.

Public generator metadata includes the fields above plus:

- `version`: shared metadata contract version.
- `defaults`: normalized default request values for size, generator, density, shape types, palette, background, seed, and generator options.
- `rendering`: renderer capability metadata. The current app reports `server-cpu` for preview and export. Future GPU preview work should add `webgl2` support here without changing the high-level request shape.

### Parameter Model

Parameters use a `kind` field so the React studio can render controls dynamically:

- `number`: has `min`, `max`, `step`, and numeric `defaultValue`.
- `boolean`: has a boolean `defaultValue`.
- `select`: has `options`, `multiple`, and a string or string-array `defaultValue`.
- `text`: has a string `defaultValue` and optional `maxLength`.
- `color`: has a hex color `defaultValue`.
- `color-array`: has color defaults plus `minItems` and `maxItems`.
- `palette`: has palette `options` and a palette-name `defaultValue`.
- `background`: has a normalized background default.
- `group`: can hold child parameters for advanced controls in later prompts.

Current top-level request fields such as `shapes`, `shapeTypes`, `colorPalette`, `background`, and `seed` remain compatible with older API callers. Generator-specific values under `options` are now validated against the shared parameter model, and unsupported option keys are rejected.

Each render function receives the canvas context and one options object:

```js
async function render(
  ctx,
  {
    canvas,
    width,
    height,
    shapes,
    shapeTypes,
    colorPalette,
    background,
    palette,
    generationType,
    seed,
    rng,
    options,
  },
) {}
```

Generators should use `rng` for random choices, sample from the provided `palette` or `colorPalette` for foreground marks, respect the already-painted `background`, and keep runtime bounded for common wallpaper sizes.

## Testing Strategy

The project uses Node's built-in test runner:

- Registry tests verify that metadata is present and render functions are not exposed through public metadata.
- Validation tests cover rejected generator IDs, palettes, dimensions, and other unsafe input.
- Utility tests cover palette helpers, color conversion, seeded randomness, and safe output filenames.
- Render smoke tests generate small PNGs for representative generators without committing image artifacts.
- API tests start the Express app on a random local port and verify metadata, PNG generation, and structured errors.

Exact image snapshots are avoided because many generators are stochastic and visual quality is better judged with seeded smoke tests plus manual review.

## Adding A Generator

1. Create a module in `src/generators/`.
2. Implement the normalized render signature.
3. Use shared color, palette, canvas, and seeded random helpers.
4. Register the generator in `src/generators/index.js`.
5. Add a short README entry.
6. Add or extend a render smoke test if the generator introduces a new algorithmic category.
7. Run `pnpm run verify`.
