const WALLPAPER_SIZE_LIMITS = {
  width: { min: 128, max: 7680, defaultValue: 1920 },
  height: { min: 128, max: 4320, defaultValue: 1080 },
};

const resolutionPresets = [
  { label: "HD", value: "1920x1080", width: 1920, height: 1080 },
  { label: "QHD", value: "2560x1440", width: 2560, height: 1440 },
  { label: "4K", value: "3840x2160", width: 3840, height: 2160 },
  { label: "Portrait", value: "1440x2560", width: 1440, height: 2560 },
];

const BACKGROUND_TYPES = ["solid", "linear-gradient", "radial-gradient"];
const BACKGROUND_DIRECTIONS = ["diagonal", "vertical", "horizontal"];
const DEFAULT_BACKGROUND = {
  type: "solid",
  colors: ["#101820"],
  direction: "diagonal",
};
const RENDER_MODES = ["server-cpu", "browser-canvas", "webgl2", "webgpu"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampInteger(value, limits) {
  const parsed =
    value === undefined || value === null || value === ""
      ? limits.defaultValue
      : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return limits.defaultValue;
  }

  return Math.min(Math.max(parsed, limits.min), limits.max);
}

function normalizeHexColor(value, fallback = "#000000") {
  const color = String(value || "").trim();
  const match = color.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

  if (!match) {
    return fallback;
  }

  const hex = match[1];
  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : hex;

  return `#${expanded.toUpperCase()}`;
}

function normalizeBackground(value) {
  const input = value && typeof value === "object" ? value : DEFAULT_BACKGROUND;
  const type = BACKGROUND_TYPES.includes(input.type)
    ? input.type
    : DEFAULT_BACKGROUND.type;
  const direction = BACKGROUND_DIRECTIONS.includes(input.direction)
    ? input.direction
    : DEFAULT_BACKGROUND.direction;
  const rawColors = Array.isArray(input.colors) ? input.colors : [];
  const colors = rawColors
    .map((color) => normalizeHexColor(color, ""))
    .filter(Boolean);
  const fallbackColors = DEFAULT_BACKGROUND.colors;
  const requiredColorCount = type === "solid" ? 1 : 2;
  const normalizedColors = [...colors, ...fallbackColors];

  while (normalizedColors.length < requiredColorCount) {
    normalizedColors.push(fallbackColors[0]);
  }

  return {
    type,
    colors:
      type === "solid"
        ? [normalizedColors[0]]
        : normalizedColors.slice(0, 5),
    direction,
  };
}

function getParameterDefault(parameter) {
  if (parameter.kind === "number") {
    const fallback = Number.isFinite(parameter.defaultValue)
      ? parameter.defaultValue
      : parameter.min;
    return Math.min(Math.max(fallback, parameter.min), parameter.max);
  }

  if (parameter.kind === "boolean") {
    return Boolean(parameter.defaultValue);
  }

  if (parameter.kind === "select") {
    const allowedValues = new Set(parameter.options.map((option) => option.value));

    if (parameter.multiple) {
      return Array.isArray(parameter.defaultValue)
        ? parameter.defaultValue.filter((value) => allowedValues.has(value))
        : [];
    }

    return allowedValues.has(parameter.defaultValue)
      ? parameter.defaultValue
      : parameter.options[0]?.value || "";
  }

  if (parameter.kind === "palette") {
    const allowedValues = new Set(parameter.options.map((option) => option.value));
    return allowedValues.has(parameter.defaultValue)
      ? parameter.defaultValue
      : parameter.options[0]?.value || "mixed";
  }

  if (parameter.kind === "background") {
    return normalizeBackground(parameter.defaultValue);
  }

  if (parameter.kind === "color") {
    return normalizeHexColor(parameter.defaultValue);
  }

  if (parameter.kind === "color-array") {
    const colors = Array.isArray(parameter.defaultValue)
      ? parameter.defaultValue
      : [];
    return colors
      .slice(0, parameter.maxItems)
      .map((color) => normalizeHexColor(color, ""))
      .filter(Boolean);
  }

  if (parameter.kind === "group") {
    return undefined;
  }

  return String(parameter.defaultValue ?? "");
}

function parameterValueIsValid(parameter, value) {
  if (parameter.kind === "number") {
    return (
      Number.isFinite(value) && value >= parameter.min && value <= parameter.max
    );
  }

  if (parameter.kind === "boolean") {
    return typeof value === "boolean";
  }

  if (parameter.kind === "select") {
    const allowedValues = new Set(parameter.options.map((option) => option.value));
    const values = parameter.multiple ? value : [value];

    return (
      Array.isArray(values) &&
      values.every((entry) => allowedValues.has(entry))
    );
  }

  if (parameter.kind === "palette") {
    return parameter.options.some((option) => option.value === value);
  }

  if (parameter.kind === "background") {
    return Boolean(value && typeof value === "object");
  }

  if (parameter.kind === "color") {
    return normalizeHexColor(value, "") !== "";
  }

  if (parameter.kind === "color-array") {
    return (
      Array.isArray(value) &&
      value.length >= parameter.minItems &&
      value.length <= parameter.maxItems &&
      value.every((color) => normalizeHexColor(color, "") !== "")
    );
  }

  if (parameter.kind === "group") {
    return true;
  }

  return typeof value === "string";
}

