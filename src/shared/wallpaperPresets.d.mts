import type { GeneratorMetadata, WallpaperPreset } from "./contracts";
import type { GeneratorSettings } from "./generatorSettings.mjs";

export const SETTINGS_SHARE_VERSION: number;
export const wallpaperPresets: WallpaperPreset[];

export function applyWallpaperPreset(
  preset: WallpaperPreset,
  generators: GeneratorMetadata[],
): { settings: GeneratorSettings | null; errors: string[] };

export function createSettingsSharePayload(settings: GeneratorSettings): {
  version: number;
  settings: GeneratorSettings;
};

export function listWallpaperPresets(): WallpaperPreset[];

export function parseGeneratorSettingsJson(
  json: string,
  generators: GeneratorMetadata[],
): { settings: GeneratorSettings | null; errors: string[] };

export function serializeGeneratorSettings(settings: GeneratorSettings): string;

export function validateWallpaperPreset(
  preset: unknown,
  generators?: GeneratorMetadata[],
): string[];
