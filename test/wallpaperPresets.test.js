const assert = require("node:assert/strict");
const { before, test } = require("node:test");

const { listGeneratorMetadata } = require("../src/generators");

let presetHelpers;

before(async () => {
  presetHelpers = await import("../src/shared/wallpaperPresets.mjs");
});

test("built-in wallpaper presets validate against current generators", () => {
  const generators = listGeneratorMetadata();
  const presets = presetHelpers.listWallpaperPresets();

  assert.ok(presets.length >= 5);

  for (const preset of presets) {
    assert.deepEqual(
      presetHelpers.validateWallpaperPreset(preset, generators),
      [],
      preset.id,
    );
  }
});

test("applying a wallpaper preset creates sanitized settings", () => {
  const generators = listGeneratorMetadata();
  const preset = presetHelpers
    .listWallpaperPresets()
    .find((entry) => entry.id === "tidal-lines");
  const result = presetHelpers.applyWallpaperPreset(preset, generators);

  assert.deepEqual(result.errors, []);
  assert.equal(result.settings.generatorId, "waves");
  assert.equal(result.settings.width, 2560);
  assert.equal(result.settings.height, 1440);
  assert.equal(result.settings.palette, "ocean");
  assert.equal(result.settings.seed, "tidal-lines-02");
  assert.equal(result.settings.seedLocked, true);
  assert.equal(result.settings.parameters.shapes, 82);
});

test("random-seed presets leave seed unlocked for live workflows", () => {
  const generators = listGeneratorMetadata();
  const preset = presetHelpers
    .listWallpaperPresets()
    .find((entry) => entry.id === "candy-bokeh");
  const result = presetHelpers.applyWallpaperPreset(preset, generators);

  assert.deepEqual(result.errors, []);
  assert.equal(result.settings.generatorId, "bokeh");
  assert.equal(result.settings.seed, "");
  assert.equal(result.settings.seedLocked, false);
});

test("settings JSON round-trips and rejects invalid input safely", () => {
  const generators = listGeneratorMetadata();
  const preset = presetHelpers.listWallpaperPresets()[0];
  const applied = presetHelpers.applyWallpaperPreset(preset, generators);
  const json = presetHelpers.serializeGeneratorSettings(applied.settings);
  const parsed = presetHelpers.parseGeneratorSettingsJson(json, generators);

  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.settings, applied.settings);

  const invalid = presetHelpers.parseGeneratorSettingsJson("{", generators);
  assert.equal(invalid.settings, null);
  assert.ok(invalid.errors[0].includes("could not be parsed"));
});
