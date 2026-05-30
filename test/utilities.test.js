const assert = require("node:assert/strict");
const test = require("node:test");

const {
  colorAt,
  colorAtCss,
  hexToRgb,
  normalizeHex,
  rgbToHex,
  samplePalette,
} = require("../src/generation/color");
const {
  createDownloadFilename,
  sanitizeSegment,
} = require("../src/generation/output");
const {
  colorPalettes,
  getPaletteColors,
  getPaletteNames,
  isPaletteName,
} = require("../src/generation/palettes");
const { createSeededRandom, withSeededMathRandom } = require("../src/random");

test("palette utilities expose stable named palettes", () => {
  const names = getPaletteNames();

  assert.ok(names.includes("mixed"));
  assert.ok(names.includes("ocean"));
  assert.equal(isPaletteName("galaxy"), true);
  assert.equal(isPaletteName("missing"), false);
  assert.deepEqual(getPaletteColors("mixed"), colorPalettes.mixed);
  assert.equal(getPaletteColors("missing"), null);
});

test("color helpers normalize, convert, and interpolate colors", () => {
  assert.equal(normalizeHex("#abc"), "#aabbcc");
  assert.deepEqual(hexToRgb("#336699"), { r: 51, g: 102, b: 153 });
  assert.equal(rgbToHex({ r: 255, g: 127.5, b: -10 }), "#ff8000");
  assert.deepEqual(colorAt(["#000000", "#ffffff"], 0.5), {
    r: 127.5,
    g: 127.5,
    b: 127.5,
  });
  assert.equal(
    colorAtCss(["#000000", "#ffffff"], 0.5, 0.25),
    "rgba(128, 128, 128, 0.25)",
  );
});

test("palette sampling accepts named palettes and literal palettes", () => {
  assert.equal(
    samplePalette("mixed", () => 0),
    colorPalettes.mixed[0],
  );
  assert.equal(
    samplePalette(["#111111", "#222222"], () => 0.99),
    "#222222",
  );
});

test("seeded random helpers produce repeatable isolated sequences", async () => {
  const first = createSeededRandom("same-seed");
  const second = createSeededRandom("same-seed");
  const different = createSeededRandom("different-seed");

  const firstSequence = [first(), first(), first()];
  const secondSequence = [second(), second(), second()];
  const differentSequence = [different(), different(), different()];

  assert.deepEqual(firstSequence, secondSequence);
  assert.notDeepEqual(firstSequence, differentSequence);
  assert.ok(firstSequence.every((value) => value >= 0 && value < 1));

  const originalRandom = Math.random;
  const seededValues = await withSeededMathRandom("bridge-seed", async () => [
    Math.random(),
    Math.random(),
  ]);

  assert.equal(Math.random, originalRandom);
  assert.deepEqual(
    seededValues,
    await withSeededMathRandom("bridge-seed", async () => [
      Math.random(),
      Math.random(),
    ]),
  );
});

test("output filename helpers sanitize untrusted metadata", () => {
  assert.equal(sanitizeSegment("../../Flow Field!!"), "flow-field");
  assert.equal(
    createDownloadFilename({
      generationType: "../flow field",
      width: 1920,
      height: 1080,
      seed: "seed / value",
      createdAt: new Date("2026-05-29T01:02:03.456Z"),
    }),
    "flow-field_1920x1080_seed-value_2026-05-29T01-02-03-456Z.png",
  );
});
