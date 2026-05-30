const WALLPAPER_SIZE_LIMITS = {
  width: {
    min: 128,
    max: 7680,
    defaultValue: 1920,
  },
  height: {
    min: 128,
    max: 4320,
    defaultValue: 1080,
  },
};

const DENSITY_LIMITS = {
  min: 1,
  max: 5000,
  step: 1,
  defaultValue: 50,
};

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

const BACKGROUND_TYPES = ["solid", "linear-gradient", "radial-gradient"];
const BACKGROUND_DIRECTIONS = ["diagonal", "vertical", "horizontal"];
const DEFAULT_BACKGROUND = {
  type: "solid",
  colors: ["#101820"],
  direction: "diagonal",
};

const RENDER_MODES = ["server-cpu", "browser-canvas", "webgl2", "webgpu"];
const EXPORT_FORMATS = ["png"];
const CONTRACT_VERSION = 1;

const DEFAULT_RENDERING = {
  modes: ["server-cpu"],
  preferredPreviewMode: "server-cpu",
  exportMode: "server-cpu",
  gpuPreview: false,
};

function toTitleLabel(value) {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toOptions(values) {
  return values.map((value) => ({
    value,
    label: toTitleLabel(value),
  }));
}

function groupForParameter(parameter) {
  if (parameter.group) {
    return parameter.group;
  }

  if (parameter.id === "shapes" || parameter.id === "shapeTypes") {
    return "generator";
  }

  if (parameter.id === "colorPalette" || parameter.id === "background") {
    return "style";
  }

  if (parameter.id === "seed") {
    return "seed";
  }

  return "advanced";
}

function normalizeParameter(parameter, context = {}) {
  const base = {
    id: parameter.id,
    label: parameter.label || toTitleLabel(parameter.id),
    description: parameter.description,
    group: groupForParameter(parameter),
    advanced: Boolean(parameter.advanced),
    type: parameter.type,
  };

  if (parameter.kind) {
    return {
      ...base,
      ...parameter,
      group: parameter.group || base.group,
      advanced: Boolean(parameter.advanced),
    };
  }

  if (parameter.type === "number") {
    return {
      ...base,
      kind: "number",
      min: Number(parameter.min ?? DENSITY_LIMITS.min),
      max: Number(parameter.max ?? DENSITY_LIMITS.max),
      step: Number(parameter.step ?? DENSITY_LIMITS.step),
      defaultValue: Number(
        parameter.defaultValue ?? DENSITY_LIMITS.defaultValue,
      ),
    };
  }

  if (parameter.type === "multi-select") {
    const optionValues =
      parameter.id === "shapeTypes"
        ? SHAPE_TYPES
        : parameter.options?.map((option) => option.value || option) || [];

    return {
      ...base,
      kind: "select",
      multiple: true,
      options: toOptions(optionValues),
      defaultValue: Array.isArray(parameter.defaultValue)
        ? parameter.defaultValue
        : [],
    };
  }

  if (parameter.type === "select") {
    const optionValues =
      parameter.options?.map((option) => option.value || option) || [];

    return {
      ...base,
      kind: "select",
      multiple: false,
      options: toOptions(optionValues),
      defaultValue: String(parameter.defaultValue ?? optionValues[0] ?? ""),
    };
  }

  if (parameter.type === "palette") {
    return {
      ...base,
      kind: "palette",
      options: toOptions(context.paletteNames || []),
      defaultValue: String(parameter.defaultValue || "mixed"),
    };
  }

  if (parameter.type === "background") {
    return {
      ...base,
      kind: "background",
      defaultValue: parameter.defaultValue || DEFAULT_BACKGROUND,
    };
  }

  if (parameter.type === "boolean") {
    return {
      ...base,
      kind: "boolean",
      defaultValue: Boolean(parameter.defaultValue),
    };
  }

  if (parameter.type === "color") {
    return {
      ...base,
      kind: "color",
      defaultValue: String(parameter.defaultValue || "#000000"),
    };
  }

  if (parameter.type === "color-array") {
    return {
      ...base,
      kind: "color-array",
      minItems: Number(parameter.minItems ?? 1),
      maxItems: Number(parameter.maxItems ?? 5),
      defaultValue: Array.isArray(parameter.defaultValue)
        ? parameter.defaultValue
        : [],
    };
  }

  return {
    ...base,
    kind: "text",
    defaultValue: String(parameter.defaultValue ?? ""),
    maxLength: parameter.maxLength,
  };
}

function getParameterDefault(parameters, id, fallback) {
  const parameter = parameters.find((entry) => entry.id === id);
  return parameter?.defaultValue ?? fallback;
}

function createGeneratorDefaults(generator, parameters) {
  return {
    size: {
      width: WALLPAPER_SIZE_LIMITS.width.defaultValue,
      height: WALLPAPER_SIZE_LIMITS.height.defaultValue,
    },
    generationType: generator.id,
    shapes: getParameterDefault(
      parameters,
      "shapes",
      DENSITY_LIMITS.defaultValue,
    ),
    shapeTypes: getParameterDefault(parameters, "shapeTypes", SHAPE_TYPES),
    colorPalette: getParameterDefault(parameters, "colorPalette", "mixed"),
    background: getParameterDefault(
      parameters,
      "background",
      DEFAULT_BACKGROUND,
    ),
    seed: getParameterDefault(parameters, "seed", ""),
    options: {},
  };
}

function normalizeGeneratorMetadata(generator, context = {}) {
  const parameters = (generator.parameters || []).map((parameter) =>
    normalizeParameter(parameter, context),
  );

  return {
    id: generator.id,
    name: generator.name,
    description: generator.description,
    category: generator.category,
    version: CONTRACT_VERSION,
    parameters,
    defaults: createGeneratorDefaults(generator, parameters),
    rendering: {
      ...DEFAULT_RENDERING,
      ...generator.rendering,
    },
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateParameterValue(parameter, value, details, path) {
  if (parameter.kind === "number") {
    if (
      !Number.isFinite(value) ||
      value < parameter.min ||
      value > parameter.max
    ) {
      details.push(
        `${path} must be a number between ${parameter.min} and ${parameter.max}.`,
      );
    }
    return;
  }

  if (parameter.kind === "boolean") {
    if (typeof value !== "boolean") {
      details.push(`${path} must be a boolean.`);
    }
    return;
  }

  if (parameter.kind === "select") {
    const allowedValues = new Set(
      parameter.options.map((option) => option.value),
    );
    const selectedValues = parameter.multiple ? value : [value];

    if (!Array.isArray(selectedValues)) {
      details.push(`${path} must be an array.`);
      return;
    }

    const invalidValues = selectedValues.filter(
      (entry) => !allowedValues.has(entry),
    );
    if (invalidValues.length > 0) {
      details.push(
        `${path} contains unsupported values: ${invalidValues.join(", ")}.`,
      );
    }
    return;
  }

  if (parameter.kind === "text") {
    if (typeof value !== "string") {
      details.push(`${path} must be a string.`);
      return;
    }

    if (parameter.maxLength && value.length > parameter.maxLength) {
      details.push(
        `${path} must be ${parameter.maxLength} characters or fewer.`,
      );
    }
    return;
  }
}

function validateGeneratorOptions(options, generator, context = {}) {
  const details = [];

  if (options === undefined || options === null) {
    return details;
  }

  if (!isPlainObject(options)) {
    return ["options must be an object."];
  }

  const metadata = normalizeGeneratorMetadata(generator, context);
  const optionParameters = metadata.parameters.filter(
    (parameter) => parameter.scope === "options",
  );
  const optionParameterIds = new Set(
    optionParameters.map((parameter) => parameter.id),
  );
  const suppliedOptionIds = Object.keys(options);
  const unsupportedOptionIds = suppliedOptionIds.filter(
    (optionId) => !optionParameterIds.has(optionId),
  );

  if (unsupportedOptionIds.length > 0) {
    details.push(
      `options contains unsupported parameters: ${unsupportedOptionIds.join(", ")}.`,
    );
  }

  for (const parameter of optionParameters) {
    if (Object.prototype.hasOwnProperty.call(options, parameter.id)) {
      validateParameterValue(
        parameter,
        options[parameter.id],
        details,
        `options.${parameter.id}`,
      );
    }
  }

  return details;
}

module.exports = {
  BACKGROUND_DIRECTIONS,
  BACKGROUND_TYPES,
  CONTRACT_VERSION,
  DEFAULT_BACKGROUND,
  DEFAULT_RENDERING,
  DENSITY_LIMITS,
  EXPORT_FORMATS,
  RENDER_MODES,
  SHAPE_TYPES,
  WALLPAPER_SIZE_LIMITS,
  normalizeGeneratorMetadata,
  normalizeParameter,
  toOptions,
  validateGeneratorOptions,
};
