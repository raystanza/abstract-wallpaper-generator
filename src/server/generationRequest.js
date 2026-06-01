function normalizeShapeTypes(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

function normalizeGenerationRequest(body = {}) {
  return {
    width: body.width,
    height: body.height,
    shapes: body.shapes,
    shapeTypes: normalizeShapeTypes(body.shapeTypes),
    colorPalette: body.colorPalette,
    background: body.background,
    backgroundType: body.backgroundType,
    backgroundColor: body.backgroundColor,
    backgroundColor2: body.backgroundColor2,
    backgroundColors: body.backgroundColors,
    backgroundDirection: body.backgroundDirection,
    generationType: body.generationType,
    seed: body.seed,
    options: body.options ?? {},
  };
}

function normalizeExportRequest(body = {}) {
  const size = body.size || {};

  return {
    ...normalizeGenerationRequest({
      ...body,
      width: body.width ?? size.width,
      height: body.height ?? size.height,
    }),
    format: body.format || "png",
    size: {
      width: body.width ?? size.width,
      height: body.height ?? size.height,
    },
  };
}

module.exports = {
  normalizeExportRequest,
  normalizeGenerationRequest,
  normalizeShapeTypes,
};
