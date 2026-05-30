const { generators, getGenerator, hasGenerator } = require("../generators");
const { getPaletteNames, isPaletteName } = require("./palettes");
const { createRandomSeed } = require("../random");
const {
  BACKGROUND_DIRECTIONS,
  BACKGROUND_TYPES,
  DEFAULT_BACKGROUND,
  DENSITY_LIMITS,
  SHAPE_TYPES,
  WALLPAPER_SIZE_LIMITS,
  validateGeneratorOptions,
} = require("../shared/generationContract");

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

function parseInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

function validateRange(name, value, min, max, details) {
  if (!Number.isInteger(value) || value < min || value > max) {
    details.push(`${name} must be an integer between ${min} and ${max}.`);
  }
}

function normalizeHexColor(value) {
  const color = String(value || "").trim();
  const match = color.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

  if (!match) {
    return null;
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

function normalizeBackground(input, details) {
  const rawBackground = input.background || {};
  const type = rawBackground.type || input.backgroundType || "solid";
  const direction =
    rawBackground.direction || input.backgroundDirection || "diagonal";
  const rawColors =
    rawBackground.colors ||
    input.backgroundColors ||
    [
      input.backgroundColor,
      input.backgroundColor2 || input.backgroundEndColor,
    ].filter(Boolean);

  if (!BACKGROUND_TYPES.includes(type)) {
    details.push(
      `background.type must be one of: ${BACKGROUND_TYPES.join(", ")}.`,
    );
  }

  if (!BACKGROUND_DIRECTIONS.includes(direction)) {
    details.push(
      `background.direction must be one of: ${BACKGROUND_DIRECTIONS.join(", ")}.`,
    );
  }

  const suppliedColors = normalizeArray(rawColors);
  const normalizedColors = suppliedColors
    .map(normalizeHexColor)
    .filter(Boolean);

  if (suppliedColors.length !== normalizedColors.length) {
    details.push("background.colors must contain valid hex color values.");
  }

  const colors = normalizedColors.length
    ? normalizedColors
    : DEFAULT_BACKGROUND.colors;
  const requiredColorCount = type === "solid" ? 1 : 2;

  if (colors.length < requiredColorCount) {
    details.push(
      `background.colors must include at least ${requiredColorCount} color${
        requiredColorCount === 1 ? "" : "s"
      } for ${type}.`,
    );
  }

  return {
    type,
    colors: type === "solid" ? [colors[0]] : colors.slice(0, 5),
    direction,
  };
}

function validateGenerationInput(input = {}) {
  const details = [];
  const generationType = input.generationType || input.generatorId || "shapes";
  const colorPalette = input.colorPalette || input.palette || "mixed";
  const background = normalizeBackground(input, details);
  const width = parseInteger(
    input.width,
    WALLPAPER_SIZE_LIMITS.width.defaultValue,
  );
  const height = parseInteger(
    input.height,
    WALLPAPER_SIZE_LIMITS.height.defaultValue,
  );
  const shapes = parseInteger(
    input.shapes ?? input.count,
    DENSITY_LIMITS.defaultValue,
  );
  const seed =
    input.seed === undefined || input.seed === null || input.seed === ""
      ? createRandomSeed()
      : String(input.seed);
  const shapeTypes = normalizeArray(input.shapeTypes);
  const generator = hasGenerator(generationType)
    ? getGenerator(generationType)
    : null;
  const options = input.options === undefined ? {} : input.options;

  validateRange(
    "width",
    width,
    WALLPAPER_SIZE_LIMITS.width.min,
    WALLPAPER_SIZE_LIMITS.width.max,
    details,
  );
  validateRange(
    "height",
    height,
    WALLPAPER_SIZE_LIMITS.height.min,
    WALLPAPER_SIZE_LIMITS.height.max,
    details,
  );
  validateRange(
    "shapes",
    shapes,
    DENSITY_LIMITS.min,
    DENSITY_LIMITS.max,
    details,
  );

  if (!generator) {
    details.push(
      `generationType must be one of: ${Object.keys(generators).join(", ")}.`,
    );
  }

  if (!isPaletteName(colorPalette)) {
    details.push(
      `colorPalette must be one of: ${getPaletteNames().join(", ")}.`,
    );
  }

  if (seed.length > 128) {
    details.push("seed must be 128 characters or fewer.");
  }

  const normalizedShapeTypes = shapeTypes.length > 0 ? shapeTypes : SHAPE_TYPES;
  const invalidShapeTypes = normalizedShapeTypes.filter(
    (shapeType) => !SHAPE_TYPES.includes(shapeType),
  );

  if (invalidShapeTypes.length > 0) {
    details.push(
      `shapeTypes contains unsupported values: ${invalidShapeTypes.join(", ")}.`,
    );
  }

  if (generator) {
    details.push(
      ...validateGeneratorOptions(options, generator, {
        paletteNames: getPaletteNames(),
      }),
    );
  }

  if (details.length > 0) {
    throw new ValidationError("Invalid wallpaper generation request.", details);
  }

  return {
    width,
    height,
    shapes,
    shapeTypes: normalizedShapeTypes,
    colorPalette,
    background,
    generationType,
    seed,
    outputFile: input.outputFile,
    generator,
    options,
  };
}

module.exports = {
  BACKGROUND_DIRECTIONS,
  BACKGROUND_TYPES,
  DEFAULT_BACKGROUND,
  SHAPE_TYPES,
  ValidationError,
  validateGenerationInput,
};
