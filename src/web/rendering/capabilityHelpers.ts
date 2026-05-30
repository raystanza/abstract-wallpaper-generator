import type { RenderMode } from "../../shared/contracts";
import type { BrowserRendererCapabilities } from "./types";

const maxDevicePixelRatio = 2;

export function clampDevicePixelRatio(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.min(value, maxDevicePixelRatio);
}

export function choosePreviewMode(
  capabilities: Pick<BrowserRendererCapabilities, "webgl2">,
  forceMode?: RenderMode,
): RenderMode {
  if (forceMode === "server-cpu") {
    return "server-cpu";
  }

  if (capabilities.webgl2.available) {
    return "webgl2";
  }

  return "server-cpu";
}

export function summarizeRendererCapabilities(
  capabilities: Omit<
    BrowserRendererCapabilities,
    "diagnostics" | "preferredMode"
  >,
) {
  const details = [];

  details.push(
    capabilities.webgl2.available
      ? `WebGL2 ${capabilities.webgl2.maxTextureSize}px texture limit`
      : `WebGL2 unavailable${
          capabilities.webgl2.error ? `: ${capabilities.webgl2.error}` : ""
        }`,
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
