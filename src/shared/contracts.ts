export type GeneratorId = string;
export type Seed = string;
export type ColorPalette = string;

export type WallpaperSize = {
  width: number;
  height: number;
};

export type BackgroundType = "solid" | "linear-gradient" | "radial-gradient";
export type BackgroundDirection = "diagonal" | "vertical" | "horizontal";

export type BackgroundSpec = {
  type: BackgroundType;
  colors: string[];
  direction: BackgroundDirection;
};

export type RenderMode = "server-cpu" | "browser-canvas" | "webgl2" | "webgpu";

export type ExportFormat = "png";

export type ParameterGroup =
  | "canvas"
  | "style"
  | "generator"
  | "seed"
  | "advanced";

export type ParameterOption = {
  value: string;
  label: string;
};

export type BaseGeneratorParameter = {
  id: string;
  label: string;
  description?: string;
  group: ParameterGroup;
  advanced: boolean;
  scope?: "request" | "options";
  defaultValue?: unknown;
  type?: string;
};

export type NumberGeneratorParameter = BaseGeneratorParameter & {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
  step: number;
};

export type BooleanGeneratorParameter = BaseGeneratorParameter & {
  kind: "boolean";
  defaultValue: boolean;
};

export type SelectGeneratorParameter = BaseGeneratorParameter & {
  kind: "select";
  defaultValue: string | string[];
  multiple: boolean;
  options: ParameterOption[];
};

export type TextGeneratorParameter = BaseGeneratorParameter & {
  kind: "text";
  defaultValue: string;
  maxLength?: number;
};

export type ColorGeneratorParameter = BaseGeneratorParameter & {
  kind: "color";
  defaultValue: string;
};

export type ColorArrayGeneratorParameter = BaseGeneratorParameter & {
  kind: "color-array";
  defaultValue: string[];
  minItems: number;
  maxItems: number;
};

export type PaletteGeneratorParameter = BaseGeneratorParameter & {
  kind: "palette";
  defaultValue: ColorPalette;
  options: ParameterOption[];
};

export type BackgroundGeneratorParameter = BaseGeneratorParameter & {
  kind: "background";
  defaultValue: BackgroundSpec;
};

export type ParameterGroupGeneratorParameter = BaseGeneratorParameter & {
  kind: "group";
  children: GeneratorParameter[];
};

export type GeneratorParameter =
  | NumberGeneratorParameter
  | BooleanGeneratorParameter
  | SelectGeneratorParameter
  | TextGeneratorParameter
  | ColorGeneratorParameter
  | ColorArrayGeneratorParameter
  | PaletteGeneratorParameter
  | BackgroundGeneratorParameter
  | ParameterGroupGeneratorParameter;

export type GeneratorDefaults = {
  size: WallpaperSize;
  generationType: GeneratorId;
  shapes: number;
  shapeTypes: string[];
  colorPalette: ColorPalette;
  background: BackgroundSpec;
  seed: Seed;
  options: Record<string, unknown>;
};

export type RendererCapability = {
  modes: RenderMode[];
  preferredPreviewMode: RenderMode;
  exportMode: RenderMode;
  gpuPreview: boolean;
};

export type GeneratorMetadata = {
  id: GeneratorId;
  name: string;
  description: string;
  category: string;
  version: number;
  parameters: GeneratorParameter[];
  defaults: GeneratorDefaults;
  rendering: RendererCapability;
};

export type PresetSeedBehavior = "fixed" | "random" | "locked";

export type WallpaperPreset = {
  id: string;
  name: string;
  generatorId: GeneratorId;
  size: WallpaperSize;
  seed: Seed;
  seedBehavior: PresetSeedBehavior;
  palette: ColorPalette;
  background: BackgroundSpec;
  parameters: Record<string, unknown>;
  tags: string[];
};

export type GenerationRequest = {
  width: number;
  height: number;
  shapes: number;
  shapeTypes?: string[];
  colorPalette: ColorPalette;
  background?: BackgroundSpec;
  generationType: GeneratorId;
  seed?: Seed;
  options?: Record<string, unknown>;
};

export type GenerationResultMetadata = {
  generationType: GeneratorId;
  width: number;
  height: number;
  colorPalette: ColorPalette;
  background: BackgroundSpec;
  seed: Seed;
  filename?: string;
  elapsedMs?: number;
};

export type ExportRequest = GenerationRequest & {
  format: ExportFormat;
  size?: WallpaperSize;
  batchSeeds?: Seed[];
};

export type ExportResultMetadata = GenerationResultMetadata & {
  format: ExportFormat;
  renderer: RenderMode;
};

export type HistorySource = "preview" | "export" | "manual";

export type HistoryThumbnailSpec = {
  type: "palette";
  colors: string[];
};

export type WallpaperHistoryItem = {
  id: string;
  timestamp: string;
  generatorId: GeneratorId;
  settings: Record<string, unknown>;
  resolvedSeed: Seed;
  thumbnail: HistoryThumbnailSpec;
  rendererMode: RenderMode;
  favorite: boolean;
  source: HistorySource;
  signature: string;
};

export type ProjectSessionState = {
  version: number;
  updatedAt: string;
  settings: Record<string, unknown> | null;
  savedSettings: Record<string, unknown> | null;
  history: WallpaperHistoryItem[];
};

export type GeneratorResponse = {
  generators: GeneratorMetadata[];
};

export type ApiErrorBody = {
  error: string;
  code: string;
  details?: string[];
};

export type HealthResponse = {
  status: "ok";
  contractVersion: number;
  renderer: RenderMode;
};

export type GenerateWallpaperResponse = {
  blob: Blob;
  metadata: GenerationResultMetadata;
};
