import { sanitizeGeneratorSettings } from "./generatorSettings.mjs";

const PROJECT_STATE_VERSION = 1;
const MAX_HISTORY_ITEMS = 30;
const PROJECT_STORAGE_KEY = "abstract-wallpaper-generator:project-state:v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function shortHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function findGenerator(generators, generatorId) {
  return generators.find((generator) => generator.id === generatorId);
}

function sortNewestFirst(items) {
  return [...items].sort(
    (first, second) =>
      Date.parse(second.timestamp || "") - Date.parse(first.timestamp || ""),
  );
}

function createHistorySignature({ generatorId, rendererMode, resolvedSeed, settings }) {
  return stableStringify({
    generatorId,
    rendererMode,
    resolvedSeed,
    settings,
  });
}

function normalizeThumbnailColors(colors) {
  const normalized = Array.isArray(colors)
    ? colors
        .map((color) => String(color || "").trim())
        .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
        .slice(0, 5)
    : [];

  return normalized.length > 0 ? normalized : ["#101820", "#1767C2"];
}

function createHistoryItem({
  favorite = false,
  generatorId,
  paletteColors = [],
  rendererMode,
  resolvedSeed,
  settings,
  source = "preview",
  timestamp = new Date().toISOString(),
}) {
  const settingsSnapshot = clone(settings);
  const signature = createHistorySignature({
    generatorId,
    rendererMode,
    resolvedSeed,
    settings: settingsSnapshot,
  });

  return {
    id: `${Date.parse(timestamp) || Date.now()}-${shortHash(signature)}`,
    timestamp,
    generatorId,
    settings: settingsSnapshot,
    resolvedSeed: String(resolvedSeed || ""),
    thumbnail: {
      type: "palette",
      colors: normalizeThumbnailColors(paletteColors),
    },
    rendererMode,
    favorite: Boolean(favorite),
    source,
    signature,
  };
}

function normalizeHistoryItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  if (!item.generatorId || !item.settings || !item.timestamp) {
    return null;
  }

  const rendererMode = item.rendererMode || "server-cpu";
  const resolvedSeed = String(item.resolvedSeed || item.settings.seed || "");
  const signature =
    item.signature ||
    createHistorySignature({
      generatorId: item.generatorId,
      rendererMode,
      resolvedSeed,
      settings: item.settings,
    });

  return {
    id: String(item.id || `${Date.parse(item.timestamp) || Date.now()}-${shortHash(signature)}`),
    timestamp: String(item.timestamp),
    generatorId: String(item.generatorId),
    settings: clone(item.settings),
    resolvedSeed,
    thumbnail: {
      type: "palette",
      colors: normalizeThumbnailColors(item.thumbnail?.colors),
    },
    rendererMode,
    favorite: Boolean(item.favorite),
    source: ["preview", "export", "manual"].includes(item.source)
      ? item.source
      : "preview",
    signature,
  };
}

function limitHistory(items, maxItems = MAX_HISTORY_ITEMS) {
  const normalized = [];
  const seenIds = new Set();
  const seenSignatures = new Set();

  for (const item of sortNewestFirst(items).map(normalizeHistoryItem)) {
    if (!item || seenIds.has(item.id) || seenSignatures.has(item.signature)) {
      continue;
    }

    seenIds.add(item.id);
    seenSignatures.add(item.signature);
    normalized.push(item);
  }

  const favoriteItems = normalized.filter((item) => item.favorite);
  const regularItems = normalized.filter((item) => !item.favorite);
  const selected = [
    ...favoriteItems.slice(0, maxItems),
    ...regularItems.slice(0, Math.max(0, maxItems - favoriteItems.length)),
  ];

  return sortNewestFirst(selected).slice(0, maxItems);
}

function upsertHistoryItem(history, item, maxItems = MAX_HISTORY_ITEMS) {
  const nextItem = normalizeHistoryItem(item);
  if (!nextItem) {
    return limitHistory(history, maxItems);
  }

  const existing = history.find(
    (entry) => entry.signature === nextItem.signature,
  );
  const mergedItem = existing
    ? { ...nextItem, id: existing.id, favorite: existing.favorite }
    : nextItem;

  return limitHistory(
    [mergedItem, ...history.filter((entry) => entry.id !== mergedItem.id)],
    maxItems,
  );
}

function toggleHistoryFavorite(history, itemId) {
  return history.map((item) =>
    item.id === itemId ? { ...item, favorite: !item.favorite } : item,
  );
}

function removeHistoryItem(history, itemId) {
  return history.filter((item) => item.id !== itemId);
}

function restoreHistorySettings(item, generators) {
  const normalized = normalizeHistoryItem(item);
  if (!normalized) {
    return { settings: null, errors: ["History item is invalid."] };
  }

  const generator = findGenerator(generators, normalized.generatorId);
  if (!generator) {
    return {
      settings: null,
      errors: [`Generator ${normalized.generatorId} is not available.`],
    };
  }

  try {
    return {
      settings: sanitizeGeneratorSettings(normalized.settings, generator),
      errors: [],
    };
  } catch (error) {
    return {
      settings: null,
      errors: [
        error instanceof Error
          ? error.message
          : "History settings could not be restored.",
      ],
    };
  }
}

function createProjectState({ history = [], savedSettings = null, settings = null }) {
  return {
    version: PROJECT_STATE_VERSION,
    updatedAt: new Date().toISOString(),
    settings: settings ? clone(settings) : null,
    savedSettings: savedSettings ? clone(savedSettings) : null,
    history: limitHistory(history),
  };
}

function serializeProjectState(state) {
  return JSON.stringify(createProjectState(state));
}

function parseProjectState(json, generators) {
  let payload;

  try {
    payload = JSON.parse(json);
  } catch {
    return { state: null, errors: ["Project state could not be parsed."] };
  }

  if (!payload || typeof payload !== "object") {
    return { state: null, errors: ["Project state must be an object."] };
  }

  const errors = [];
  const sanitizeSettings = (settings, label) => {
    if (!settings) {
      return null;
    }

    const generator = findGenerator(generators, settings.generatorId);
    if (!generator) {
      errors.push(`${label} generator ${settings.generatorId || "(missing)"} is not available.`);
      return null;
    }

    return sanitizeGeneratorSettings(settings, generator);
  };

  const settings = sanitizeSettings(payload.settings, "Current");
  const savedSettings = sanitizeSettings(payload.savedSettings, "Saved");
  const history = limitHistory(Array.isArray(payload.history) ? payload.history : []);

  return {
    state: {
      version: PROJECT_STATE_VERSION,
      updatedAt: String(payload.updatedAt || new Date().toISOString()),
      settings,
      savedSettings,
      history,
    },
    errors,
  };
}

export {
  MAX_HISTORY_ITEMS,
  PROJECT_STATE_VERSION,
  PROJECT_STORAGE_KEY,
  createHistoryItem,
  createHistorySignature,
  createProjectState,
  limitHistory,
  parseProjectState,
  removeHistoryItem,
  restoreHistorySettings,
  serializeProjectState,
  stableStringify,
  toggleHistoryFavorite,
  upsertHistoryItem,
};