function sanitizeParameterValue(parameter, value) {
  if (value === undefined) {
    return getParameterDefault(parameter);
  }

  if (parameter.kind === "number") {
    const parsed = Number(value);
    const fallback = getParameterDefault(parameter);
    const numericValue = Number.isFinite(parsed) ? parsed : fallback;
    const steppedValue =
      parameter.step > 0
        ? Math.round(numericValue / parameter.step) * parameter.step
        : numericValue;

    return Math.min(Math.max(steppedValue, parameter.min), parameter.max);
  }

  if (parameter.kind === "boolean") {
    return Boolean(value);
  }

  if (parameter.kind === "select") {
    const allowedValues = new Set(parameter.options.map((option) => option.value));

    if (parameter.multiple) {
      const values = Array.isArray(value) ? value : [value];
      const selected = values.filter((entry) => allowedValues.has(entry));
      return selected.length > 0 ? selected : getParameterDefault(parameter);
    }

    return allowedValues.has(value) ? value : getParameterDefault(parameter);
  }

  if (parameter.kind === "palette") {
    return parameter.options.some((option) => option.value === value)
      ? value
      : getParameterDefault(parameter);
  }

  if (parameter.kind === "background") {
    return normalizeBackground(value);
  }

  if (parameter.kind === "color") {
    return normalizeHexColor(value, getParameterDefault(parameter));
  }

  if (parameter.kind === "color-array") {
    const colors = Array.isArray(value) ? value : [];
    const normalized = colors
      .slice(0, parameter.maxItems)
      .map((color) => normalizeHexColor(color, ""))
      .filter(Boolean);
    return normalized.length >= parameter.minItems
      ? normalized
      : getParameterDefault(parameter);
  }

  if (parameter.kind === "group") {
    return undefined;
  }

  const text = String(value ?? "");
  return parameter.maxLength ? text.slice(0, parameter.maxLength) : text;
}

function createParameterValues(generator, currentValues = {}) {
  const values = {};

  for (const parameter of generator.parameters || []) {
    if (parameter.kind === "group") {
      continue;
    }

    const currentValue = currentValues[parameter.id];
    values[parameter.id] = parameterValueIsValid(parameter, currentValue)
      ? sanitizeParameterValue(parameter, currentValue)
      : getParameterDefault(parameter);
  }

  return values;
}

function getParameterValue(values, id, fallback) {
  return Object.prototype.hasOwnProperty.call(values, id)
    ? values[id]
    : fallback;
}

function firstParameter(generator, id) {
  return (generator.parameters || []).find((parameter) => parameter.id === id);
}

function createDefaultGeneratorSettings(generator, overrides = {}) {
  const parameterValues = createParameterValues(
    generator,
    overrides.parameters || {},
  );
  const defaults = generator.defaults || {};
  const paletteParameter = firstParameter(generator, "colorPalette");
  const backgroundParameter = firstParameter(generator, "background");
  const seedParameter = firstParameter(generator, "seed");
  const paletteDefault = paletteParameter
    ? getParameterDefault(paletteParameter)
    : defaults.colorPalette || "mixed";
  const backgroundDefault = backgroundParameter
    ? getParameterDefault(backgroundParameter)
    : defaults.background || DEFAULT_BACKGROUND;
  const seedDefault = seedParameter
    ? getParameterDefault(seedParameter)
    : defaults.seed || "";
  const renderMode = RENDER_MODES.includes(overrides.renderMode)
    ? overrides.renderMode
    : generator.rendering?.preferredPreviewMode || "server-cpu";
  const palette = paletteParameter
    ? sanitizeParameterValue(
        paletteParameter,
        overrides.palette ?? getParameterValue(parameterValues, "colorPalette", paletteDefault),
      )
    : String(overrides.palette ?? paletteDefault);
  const background = normalizeBackground(
    overrides.background ??
      getParameterValue(parameterValues, "background", backgroundDefault),
  );
  const seed = String(
    overrides.seed ?? getParameterValue(parameterValues, "seed", seedDefault) ?? "",
  ).slice(0, 128);

  parameterValues.colorPalette = palette;
  parameterValues.background = background;
  parameterValues.seed = seed;

  return {
    generatorId: generator.id,
    width: clampInteger(overrides.width, WALLPAPER_SIZE_LIMITS.width),
    height: clampInteger(overrides.height, WALLPAPER_SIZE_LIMITS.height),
    seed,
    seedLocked: Boolean(overrides.seedLocked),
    palette,
    background,
    parameters: parameterValues,
    renderMode,
  };
}

function sanitizeGeneratorSettings(settings, generator) {
  return createDefaultGeneratorSettings(generator, {
    ...settings,
    parameters: settings.parameters || {},
  });
}

