import { getPaletteColors } from "../../shared/paletteCatalog.mjs";

export function getPreviewPalette(paletteName: string): string[] {
  return getPaletteColors(paletteName);
}

export function hexToUnitRgb(hexColor: string): [number, number, number] {
  const normalized = hexColor.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : normalized;
  const value = Number.parseInt(expanded, 16);

  if (!Number.isFinite(value)) {
    return [0, 0, 0];
  }

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function paletteUniform(paletteName: string): Float32Array {
  const colors = getPreviewPalette(paletteName).slice(0, 5);

  while (colors.length < 5) {
    colors.push(colors[colors.length - 1] ?? "#000000");
  }

  return new Float32Array(colors.flatMap(hexToUnitRgb));
}
