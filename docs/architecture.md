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

The Vite entry point is root `index.html`, which loads `src/web/main.tsx`. The React studio opens directly into the creator workspace.

Primary UI regions:

- Top toolbar: project identity, API status, save/export actions.
- Left settings panel: generator selection, canvas settings, dynamic generator controls, palette/background controls, and seed controls.
- Main preview region: WebGL2 or server-rendered preview, refresh action, and compact output status.
- Right inspector: renderer diagnostics, selected generator parameter values, and render-path details.
- Status bar: current output size, palette, and seed.

Local app-owned primitives live in `src/web/components/ui.tsx` and include buttons, icon buttons, fields, sliders, toggles, segmented controls, swatches, panel headers, and status badges. Styling tokens and responsive layout rules live in `src/web/styles/app.css`.

Generator control state is resolved through `src/shared/generatorSettings.mjs` with TypeScript declarations in `src/shared/generatorSettings.d.mts`. The settings object is serializable and contains the selected generator, size, seed, palette, background, render mode, and parameter values. The helper layer resolves defaults from metadata, preserves compatible values during generator switches, clamps impossible sizes and numeric parameters, and creates the `GenerationRequest` sent to preview/export paths.

Preset and sharing helpers live in `src/shared/wallpaperPresets.mjs`. Presets apply through the same settings resolver as manual controls, so applying a preset produces a normal serializable settings object. The studio can copy settings JSON and safely parse pasted JSON through `parseGeneratorSettingsJson()`; invalid imports return errors and do not replace the current settings.

Palette UI metadata lives in `src/shared/paletteCatalog.mjs`. The renderer uses that catalog for visual swatches and WebGL preview palette colors. The server renderer still reads named palettes from `src/generation/palettes.js`, so adding a production palette currently requires updating both files with the same id and colors.

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
- `exportWallpaper()`

## Preview Rendering

The preview renderer foundation lives in `src/web/rendering/`.

Key modules:

- `capabilities.ts`: detects browser renderer support. It checks WebGL2 context creation, max texture size, high precision fragment support, device pixel ratio clamping, OffscreenCanvas support, and informational WebGPU availability.
- `webglPreviewRenderer.ts`: owns the direct WebGL2 shader preview implementation. The first GPU preview is a deterministic abstract waves/noise shader driven by generation request inputs such as seed, palette, background, size, and density.
- `index.ts`: exposes `detectRendererCapabilities()`, `createPreviewRenderer()`, `renderServerPreview()`, and renderer status helpers.
- `src/shared/rendererCapabilities.js`: contains pure capability helpers used by both browser code and Node tests.

Renderer selection is intentionally conservative:

1. Use WebGL2 when detection succeeds.
2. Use `server-cpu` when WebGL2 is unavailable, disabled with `?renderer=server`, or the shader renderer fails.
3. Detect WebGPU only as diagnostics. It is not required and is not used for rendering yet.

The React app disposes WebGL buffers/programs, removes context event listeners, and revokes server preview object URLs when previews are replaced or the component unmounts. Server fallback uses the existing binary `POST /api/generate` path, preserving deterministic generation inputs while GPU preview remains approximate.

### Advanced Shader Generators

The studio includes three modern shader-oriented generators that remain exportable through the server CPU path:

- `domain-warp-noise`: warped simplex-noise texture fields with frequency, warp strength, contrast, and octave controls.
- `moire-interference`: radial moire and optical interference fields with ring frequency, interference, and center-count controls.
- `gradient-field`: seeded mesh-gradient fields with color nodes, softness, turbulence, and contour texture.

Each generator declares `rendering.gpuPreview: true`, `preferredPreviewMode: "webgl2"`, and `exportMode: "server-cpu"`. The WebGL preview shader branches by `generationType` and maps the same high-level request inputs into shader uniforms. The browser GPU preview is intentionally approximate: it matches palette, seed, size, density, and the primary option controls, while final export uses the deterministic CPU renderer in `src/generators/*.js`.

