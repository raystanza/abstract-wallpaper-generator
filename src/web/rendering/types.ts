import type { GenerationRequest, RenderMode } from "../../shared/contracts";

export type WebGL2CapabilityDetails = {
  available: boolean;
  error?: string;
  highpFragment: boolean;
  maxTextureSize: number;
};

export type BrowserRendererCapabilities = {
  webgl2: WebGL2CapabilityDetails;
  webgpu: {
    available: boolean;
  };
  offscreenCanvas: boolean;
  devicePixelRatio: number;
  clampedDevicePixelRatio: number;
  preferredMode: RenderMode;
  diagnostics: string[];
};

export type PreviewRenderResult = {
  mode: RenderMode;
  diagnostics?: string[];
};

export type PreviewRenderer = {
  mode: RenderMode;
  renderPreview(request: GenerationRequest): Promise<PreviewRenderResult>;
  dispose(): void;
};

export type PreviewRendererOptions = {
  capabilities: BrowserRendererCapabilities;
};