function switchGeneratorSettings(settings, nextGenerator) {
  return createDefaultGeneratorSettings(nextGenerator, {
    width: settings.width,
    height: settings.height,
    seed: settings.seedLocked ? settings.seed : "",
    seedLocked: settings.seedLocked,
    palette: settings.palette,
    background: settings.background,
    parameters: settings.parameters,
    renderMode: settings.renderMode,
  });
}

function updateGeneratorParameter(settings, generator, parameterId, value) {
  const parameter = firstParameter(generator, parameterId);

  if (!parameter) {
    return sanitizeGeneratorSettings(settings, generator);
  }

  const sanitizedValue = sanitizeParameterValue(parameter, value);
  const nextSettings = {
    ...settings,
    parameters: {
      ...settings.parameters,
      [parameterId]: sanitizedValue,
    },
  };

  if (parameterId === "colorPalette") {
    nextSettings.palette = sanitizedValue;
  }

  if (parameterId === "background") {
    nextSettings.background = normalizeBackground(sanitizedValue);
  }

  if (parameterId === "seed") {
    nextSettings.seed = String(sanitizedValue).slice(0, 128);
  }

  return sanitizeGeneratorSettings(nextSettings, generator);
}

function updateGeneratorSize(settings, generator, size) {
  return sanitizeGeneratorSettings(
    {
      ...settings,
      width: size.width,
      height: size.height,
    },
    generator,
  );
}

function validateGeneratorSettings(settings, generator) {
  const details = [];

  if (settings.generatorId !== generator.id) {
    details.push("Selected generator does not match the active metadata.");
  }

  if (
    !Number.isInteger(settings.width) ||
    settings.width < WALLPAPER_SIZE_LIMITS.width.min ||
    settings.width > WALLPAPER_SIZE_LIMITS.width.max
  ) {
    details.push(
      `Width must be between ${WALLPAPER_SIZE_LIMITS.width.min} and ${WALLPAPER_SIZE_LIMITS.width.max}.`,
    );
  }

  if (
    !Number.isInteger(settings.height) ||
    settings.height < WALLPAPER_SIZE_LIMITS.height.min ||
    settings.height > WALLPAPER_SIZE_LIMITS.height.max
  ) {
    details.push(
      `Height must be between ${WALLPAPER_SIZE_LIMITS.height.min} and ${WALLPAPER_SIZE_LIMITS.height.max}.`,
    );
  }

  if (String(settings.seed || "").length > 128) {
    details.push("Seed must be 128 characters or fewer.");
  }

  for (const parameter of generator.parameters || []) {
    if (parameter.kind === "group") {
      continue;
    }

    const value = settings.parameters?.[parameter.id];
    if (!parameterValueIsValid(parameter, value)) {
      details.push(`${parameter.label} is outside the supported range.`);
    }
  }

  return details;
}

function createGenerationRequest(settings, generator, options = {}) {
  const normalized = sanitizeGeneratorSettings(settings, generator);
  const requestOptions = {};

  for (const parameter of generator.parameters || []) {
    if (parameter.scope === "options") {
      requestOptions[parameter.id] = normalized.parameters[parameter.id];
    }
  }

  return {
    width: options.previewSize?.width || normalized.width,
    height: options.previewSize?.height || normalized.height,
    shapes: normalized.parameters.shapes || generator.defaults?.shapes || 50,
    shapeTypes:
      normalized.parameters.shapeTypes || generator.defaults?.shapeTypes || [],
    colorPalette: normalized.palette,
    background: clone(normalized.background),
    generationType: generator.id,
    seed: normalized.seed || options.seedFallback || "",
    options: {
      ...(generator.defaults?.options || {}),
      ...requestOptions,
    },
  };
}

function presetValueForSize(width, height) {
  return (
    resolutionPresets.find(
      (preset) => preset.width === width && preset.height === height,
    )?.value || "custom"
  );
}

const generatorSettings = {
  BACKGROUND_DIRECTIONS,
  BACKGROUND_TYPES,
  DEFAULT_BACKGROUND,
  WALLPAPER_SIZE_LIMITS,
  createDefaultGeneratorSettings,
  createGenerationRequest,
  createParameterValues,
  normalizeBackground,
  normalizeHexColor,
  parameterValueIsValid,
  presetValueForSize,
  resolutionPresets,
  sanitizeGeneratorSettings,
  sanitizeParameterValue,
  switchGeneratorSettings,
  updateGeneratorParameter,
  updateGeneratorSize,
  validateGeneratorSettings,
};

export {
  BACKGROUND_DIRECTIONS,
  BACKGROUND_TYPES,
  DEFAULT_BACKGROUND,
  WALLPAPER_SIZE_LIMITS,
  createDefaultGeneratorSettings,
  createGenerationRequest,
  createParameterValues,
  generatorSettings as default,
  normalizeBackground,
  normalizeHexColor,
  parameterValueIsValid,
  presetValueForSize,
  resolutionPresets,
  sanitizeGeneratorSettings,
  sanitizeParameterValue,
  switchGeneratorSettings,
  updateGeneratorParameter,
  updateGeneratorSize,
  validateGeneratorSettings,
};
