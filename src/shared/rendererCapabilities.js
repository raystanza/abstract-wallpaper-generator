const MAX_DEVICE_PIXEL_RATIO = 2;

function clampDevicePixelRatio(value, max = MAX_DEVICE_PIXEL_RATIO) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.min(value, max);
}

function choosePreviewMode(capabilities, forceMode) {
  if (forceMode === "server-cpu") {
    return "server-cpu";
  }

  if (capabilities?.webgl2?.available) {
    return "webgl2";
  }

  return "server-cpu";
}

function summarizeRendererCapabilities(capabilities) {
  const details = [];

  details.push(
    capabilities.webgl2.available
      ? `WebGL2 ${capabilities.webgl2.maxTextureSize}px texture limit`
      : `WebGL2 unavailable${capabilities.webgl2.error ? `: ${capabilities.webgl2.error}` : ""}`,
  );
  details.push(
    capabilities.webgl2.highpFragment
      ? "highp fragment precision"
      : "limited fragment precision",
  );
  details.push(
    capabilities.offscreenCanvas
      ? "OffscreenCanvas available"
      : "OffscreenCanvas unavailable",
  );
  details.push(
    capabilities.webgpu.available ? "WebGPU detected" : "WebGPU unavailable",
  );
  details.push(
    `DPR ${capabilities.devicePixelRatio} clamped to ${capabilities.clampedDevicePixelRatio}`,
  );

  return details;
}

module.exports = {
  MAX_DEVICE_PIXEL_RATIO,
  choosePreviewMode,
  clampDevicePixelRatio,
  summarizeRendererCapabilities,
};
