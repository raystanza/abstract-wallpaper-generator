import type { RenderMode } from "../../shared/contracts";
import { generateWallpaper } from "../lib/apiClient";
import { detectRendererCapabilities } from "./capabilities";
import { createWebGLPreviewRenderer } from "./webglPreviewRenderer";
import type {
  BrowserRendererCapabilities,
  PreviewRenderer,
  PreviewRendererOptions,
} from "./types";

export type { BrowserRendererCapabilities, PreviewRenderer };
export { detectRendererCapabilities };

export function createPreviewRenderer(
  canvas: HTMLCanvasElement,
  options: PreviewRendererOptions,
): PreviewRenderer {
  if (options.capabilities.preferredMode === "webgl2") {
    return createWebGLPreviewRenderer(canvas, options);
  }

  throw new Error("No browser preview renderer is available.");
}

export async function renderServerPreview(
  request: Parameters<typeof generateWallpaper>[0],
) {
  return generateWallpaper(request);
}

export function rendererModeLabel(mode: RenderMode) {
  if (mode === "webgl2") {
    return "GPU preview active";
  }

  if (mode === "server-cpu") {
    return "CPU/server fallback";
  }

  return mode;
}
