import type {
  GenerationRequest,
  GeneratorMetadata,
  RenderMode,
} from "./contracts";
import type { BrowserRendererCapabilities } from "../web/rendering/types";

export const DEFAULT_PREVIEW_DEBOUNCE_MS: number;
export const MAX_PREVIEW_PIXELS: number;

export type PreviewPlanMode = "idle" | "manual" | RenderMode;

export type PreviewMetrics = {
  elapsedMs: number | null;
  mode: RenderMode;
  resolution: string;
  seed: string;
};

export function choosePreviewRenderMode(options: {
  autoPreview: boolean;
  capabilities: BrowserRendererCapabilities | null;
  forceServer?: boolean;
  generator: GeneratorMetadata | undefined;
  request: GenerationRequest | null;
}): PreviewPlanMode;

export function createPreviewMetrics(options: {
  mode: RenderMode;
  request: GenerationRequest | null;
  elapsedMs?: number | null;
}): PreviewMetrics;

export function isExpensivePreviewRequest(
  request: GenerationRequest | null,
  generator: GeneratorMetadata | undefined,
): boolean;

export function previewDebounceMs(
  request: GenerationRequest | null,
  generator: GeneratorMetadata | undefined,
): number;

export function capPreviewSize(
  size: { width: number; height: number } | null | undefined,
  maxPixels?: number,
): { width: number; height: number };

export function serializePreviewRequest(
  request: GenerationRequest | null,
): string;

declare const previewOrchestration: {
  DEFAULT_PREVIEW_DEBOUNCE_MS: number;
  MAX_PREVIEW_PIXELS: number;
  capPreviewSize: typeof capPreviewSize;
  choosePreviewRenderMode: typeof choosePreviewRenderMode;
  createPreviewMetrics: typeof createPreviewMetrics;
  isExpensivePreviewRequest: typeof isExpensivePreviewRequest;
  previewDebounceMs: typeof previewDebounceMs;
  serializePreviewRequest: typeof serializePreviewRequest;
};

export default previewOrchestration;