Adding another shader-oriented generator follows the same model:

1. Add a CPU renderer under `src/generators/` so export stays reliable.
2. Register it in `src/generators/index.js` with `scope: "options"` parameters for generator-specific controls.
3. Set rendering metadata only when the WebGL preview shader has a corresponding effect branch.
4. Add at least one preset in `src/shared/wallpaperPresets.mjs`.
5. Add tests for metadata, option validation, and deterministic output.

### Preview Orchestration

Live preview orchestration lives in `src/web/rendering/useWallpaperPreview.ts`, with pure planning helpers in `src/shared/previewOrchestration.mjs`.

Preview flow:

1. The studio serializes the current `GenerationRequest` with stable key ordering.
2. High-frequency control changes are debounced before rendering. Expensive requests, such as high-density or fractal previews, use a longer debounce.
3. Preview dimensions are capped to `MAX_PREVIEW_PIXELS` while preserving the selected output aspect ratio.
4. If auto preview is enabled, the hook selects WebGL2 when browser capability detection supports it; otherwise it uses the server preview path.
5. If auto preview is disabled, settings changes mark the preview as pending until the creator presses refresh.
6. Server fallback uses `AbortController` so newer requests cancel older `POST /api/generate` calls.
7. Each render run has a monotonically increasing run id, preventing stale GPU or server results from replacing newer previews.
8. Server preview object URLs are revoked when replaced and on unmount.

The preview header exposes auto preview, server-forced preview, manual refresh, and seed randomization. The inspector reports renderer mode, preview status, elapsed time, preview resolution, seed, and capability diagnostics. Final export is separate from this preview loop and uses the reliable server CPU path.

WebGL preview canvases are also capped by pixel count after device-pixel-ratio scaling. This keeps large displays and high-DPI devices from allocating oversized live-preview buffers while preserving the visible canvas size.

## Export Pipeline

Final export uses `POST /api/export`, not browser GPU rendering. The endpoint accepts the same deterministic generation inputs as preview plus export metadata:

```json
{
  "format": "png",
  "size": { "width": 3840, "height": 2160 },
  "width": 3840,
  "height": 2160,
  "shapes": 120,
  "shapeTypes": ["circle", "rectangle"],
  "colorPalette": "mixed",
  "background": {
    "type": "solid",
    "colors": ["#101820"],
    "direction": "diagonal"
  },
  "generationType": "shapes",
  "seed": "final-render"
}
```

Supported export format:

- `png`

The response is a binary PNG with `Content-Disposition: attachment`. Export metadata is returned in `X-Wallpaper-Metadata`, including format and renderer:

```json
{
  "generationType": "shapes",
  "width": 3840,
  "height": 2160,
  "colorPalette": "mixed",
  "background": {
    "type": "solid",
    "colors": ["#101820"],
    "direction": "diagonal"
  },
  "seed": "final-render",
  "filename": "shapes_3840x2160_final-render_2026-05-31T12-00-00-000Z.png",
  "elapsedMs": 456.7,
  "format": "png",
  "renderer": "server-cpu"
}
```

The React studio exposes a compact export panel in the inspector. Single export downloads the current settings. Batch export accepts up to 12 seed values and generates one PNG per seed sequentially, avoiding a zip dependency and keeping the UI responsive. Temporary download object URLs are revoked after use and on unmount.

## Creator Workflow

Built-in presets are small, reviewable objects:

```js
{
  id: "tidal-lines",
  name: "Tidal Lines",
  generatorId: "waves",
  size: { width: 2560, height: 1440 },
  seed: "tidal-lines-02",
  seedBehavior: "locked",
  palette: "ocean",
  background: {
    type: "linear-gradient",
    colors: ["#061923", "#0d3b52"],
    direction: "vertical"
  },
  parameters: { shapes: 82 },
  tags: ["waves", "cool", "wide"]
}
```

To add a preset:

