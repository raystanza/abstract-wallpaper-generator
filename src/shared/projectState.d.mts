import type {
  GeneratorMetadata,
  HistorySource,
  ProjectSessionState,
  RenderMode,
  WallpaperHistoryItem,
} from "./contracts";
import type { GeneratorSettings } from "./generatorSettings.mjs";

export const PROJECT_STATE_VERSION: number;
export const MAX_HISTORY_ITEMS: number;
export const PROJECT_STORAGE_KEY: string;

export type ParsedProjectSessionState = Omit<
  ProjectSessionState,
  "settings" | "savedSettings"
> & {
  settings: GeneratorSettings | null;
  savedSettings: GeneratorSettings | null;
};

export function stableStringify(value: unknown): string;

export function createHistorySignature(input: {
  generatorId: string;
  rendererMode: RenderMode;
  resolvedSeed: string;
  settings: GeneratorSettings | Record<string, unknown>;
}): string;

export function createHistoryItem(input: {
  favorite?: boolean;
  generatorId: string;
  paletteColors?: string[];
  rendererMode: RenderMode;
  resolvedSeed: string;
  settings: GeneratorSettings | Record<string, unknown>;
  source?: HistorySource;
  timestamp?: string;
}): WallpaperHistoryItem;

export function limitHistory(
  items: WallpaperHistoryItem[],
  maxItems?: number,
): WallpaperHistoryItem[];

export function upsertHistoryItem(
  history: WallpaperHistoryItem[],
  item: WallpaperHistoryItem,
  maxItems?: number,
): WallpaperHistoryItem[];

export function toggleHistoryFavorite(
  history: WallpaperHistoryItem[],
  itemId: string,
): WallpaperHistoryItem[];

export function removeHistoryItem(
  history: WallpaperHistoryItem[],
  itemId: string,
): WallpaperHistoryItem[];

export function restoreHistorySettings(
  item: WallpaperHistoryItem,
  generators: GeneratorMetadata[],
): { settings: GeneratorSettings | null; errors: string[] };

export function createProjectState(input: {
  history?: WallpaperHistoryItem[];
  savedSettings?: GeneratorSettings | null;
  settings?: GeneratorSettings | null;
}): ProjectSessionState;

export function serializeProjectState(input: {
  history?: WallpaperHistoryItem[];
  savedSettings?: GeneratorSettings | null;
  settings?: GeneratorSettings | null;
}): string;

export function parseProjectState(
  json: string,
  generators: GeneratorMetadata[],
): { state: ParsedProjectSessionState | null; errors: string[] };
