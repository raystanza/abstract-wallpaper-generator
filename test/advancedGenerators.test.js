const assert = require("node:assert/strict");
const { test } = require("node:test");

const { listGeneratorMetadata } = require("../src/generators");
const { renderWallpaper } = require("../src/generation/renderWallpaper");
const { ValidationError, validateGenerationInput } = require("../src/generation/validation");

const advancedGeneratorIds = [
  "domain-warp-noise",
  "moire-interference",
  "gradient-field",
];

function metadataFor(id) {
  const metadata = listGeneratorMetadata().find((entry) => entry.id === id);
  assert.ok(metadata, `expected ${id} metadata`);
  return metadata;
}

test("advanced generators expose GPU preview metadata and option schemas", () => {
  for (const id of advancedGeneratorIds) {
    const metadata = metadataFor(id);
    const optionParameters = metadata.parameters.filter(
      (parameter) => parameter.scope === "options",
    );

    assert.equal(metadata.category, "shader");
    assert.equal(metadata.rendering.gpuPreview, true);
    assert.equal(metadata.rendering.preferredPreviewMode, "webgl2");
    assert.equal(metadata.rendering.exportMode, "server-cpu");
    assert.ok(optionParameters.length >= 3);
    assert.ok(
      optionParameters.every((parameter) => parameter.kind === "number"),
      "advanced generator controls should render as dynamic numeric controls",
    );
  }
});

test("advanced generator options are server validated", () => {
  assert.throws(
    () =>
      validateGenerationInput({
        width: 256,
        height: 144,
        shapes: 100,
        colorPalette: "galaxy",
        generationType: "domain-warp-noise",
        seed: "invalid-options",
        options: {
          warpStrength: 99,
        },
      }),
    (error) =>
      error instanceof ValidationError &&
      error.details.some((detail) =>
        detail.includes("options.warpStrength must be a number between 0 and 2"),
      ),
  );
});

test("advanced generators render exportable deterministic png output", async () => {
  for (const id of advancedGeneratorIds) {
    const first = await renderWallpaper({
      width: 320,
      height: 180,
      shapes: 90,
      colorPalette: id === "moire-interference" ? "neon" : "galaxy",
      generationType: id,
      seed: `${id}-deterministic`,
    });
    const second = await renderWallpaper({
      width: 320,
      height: 180,
      shapes: 90,
      colorPalette: id === "moire-interference" ? "neon" : "galaxy",
      generationType: id,
      seed: `${id}-deterministic`,
    });

    assert.equal(first.buffer.subarray(1, 4).toString(), "PNG");
    assert.ok(first.buffer.length > 1000);
    assert.equal(Buffer.compare(first.buffer, second.buffer), 0);
  }
});
