const assert = require("node:assert/strict");
const { before, test } = require("node:test");

const { listGeneratorMetadata } = require("../src/generators");

let projectState;
let settingsHelpers;

before(async () => {
  projectState = await import("../src/shared/projectState.mjs");
  settingsHelpers = await import("../src/shared/generatorSettings.mjs");
});

function getGenerator(id) {
  const generator = listGeneratorMetadata().find((entry) => entry.id === id);
  assert.ok(generator, `expected ${id} metadata`);
  return generator;
}

function createItem(index, overrides = {}) {
  const generator = getGenerator("shapes");
  const settings = settingsHelpers.createDefaultGeneratorSettings(generator, {
    seed: `seed-${index}`,
  });

  return projectState.createHistoryItem({
    generatorId: generator.id,
    paletteColors: ["#101820", "#1767C2", "#DFF2E9"],
    rendererMode: "server-cpu",
    resolvedSeed: `seed-${index}`,
    settings,
    source: "preview",
    timestamp: new Date(1_700_000_000_000 + index * 1000).toISOString(),
    ...overrides,
  });
}

test("history limit keeps newest items and preserves favorites first", () => {
  const items = Array.from({ length: 36 }, (_, index) =>
    createItem(index, {
      favorite: index < 3,
    }),
  );
  const limited = projectState.limitHistory(items, 30);

  assert.equal(limited.length, 30);
  assert.equal(
    limited.filter((item) => item.favorite).length,
    3,
    "favorite items should not be trimmed while room remains",
  );
  assert.ok(limited.some((item) => item.resolvedSeed === "seed-0"));
  assert.ok(limited.some((item) => item.resolvedSeed === "seed-35"));
});

test("history upsert replaces duplicate settings instead of growing", () => {
  const first = createItem(1);
  const duplicate = {
    ...first,
    id: "different-id",
    timestamp: new Date(Date.parse(first.timestamp) + 5000).toISOString(),
  };
  const history = projectState.upsertHistoryItem(
    projectState.upsertHistoryItem([], first),
    duplicate,
  );

  assert.equal(history.length, 1);
  assert.equal(history[0].id, first.id);
});

test("history restore sanitizes settings through generator metadata", () => {
  const item = createItem(2, {
    settings: {
      generatorId: "shapes",
      width: 12,
      height: 99999,
      seed: "restore-seed",
      parameters: {
        shapes: 120,
      },
    },
  });
  const result = projectState.restoreHistorySettings(item, listGeneratorMetadata());

  assert.deepEqual(result.errors, []);
  assert.equal(result.settings.width, 128);
  assert.equal(result.settings.height, 4320);
  assert.equal(result.settings.parameters.shapes, 120);
  assert.equal(result.settings.seed, "restore-seed");
});

test("project state parses stored settings and rejects invalid json", () => {
  const generator = getGenerator("shapes");
  const settings = settingsHelpers.createDefaultGeneratorSettings(generator, {
    seed: "stored-seed",
  });
  const history = [createItem(3)];
  const serialized = projectState.serializeProjectState({
    history,
    savedSettings: settings,
    settings,
  });
  const parsed = projectState.parseProjectState(
    serialized,
    listGeneratorMetadata(),
  );
  const invalid = projectState.parseProjectState("{", listGeneratorMetadata());

  assert.equal(parsed.state.settings.seed, "stored-seed");
  assert.equal(parsed.state.savedSettings.seed, "stored-seed");
  assert.equal(parsed.state.history.length, 1);
  assert.equal(invalid.state, null);
  assert.match(invalid.errors[0], /could not be parsed/i);
});
