const DEFAULT_PREVIEW_DEBOUNCE_MS = 220;
const EXPENSIVE_GENERATOR_CATEGORIES = new Set(["fractal", "simulation"]);
const MAX_PREVIEW_PIXELS = 960 * 540;

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
  }

  return value;
}

function serializePreviewRequest(request) {
  if (!request) {
    return "";
  }

  return JSON.stringify(stableValue(request));
}

function isExpensivePreviewRequest(request, generator) {
  if (!request || !generator) {
    return false;
  }

  return (
    request.shapes >= 2500 ||
    EXPENSIVE_GENERATOR_CATEGORIES.has(generator.category)
  );
}

function previewDebounceMs(request, generator) {
  if (isExpensivePreviewRequest(request, generator)) {
    return 420;
  }

  return DEFAULT_PREVIEW_DEBOUNCE_MS;
}

function capPreviewSize(size, maxPixels = MAX_PREVIEW_PIXELS) {
  const width = Number(size?.width);
  const height = Number(size?.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 960, height: 540 };
  }

  const pixels = width * height;
  if (pixels <= maxPixels) {
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  const scale = Math.sqrt(maxPixels / pixels);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function choosePreviewRenderMode({
  autoPreview,
  capabilities,
  forceServer,
  generator,
  request,
}) {
  if (!request || !generator) {
    return "idle";
  }

  if (!autoPreview) {
    return "manual";
  }

  if (forceServer) {
    return "server-cpu";
  }

  if (capabilities?.preferredMode === "webgl2") {
    return "webgl2";
  }

  return "server-cpu";
}

function createPreviewMetrics({ mode, request, elapsedMs }) {
  return {
    elapsedMs: Number.isFinite(elapsedMs) ? Number(elapsedMs.toFixed(1)) : null,
    mode,
    resolution: request ? `${request.width} x ${request.height}` : "",
    seed: request?.seed || "",
  };
}

const previewOrchestration = {
  DEFAULT_PREVIEW_DEBOUNCE_MS,
  MAX_PREVIEW_PIXELS,
  capPreviewSize,
  choosePreviewRenderMode,
  createPreviewMetrics,
  isExpensivePreviewRequest,
  previewDebounceMs,
  serializePreviewRequest,
};

export {
  DEFAULT_PREVIEW_DEBOUNCE_MS,
  MAX_PREVIEW_PIXELS,
  capPreviewSize,
  choosePreviewRenderMode,
  createPreviewMetrics,
  isExpensivePreviewRequest,
  previewDebounceMs,
  serializePreviewRequest,
};
export default previewOrchestration;
