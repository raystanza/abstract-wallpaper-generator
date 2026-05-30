# Architecture

`abstract-wallpaper-generator` is a Node.js and Express application that renders abstract wallpaper images with the `canvas` package. The browser UI is static HTML, CSS, and JavaScript served from `public/`.

## Runtime Flow

1. The browser loads the creative workspace from `public/index.html`.
2. `public/script.js` requests generator metadata from `GET /api/generators`.
3. The user selects a generator, resolution, palette, detail level, optional seed, and any generator-specific controls.
4. The browser posts JSON to `POST /api/generate`.
5. `index.js` normalizes request fields and passes them to the shared generation core.
6. `src/generation/validation.js` validates dimensions, detail, palette, seed, shape types, and generator ID.
7. `src/generation/renderWallpaper.js` creates a canvas, installs deterministic randomness for the render, invokes the selected generator, and returns a PNG buffer.
8. The API returns image bytes directly with metadata headers for filename, generator, palette, resolution, seed, and render time.
9. The UI creates an object URL for preview and uses the API filename header for download.

The API returns image bytes for normal browser previews so stale generated files do not accumulate. Direct programmatic generation can still pass an explicit `outputFile`; in that case the shared renderer writes the PNG to disk after rendering.

## Server API

### `GET /api/generators`

Returns public generator metadata. Render functions are intentionally omitted.

```json
{
  "generators": [
    {
      "id": "shapes",
      "name": "Shapes",
      "description": "Composed geometric layers over a palette backdrop...",
      "category": "geometry",
      "parameters": []
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
  "generationType": "flow-field",
  "seed": "portfolio-demo"
}
```

Successful responses use `Content-Type: image/png` and include:

- `X-Wallpaper-Filename`
- `X-Wallpaper-Generator`
- `X-Wallpaper-Palette`
- `X-Wallpaper-Resolution`
- `X-Wallpaper-Seed`
- `X-Generation-Time-Ms`

Invalid requests return structured JSON:

```json
{
  "error": "Invalid wallpaper generation request.",
  "details": ["width must be an integer between 128 and 7680."]
}
```

`POST /generate` remains as a compatibility alias for older UI or script callers.

## Generation Core

The generation core is intentionally small and modular:

- `src/generation/validation.js` validates and normalizes request input.
- `src/generation/renderWallpaper.js` owns canvas creation, seeded render execution, buffer creation, and optional file output.
- `src/generation/palettes.js` defines named palette data.
- `src/generation/color.js` provides palette sampling, interpolation, and conversion helpers.
- `src/generation/output.js` centralizes safe filename and output directory helpers.
- `src/random.js` provides deterministic random number generation and a compatibility bridge for older helpers that still use `Math.random()`.

## Generator Contract

Generators are registered in `src/generators/index.js`.

Each registry entry should include:

- `id`: stable API identifier.
- `name`: UI display name.
- `description`: short explanation for the UI and docs.
- `category`: grouping such as `fractal`, `texture`, `algorithmic`, or `simulation`.
- `parameters`: lightweight UI metadata.
- `render`: drawing function.

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
    palette,
    generationType,
    seed,
    rng,
    options,
  },
) {}
```

Generators should use `rng` for random choices, sample from the provided `palette`, respect `width` and `height`, and keep runtime bounded for common wallpaper sizes.

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
