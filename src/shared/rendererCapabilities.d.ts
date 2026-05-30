import type { RenderMode } from "./contracts";

export const MAX_DEVICE_PIXEL_RATIO: number;

export type RendererSelectionCapabilities = {
  webgl2?: {
    available: boolean;
    error?: string;
    highpFragment?: boolean;
    maxTextureSize?: number;
  };
  webgpu?: {
    available: boolean;
  };
  offscreenCanvas?: boolean;
  devicePixelRatio?: number;
  clampedDevicePixelRatio?: number;
};

export function clampDevicePixelRatio(value: number, max?: number): number;
export function choosePreviewMode(
  capabilities: RendererSelectionCapabilities,
  forceMode?: RenderMode,
): RenderMode;
export function summarizeRendererCapabilities(
  capabilities: Required<RendererSelectionCapabilities>,
): string[];
