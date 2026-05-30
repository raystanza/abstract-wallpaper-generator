import type { RenderMode } from "../../shared/contracts";
import {
  choosePreviewMode,
  clampDevicePixelRatio,
  summarizeRendererCapabilities,
} from "./capabilityHelpers";
import type { BrowserRendererCapabilities } from "./types";

type RendererPreference = RenderMode | undefined;

function getRendererPreference(): RendererPreference {
  const renderer = new URLSearchParams(window.location.search).get("renderer");

  if (renderer === "server") {
    return "server-cpu";
  }

  return undefined;
}

function detectWebGL2(canvas: HTMLCanvasElement) {
  try {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
      stencil: false,
    });

    if (!gl) {
      return {
        available: false,
        error: "context creation failed",
        highpFragment: false,
        maxTextureSize: 0,
      };
    }

    const precision = gl.getShaderPrecisionFormat(
      gl.FRAGMENT_SHADER,
      gl.HIGH_FLOAT,
    );
    const highpFragment = Boolean(precision && precision.precision > 0);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const loseContext = gl.getExtension("WEBGL_lose_context");

    loseContext?.loseContext();

    return {
      available: true,
      highpFragment,
      maxTextureSize,
    };
  } catch (error) {
    return {
      available: false,
      error:
        error instanceof Error ? error.message : "unexpected detection error",
      highpFragment: false,
      maxTextureSize: 0,
    };
  }
}

export function detectRendererCapabilities(): BrowserRendererCapabilities {
  const forcedMode = getRendererPreference();
  const canvas = document.createElement("canvas");
  const devicePixelRatio = window.devicePixelRatio || 1;
  const clampedDevicePixelRatio = clampDevicePixelRatio(devicePixelRatio);
  const capabilitiesWithoutMode = {
    webgl2:
      forcedMode === "server-cpu"
        ? {
            available: false,
            error: "disabled by renderer preference",
            highpFragment: false,
            maxTextureSize: 0,
          }
        : detectWebGL2(canvas),
    webgpu: {
      available: "gpu" in navigator,
    },
    offscreenCanvas: "OffscreenCanvas" in window,
    devicePixelRatio,
    clampedDevicePixelRatio,
  };
  const preferredMode = choosePreviewMode(capabilitiesWithoutMode, forcedMode);
  const capabilities = {
    ...capabilitiesWithoutMode,
    preferredMode,
    diagnostics: summarizeRendererCapabilities(capabilitiesWithoutMode),
  };

  canvas.width = 0;
  canvas.height = 0;

  return capabilities;
}
