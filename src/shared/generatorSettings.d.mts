import type {
  BackgroundDirection,
  BackgroundSpec,
  BackgroundType,
  GenerationRequest,
  GeneratorMetadata,
  RenderMode,
} from "./contracts";

export type GeneratorSettings = {
  generatorId: string;
  width: number;
  height: number;
  seed: string;
  seedLocked: boolean;
  palette: string;
  background: BackgroundSpec;
  parameters: Record<string, unknown>;
  renderMode: RenderMode;
};

export type ResolutionPreset = {
  label: string;
  value: string;
  width: number;
  height: number;
};

export const BACKGROUND_DIRECTIONS: BackgroundDirection[];
export const BACKGROUND_TYPES: BackgroundType[];
export const DEFAULT_BACKGROUND: BackgroundSpec;
export const WALLPAPER_SIZE_LIMITS: {
  width: { min: number; max: number; defaultValue: number };
  height: { min: number; max: number; defaultValue: number };
};
export const resolutionPresets: ResolutionPreset[];

declare const helpers: {
  BACKGROUND_DIRECTIONS: typeof BACKGROUND_DIRECTIONS;
  BACKGROUND_TYPES: typeof BACKGROUND_TYPES;
  DEFAULT_BACKGROUND: BackgroundSpec;
  WALLPAPER_SIZE_LIMITS: typeof WALLPAPER_SIZE_LIMITS;
  createDefaultGeneratorSettings: (
    generator: GeneratorMetadata,
    overrides?: Partial<GeneratorSettings>,
  ) => GeneratorSettings;
  createGenerationRequest: (
    settings: GeneratorSettings,
    generator: GeneratorMetadata,
    options?: {
      previewSize?: { width: number; height: number };
      seedFallback?: string;
    },
  ) => GenerationRequest;
  createParameterValues: (
    generator: GeneratorMetadata,
    currentValues?: Record<string, unknown>,
  ) => Record<string, unknown>;
  normalizeBackground: (value: unknown) => BackgroundSpec;
  normalizeHexColor: (value: unknown, fallback?: string) => string;
  parameterValueIsValid: (parameter: unknown, value: unknown) => boolean;
  presetValueForSize: (width: number, height: number) => string;
  resolutionPresets: ResolutionPreset[];
  sanitizeGeneratorSettings: (
    settings: GeneratorSettings,
    generator: GeneratorMetadata,
  ) => GeneratorSettings;
  sanitizeParameterValue: (parameter: unknown, value: unknown) => unknown;
  switchGeneratorSettings: (
    settings: GeneratorSettings,
    nextGenerator: GeneratorMetadata,
  ) => GeneratorSettings;
  updateGeneratorParameter: (
    settings: GeneratorSettings,
    generator: GeneratorMetadata,
    parameterId: string,
    value: unknown,
  ) => GeneratorSettings;
  updateGeneratorSize: (
    settings: GeneratorSettings,
    generator: GeneratorMetadata,
    size: { width: unknown; height: unknown },
  ) => GeneratorSettings;
  validateGeneratorSettings: (
    settings: GeneratorSettings,
    generator: GeneratorMetadata,
  ) => string[];
};

export default helpers;
