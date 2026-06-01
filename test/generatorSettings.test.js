const assert = require("node:assert/strict");
const { before, test } = require("node:test");

const { listGeneratorMetadata } = require("../src/generators");

let settingsHelpers;

before(async () => {
  settingsHelpers = await import("../src/shared/generatorSettings.mjs");
});

function getGenerator(id) {
  const generator = listGeneratorMetadata().find((entry) => entry.id === id);
  assert.ok(generator, `expected ${id} metadata`);
  return generator;
}

test("generator settings resolve defaults from metadata", () => {
  const shapes = getGenerator("shapes");
  const settings = settingsHelpers.createDefaultGeneratorSettings(shapes);

  assert.deepEqual(
    {
      generatorId: settings.generatorId,
      width: settings.width,
      height: settings.height,
      seed: settings.seed,
      palette: settings.palette,
      renderMode: settings.renderMode,
    },
    {
      generatorId: "shapes",
      width: 1920,
      height: 1080,
      seed: "",
      palette: "mixed",
      renderMode: "server-cpu",
    },
  );
  assert.equal(settings.parameters.shapes, 50);
  assert.ok(Array.isArray(settings.parameters.shapeTypes));
  assert.equal(settings.background.colors[0], "#101820");
});

test("generator settings clamp impossible sizes and numeric parameters", () => {
  const shapes = getGenerator("shapes");
  const initial = settingsHelpers.createDefaultGeneratorSettings(shapes);
  const resized = settingsHelpers.updateGeneratorSize(initial, shapes, {
    width: 12,
    height: 99999,
  });
  const detailed = settingsHelpers.updateGeneratorParameter(
    resized,
    shapes,
    "shapes",
    9000,
  );

  assert.equal(detailed.width, 128);
  assert.equal(detailed.height, 4320);
  assert.equal(detailed.parameters.shapes, 5000);
  assert.deepEqual(settingsHelpers.validateGeneratorSettings(detailed, shapes), []);
});

test("generator switching preserves compatible settings and resets unlocked seed", () => {
  const shapes = getGenerator("shapes");
  const waves = getGenerator("waves");
  const settings = settingsHelpers.updateGeneratorParameter(
    {
      ...settingsHelpers.createDefaultGeneratorSettings(shapes),
      seed: "locked-seed",
      seedLocked: false,
    },
    shapes,
    "colorPalette",
    "ocean",
  );
  const next = settingsHelpers.switchGeneratorSettings(settings, waves);

  assert.equal(next.generatorId, "waves");
  assert.equal(next.palette, "ocean");
  assert.equal(next.width, 1920);
  assert.equal(next.seed, "");
  assert.equal(next.parameters.shapes, 50);
});

test("generation requests are stable and compatible with the existing API", () => {
  const shapes = getGenerator("shapes");
  const settings = settingsHelpers.updateGeneratorParameter(
    settingsHelpers.updateGeneratorParameter(
      settingsHelpers.createDefaultGeneratorSettings(shapes, {
        seed: "request-seed",
      }),
      shapes,
      "shapes",
      12,
    ),
    shapes,
    "shapeTypes",
    ["circle", "rectangle"],
  );
  const request = settingsHelpers.createGenerationRequest(settings, shapes, {
    previewSize: { width: 960, height: 540 },
  });

  assert.deepEqual(request, {
    width: 960,
    height: 540,
    shapes: 12,
    shapeTypes: ["circle", "rectangle"],
    colorPalette: "mixed",
    background: {
      type: "solid",
      colors: ["#101820"],
      direction: "diagonal",
    },
    generationType: "shapes",
    seed: "request-seed",
    options: {},
  });
});

test("export requests use full output settings and png format", () => {
  const shapes = getGenerator("shapes");
  const settings = settingsHelpers.updateGeneratorParameter(
    settingsHelpers.createDefaultGeneratorSettings(shapes, {
      width: 2560,
      height: 1440,
      seed: "export-seed",
    }),
    shapes,
    "shapes",
    24,
  );
  const request = settingsHelpers.createExportRequest(settings, shapes);

  assert.equal(request.width, 2560);
  assert.equal(request.height, 1440);
  assert.equal(request.size.width, 2560);
  assert.equal(request.size.height, 1440);
  assert.equal(request.format, "png");
  assert.equal(request.seed, "export-seed");
  assert.equal(request.shapes, 24);
});

test("every generator resolves settings and a valid request", () => {
  for (const generator of listGeneratorMetadata()) {
    const settings = settingsHelpers.createDefaultGeneratorSettings(generator);
    const request = settingsHelpers.createGenerationRequest(settings, generator);

    assert.equal(settings.generatorId, generator.id);
    assert.deepEqual(
      settingsHelpers.validateGeneratorSettings(settings, generator),
      [],
    );
    assert.equal(request.generationType, generator.id);
    assert.equal(Number.isInteger(request.width), true);
    assert.equal(Number.isInteger(request.height), true);
    assert.equal(typeof request.colorPalette, "string");
  }
});
