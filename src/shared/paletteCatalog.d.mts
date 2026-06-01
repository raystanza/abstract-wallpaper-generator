export type PaletteCatalogEntry = {
  id: string;
  name: string;
  category: string;
  colors: string[];
};

export const paletteCatalog: PaletteCatalogEntry[];
export function getPaletteCategories(): string[];
export function getPaletteColors(paletteId: string): string[];
export function getPaletteEntry(
  paletteId: string,
): PaletteCatalogEntry | undefined;
export function listPaletteEntries(): PaletteCatalogEntry[];
export function randomPaletteId(rng?: () => number): string;
