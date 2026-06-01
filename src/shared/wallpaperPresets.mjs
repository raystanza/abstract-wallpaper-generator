import {
  createDefaultGeneratorSettings,
  sanitizeGeneratorSettings,
} from "./generatorSettings.mjs";

const SETTINGS_SHARE_VERSION = 1;

const wallpaperPresets = [
  {
    id: "quiet-geometry",
    name: "Quiet Geometry",
    generatorId: "shapes",
    size: { width: 1920, height: 1080 },
    seed: "quiet-geometry-01",
    seedBehavior: "locked",
    palette: "mixed",
    background: {
      type: "solid",
      colors: ["#101820"],
      direction: "diagonal",
    },
    parameters: {
      shapes: 120,
      shapeTypes: ["circle", "rectangle", "triangle", "hexagon"],
    },
    tags: ["geometry", "balanced", "desktop"],
  },
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
      direction: "vertical",
    },
    parameters: {
      shapes: 82,
    },
    tags: ["waves", "cool", "wide"],
  },
  {
    id: "neon-orbits",
    name: "Neon Orbits",
    generatorId: "particle-orbits",
    size: { width: 3840, height: 2160 },
    seed: "neon-orbits-03",
    seedBehavior: "locked",
    palette: "neon",
    background: {
      type: "radial-gradient",
      colors: ["#080916", "#1c1238"],
      direction: "diagonal",
    },
    parameters: {
      shapes: 420,
    },
    tags: ["simulation", "vivid", "4k"],
  },
  {
    id: "forest-contours",
    name: "Forest Contours",
    generatorId: "topographic-contours",
    size: { width: 1920, height: 1080 },
    seed: "forest-contours-04",
    seedBehavior: "fixed",
    palette: "forest",
    background: {
      type: "solid",
      colors: ["#07130b"],
      direction: "diagonal",
    },
    parameters: {
      shapes: 180,
    },
    tags: ["terrain", "natural", "calm"],
  },
  {
    id: "candy-bokeh",
    name: "Candy Bokeh",
    generatorId: "bokeh",
    size: { width: 1440, height: 2560 },
    seed: "candy-bokeh-05",
    seedBehavior: "random",
    palette: "candy",
    background: {
      type: "linear-gradient",
      colors: ["#180c24", "#301447"],
      direction: "vertical",
    },
    parameters: {
      shapes: 90,
    },
    tags: ["portrait", "soft", "vivid"],
  },
  {
    id: "galaxy-fractal",
    name: "Galaxy Fractal",
    generatorId: "julia-set",
    size: { width: 2560, height: 1440 },
    seed: "galaxy-fractal-06",
    seedBehavior: "locked",
    palette: "galaxy",
    background: {
      type: "solid",
      colors: ["#050610"],
      direction: "diagonal",
    },
    parameters: {
      shapes: 220,
    },
    tags: ["fractal", "cool", "deep"],
  },
  {
    id: "aurora-warp",
    name: "Aurora Warp",
    generatorId: "domain-warp-noise",
    size: { width: 3840, height: 2160 },
    seed: "aurora-warp-07",
    seedBehavior: "locked",
    palette: "galaxy",
    background: {
      type: "radial-gradient",
      colors: ["#050610", "#12142d"],
      direction: "diagonal",
    },
    parameters: {
      shapes: 220,
      frequency: 2.4,
      warpStrength: 1.05,
      contrast: 0.72,
      octaves: 6,
    },
    tags: ["shader", "noise", "4k"],
  },
  {
    id: "signal-moire",
    name: "Signal Moire",
    generatorId: "moire-interference",
    size: { width: 2560, height: 1440 },
    seed: "signal-moire-08",
    seedBehavior: "fixed",
    palette: "neon",
    background: {
      type: "solid",
      colors: ["#07070f"],
      direction: "diagonal",
    },
    parameters: {
      shapes: 110,
      ringFrequency: 46,
      interference: 0.82,
      centerCount: 4,
    },
    tags: ["shader", "optical", "vivid"],
  },
  {
    id: "soft-mesh-field",
    name: "Soft Mesh Field",
    generatorId: "gradient-field",
    size: { width: 1920, height: 1080 },
    seed: "soft-mesh-field-09",
    seedBehavior: "random",
    palette: "sunrise",
    background: {
      type: "linear-gradient",
      colors: ["#1b1029", "#31164a"],
      direction: "diagonal",
    },
    parameters: {
      shapes: 120,
      nodes: 8,
      softness: 0.78,
      turbulence: 0.36,
    },
    tags: ["shader", "gradient", "soft"],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listWallpaperPresets() {
  return wallpaperPresets.map(clone);
}

function findGenerator(generators, generatorId) {
  return generators.find((generator) => generator.id === generatorId);
}

function validateWallpaperPreset(preset, generators = []) {
  const details = [];

  if (!preset || typeof preset !== "object") {
    return ["Preset must be an object."];
  }

  for (const key of ["id", "name", "generatorId", "palette", "seedBehavior"]) {
    if (typeof preset[key] !== "string" || preset[key].trim() === "") {
      details.push(`${key} is required.`);
    }
  }

  if (!["fixed", "random", "locked"].includes(preset.seedBehavior)) {
    details.push("seedBehavior must be fixed, random, or locked.");
  }

  if (
    !preset.size ||
    !Number.isInteger(preset.size.width) ||
    !Number.isInteger(preset.size.height)
  ) {
    details.push("size must include integer width and height.");
  }

  if (!preset.background || typeof preset.background !== "object") {
    details.push("background is required.");
  }

  if (!Array.isArray(preset.tags)) {
    details.push("tags must be an array.");
  }

  if (generators.length > 0 && !findGenerator(generators, preset.generatorId)) {
    details.push(`generatorId ${preset.generatorId} is not available.`);
  }

  return details;
}

function applyWallpaperPreset(preset, generators) {
  const details = validateWallpaperPreset(preset, generators);

  if (details.length > 0) {
    return { settings: null, errors: details };
  }

  const generator = findGenerator(generators, preset.generatorId);
  if (!generator) {
    return {
      settings: null,
      errors: [`generatorId ${preset.generatorId} is not available.`],
    };
  }

  const seed = preset.seedBehavior === "random" ? "" : preset.seed;
  const settings = createDefaultGeneratorSettings(generator, {
    width: preset.size.width,
    height: preset.size.height,
    seed,
    seedLocked: preset.seedBehavior === "locked",
    palette: preset.palette,
    background: preset.background,
    parameters: {
      ...preset.parameters,
      colorPalette: preset.palette,
      background: preset.background,
      seed,
    },
  });

  return { settings, errors: [] };
}

function createSettingsSharePayload(settings) {
  return {
    version: SETTINGS_SHARE_VERSION,
    settings: clone(settings),
  };
}

function serializeGeneratorSettings(settings) {
  return JSON.stringify(createSettingsSharePayload(settings), null, 2);
}

function parseGeneratorSettingsJson(json, generators) {
  let payload;

  try {
    payload = JSON.parse(json);
  } catch {
    return { settings: null, errors: ["Settings JSON could not be parsed."] };
  }

  const rawSettings = payload?.settings || payload;
  if (!rawSettings || typeof rawSettings !== "object") {
    return { settings: null, errors: ["Settings JSON must contain settings."] };
  }

  const generator = findGenerator(generators, rawSettings.generatorId);
  if (!generator) {
    return {
      settings: null,
      errors: [`Generator ${rawSettings.generatorId || "(missing)"} is not available.`],
    };
  }

  try {
    return {
      settings: sanitizeGeneratorSettings(rawSettings, generator),
      errors: [],
    };
  } catch (error) {
    return {
      settings: null,
      errors: [
        error instanceof Error
          ? error.message
          : "Settings JSON could not be applied.",
      ],
    };
  }
}

export {
  SETTINGS_SHARE_VERSION,
  applyWallpaperPreset,
  createSettingsSharePayload,
  listWallpaperPresets,
  parseGeneratorSettingsJson,
  serializeGeneratorSettings,
  validateWallpaperPreset,
  wallpaperPresets,
};
