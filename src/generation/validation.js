const { generators, getGenerator, hasGenerator } = require("../generators");
const { getPaletteNames, isPaletteName } = require("./palettes");
const { createRandomSeed } = require("../random");

const SHAPE_TYPES = [
  "circle",
  "rectangle",
  "triangle",
  "hexagon",
  "rhombus",
  "star",
  "spiral",
  "ellipse",
  "pentagon",
  "heart",
  "diamond",
  "cross",
  "arrow",
  "parallelogram",
  "trapezoid",
  "wave",
  "zigzag",
];

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

function validateGenerationInput(input = {}) {
  const details = [];
  const generationType = input.generationType || input.generatorId || "shapes";
  const colorPalette = input.colorPalette || input.palette || "mixed";
  const width = parseInteger(input.width, 1920);
  const height = parseInteger(input.height, 1080);
  const shapes = parseInteger(input.shapes ?? input.count, 50);
  const seed =
    input.seed === undefined || input.seed === null || input.seed === ""
      ? createRandomSeed()
      : String(input.seed);
  const shapeTypes = normalizeArray(input.shapeTypes);

  validateRange("width", width, 128, 7680, details);
  validateRange("height", height, 128, 4320, details);
  validateRange("shapes", shapes, 1, 5000, details);

  if (!hasGenerator(generationType)) {
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

  if (details.length > 0) {
    throw new ValidationError("Invalid wallpaper generation request.", details);
  }

  return {
    width,
    height,
    shapes,
    shapeTypes: normalizedShapeTypes,
    colorPalette,
    generationType,
    seed,
    outputFile: input.outputFile,
    generator: getGenerator(generationType),
    options: input.options || {},
  };
}

module.exports = {
  SHAPE_TYPES,
  ValidationError,
  validateGenerationInput,
};
