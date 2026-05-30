const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");

const { renderWallpaper } = require("../src/generateWallpaper");
const { createDownloadFilename } = require("../src/generation/output");
const {
  ValidationError,
  validateGenerationInput,
} = require("../src/generation/validation");
const { getGenerator, listGeneratorMetadata } = require("../src/generators");

test("generator registry exposes metadata without render functions", () => {
  const metadata = listGeneratorMetadata();
  const ids = metadata.map((generator) => generator.id);

  assert.ok(ids.includes("shapes"));
  assert.ok(ids.includes("waves"));
  assert.ok(ids.includes("flow-field"));
  assert.ok(ids.includes("voronoi-cells"));
  assert.ok(ids.includes("topographic-contours"));
  assert.ok(ids.includes("particle-orbits"));
  assert.ok(ids.includes("circuit-board"));
  assert.equal(getGenerator("shapes").name, "Shapes");
  assert.equal(
    Object.prototype.hasOwnProperty.call(metadata[0], "render"),
    false,
  );
});

test("generation validation rejects unsupported generator and palette values", () => {
  assert.throws(
    () =>
      validateGenerationInput({
        width: 640,
        height: 360,
        shapes: 10,
        generationType: "missing-generator",
        colorPalette: "mixed",
      }),
    ValidationError,
  );

  assert.throws(
    () =>
      validateGenerationInput({
        width: 640,
        height: 360,
        shapes: 10,
        generationType: "shapes",
        colorPalette: "missing-palette",
      }),
    ValidationError,
  );
});

test("generation validation normalizes background options", () => {
  const request = validateGenerationInput({
    width: 640,
    height: 360,
    shapes: 10,
    generationType: "waves",
    colorPalette: "mixed",
    background: {
      type: "linear-gradient",
      colors: ["123", "#456789"],
      direction: "horizontal",
    },
  });

  assert.deepEqual(request.background, {
    type: "linear-gradient",
    colors: ["#112233", "#456789"],
    direction: "horizontal",
  });

  assert.throws(
    () =>
      validateGenerationInput({
        width: 640,
        height: 360,
        shapes: 10,
        generationType: "waves",
        colorPalette: "mixed",
        background: {
          type: "linear-gradient",
          colors: ["not-a-color"],
        },
      }),
    ValidationError,
  );
});

test("renderWallpaper writes png output for representative generators", async () => {
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "awg-"));
  const cases = ["shapes", "waves"];

  try {
    for (const generationType of cases) {
      const outputFile = path.join(outputDirectory, `${generationType}.png`);
      const result = await renderWallpaper({
        width: 320,
        height: 180,
        shapes: 8,
        shapeTypes: ["circle", "rectangle"],
        colorPalette: "mixed",
        background: {
          type: "linear-gradient",
          colors: ["#101820", "#243B55"],
          direction: "diagonal",
        },
        generationType,
        seed: `test-${generationType}`,
        outputFile,
      });

      assert.equal(result.outputFile, outputFile);
      assert.equal(fs.existsSync(outputFile), true);
      assert.ok(fs.statSync(outputFile).size > 100);
    }
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});

test("renderWallpaper can return image bytes without writing an output file", async () => {
  const result = await renderWallpaper({
    width: 220,
    height: 140,
    shapes: 10,
    shapeTypes: ["circle", "rectangle"],
    colorPalette: "mixed",
    generationType: "shapes",
    seed: "buffer-only",
  });

  assert.equal(result.outputFile, undefined);
  assert.ok(Buffer.isBuffer(result.buffer));
  assert.ok(result.buffer.length > 100);
});

test("download filenames include safe generation metadata", () => {
  const filename = createDownloadFilename({
    generationType: "flow field!",
    width: 1920,
    height: 1080,
    seed: "demo seed",
    createdAt: new Date("2026-05-28T12:34:56.789Z"),
  });

  assert.equal(
    filename,
    "flow-field_1920x1080_demo-seed_2026-05-28T12-34-56-789Z.png",
  );
});

test("renderWallpaper produces stable output for the same seed", async () => {
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "awg-seeded-"));

  try {
    const sharedInput = {
      width: 220,
      height: 140,
      shapes: 12,
      shapeTypes: ["circle", "rectangle", "triangle"],
      colorPalette: "galaxy",
      generationType: "shapes",
      seed: "stable-seed",
    };

    const first = await renderWallpaper({
      ...sharedInput,
      outputFile: path.join(outputDirectory, "first.png"),
    });
    const second = await renderWallpaper({
      ...sharedInput,
      outputFile: path.join(outputDirectory, "second.png"),
    });

    assert.deepEqual(first.buffer, second.buffer);
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});

test("new generators render png output through the shared pipeline", async () => {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "awg-new-generators-"),
  );
  const cases = [
    "flow-field",
    "voronoi-cells",
    "topographic-contours",
    "particle-orbits",
    "circuit-board",
  ];

  try {
    for (const generationType of cases) {
      const outputFile = path.join(outputDirectory, `${generationType}.png`);
      await renderWallpaper({
        width: 240,
        height: 150,
        shapes: 18,
        colorPalette: "ocean",
        generationType,
        seed: `new-${generationType}`,
        outputFile,
      });

      assert.equal(fs.existsSync(outputFile), true);
      assert.ok(fs.statSync(outputFile).size > 100);
    }
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});
