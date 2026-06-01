const assert = require("node:assert/strict");
const { before, test } = require("node:test");

let previewHelpers;

const baseRequest = {
  width: 960,
  height: 540,
  shapes: 50,
  shapeTypes: ["circle", "rectangle"],
  colorPalette: "mixed",
  background: {
    type: "solid",
    colors: ["#101820"],
    direction: "diagonal",
  },
  generationType: "shapes",
  seed: "preview-seed",
  options: {},
};

const generator = {
  id: "shapes",
  category: "geometry",
};

before(async () => {
  previewHelpers = await import("../src/shared/previewOrchestration.mjs");
});

test("preview request serialization is stable for equivalent objects", () => {
  const reordered = {
    seed: "preview-seed",
    generationType: "shapes",
    background: {
      direction: "diagonal",
      colors: ["#101820"],
      type: "solid",
    },
    colorPalette: "mixed",
    shapeTypes: ["circle", "rectangle"],
    shapes: 50,
    height: 540,
    width: 960,
    options: {},
  };

  assert.equal(
    previewHelpers.serializePreviewRequest(baseRequest),
    previewHelpers.serializePreviewRequest(reordered),
  );
});

test("preview render mode respects auto preview and renderer capabilities", () => {
  assert.equal(
    previewHelpers.choosePreviewRenderMode({
      autoPreview: false,
      capabilities: null,
      generator,
      request: baseRequest,
    }),
    "manual",
  );
  assert.equal(
    previewHelpers.choosePreviewRenderMode({
      autoPreview: true,
      capabilities: {
        preferredMode: "webgl2",
        webgl2: { available: true },
      },
      generator,
      request: baseRequest,
    }),
    "webgl2",
  );
  assert.equal(
    previewHelpers.choosePreviewRenderMode({
      autoPreview: true,
      capabilities: {
        preferredMode: "webgl2",
        webgl2: { available: true },
      },
      forceServer: true,
      generator,
      request: baseRequest,
    }),
    "server-cpu",
  );
});

test("preview debounce increases for expensive requests", () => {
  assert.equal(previewHelpers.previewDebounceMs(baseRequest, generator), 220);
  assert.equal(
    previewHelpers.previewDebounceMs(
      { ...baseRequest, shapes: 3000 },
      generator,
    ),
    420,
  );
  assert.equal(
    previewHelpers.previewDebounceMs(baseRequest, {
      ...generator,
      category: "fractal",
    }),
    420,
  );
});

test("preview size capping preserves aspect ratio within budget", () => {
  assert.deepEqual(
    previewHelpers.capPreviewSize({ width: 3840, height: 2160 }),
    { width: 960, height: 540 },
  );
  assert.deepEqual(
    previewHelpers.capPreviewSize({ width: 1440, height: 2560 }),
    { width: 540, height: 960 },
  );
  assert.deepEqual(previewHelpers.capPreviewSize(null), {
    width: 960,
    height: 540,
  });
});

test("preview metrics are compact and deterministic", () => {
  assert.deepEqual(
    previewHelpers.createPreviewMetrics({
      elapsedMs: 12.345,
      mode: "webgl2",
      request: baseRequest,
    }),
    {
      elapsedMs: 12.3,
      mode: "webgl2",
      resolution: "960 x 540",
      seed: "preview-seed",
    },
  );
});