1. Add the object to `wallpaperPresets` in `src/shared/wallpaperPresets.mjs`.
2. Use a generator id that appears in `src/generators/index.js`.
3. Keep `parameters` aligned with the generator metadata ids, such as `shapes` or `shapeTypes`.
4. Run `pnpm test`; preset validation checks every built-in preset against current generator metadata.

Seed behavior:

- `locked`: applies the seed and turns on seed lock.
- `fixed`: applies the seed but leaves it editable.
- `random`: clears the seed so the preview/export flow can resolve a fresh seed.

To add a palette:

1. Add the id, name, category, and five colors to `src/shared/paletteCatalog.mjs`.
2. Add the same id and colors to `src/generation/palettes.js` so server generation accepts it.
3. The React palette grid and WebGL preview will pick up the shared catalog entry automatically.

Reproducible settings can be shared from the inspector with Copy JSON. Pasted settings JSON is sanitized through the active generator metadata before it replaces studio state, preserving server-side validation as the final source of truth.

### Local Project State

Project/session persistence is local-first and browser-only. The studio writes the current settings, explicit saved settings, and compact history metadata to `localStorage` under `abstract-wallpaper-generator:project-state:v1`.

History items store:

- id and timestamp.
- generator id.
- sanitized settings snapshot.
- resolved seed.
- renderer mode.
- source (`preview`, `export`, or `manual`).
- favorite flag.
- a lightweight palette thumbnail made from swatch colors.

The app does not store full-resolution exports, generated PNG bytes, or server-side project data in local storage. Preview object URLs remain temporary and are revoked by the preview/export code paths. History is capped at 30 items, with favorites preserved before older non-favorites are trimmed. Clearing history or starting a new session only affects local browser data.

The shared helpers in `src/shared/projectState.mjs` keep this behavior testable:

- `createHistoryItem()`
- `upsertHistoryItem()`
- `limitHistory()`
- `restoreHistorySettings()`
- `serializeProjectState()`
- `parseProjectState()`

Restoring a history item or local session re-sanitizes settings through current generator metadata. If a generator is no longer available, the item is left in history but cannot replace the active settings.

Malformed or outdated local session data is handled as recoverable. The app reports the recovery in the workflow status area, falls back to valid defaults when needed, and rewrites storage with a valid session on the next successful persist. If a browser blocks storage writes, the studio continues to run and reports that local saving is unavailable.

## Accessibility And Resilience

The React entry is wrapped in an app-level error boundary so unexpected component failures show a reloadable error state instead of a blank page. The studio exposes a screen-reader-only live status summary for API, preview, export, and workflow changes. Validation errors use `role="alert"`, and visual status badges include text labels rather than relying on color alone.

Keyboard operation uses native form controls and buttons for generator selection, parameters, seed actions, preview refresh, export, and history actions. The CSS includes visible focus rings and a reduced-motion media query that disables transitions for users who request it.

The API client treats malformed JSON error bodies and corrupted metadata headers as recoverable: it falls back to stable error messages or individual metadata headers instead of throwing unrelated parsing errors.

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

Returns a downloadable PNG rendered by the server CPU path. `format` must be `png`; unsupported formats return `INVALID_GENERATION_REQUEST`. Successful responses include the same wallpaper metadata headers as `POST /api/generate`, plus:

- `X-Wallpaper-Export-Format`
- `X-Wallpaper-Renderer`

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

When adding a parameter to a generator, prefer metadata over custom UI. For example, a generator-level numeric control:

```js
{
  id: "turbulence",
  label: "Turbulence",
  type: "number",
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 35,
  group: "generator"
}
```

A compact advanced option can be scoped for future `options` request payloads:

```js
{
  id: "glow",
  label: "Glow",
  type: "boolean",
  defaultValue: true,
  group: "advanced",
  advanced: true,
  scope: "options"
}
```

Palette, background, seed, density, and shape type controls are rendered from the same metadata model. Only introduce a custom React component when the control needs behavior that cannot be represented by `number`, `boolean`, `select`, `palette`, `background`, `color`, `color-array`, or grouped advanced parameters.

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
