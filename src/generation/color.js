const { getPaletteColors } = require("./palettes");

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHex(hex) {
  let value = String(hex).replace(/^#/, "");

  if (value.length === 3) {
    value = value
      .split("")
      .map((character) => character + character)
      .join("");
  }

  return `#${value.padEnd(6, "0").slice(0, 6)}`;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex).slice(1);
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToCss({ r, g, b }, alpha = 1) {
  return `rgba(${Math.round(clamp(r))}, ${Math.round(clamp(g))}, ${Math.round(clamp(b))}, ${alpha})`;
}

function rgbToHex({ r, g, b }) {
  const channel = (value) =>
    Math.round(clamp(value)).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function mixRgb(colorA, colorB, amount) {
  const t = clamp(amount, 0, 1);
  return {
    r: colorA.r + (colorB.r - colorA.r) * t,
    g: colorA.g + (colorB.g - colorA.g) * t,
    b: colorA.b + (colorB.b - colorA.b) * t,
  };
}

function adjustHex(hex, amount) {
  const rgb = hexToRgb(hex);
  const offset = amount * 255;
  return rgbToHex({
    r: rgb.r + offset,
    g: rgb.g + offset,
    b: rgb.b + offset,
  });
}

function getPalette(paletteName) {
  return getPaletteColors(paletteName) || getPaletteColors("mixed");
}

function samplePalette(paletteName, rng = Math.random) {
  const palette = Array.isArray(paletteName)
    ? paletteName
    : getPalette(paletteName);
  return palette[Math.floor(rng() * palette.length)];
}

function colorAt(paletteName, amount) {
  const palette = Array.isArray(paletteName)
    ? paletteName
    : getPalette(paletteName);

  if (palette.length === 1) {
    return hexToRgb(palette[0]);
  }

  const scaled = clamp(amount, 0, 1) * (palette.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, palette.length - 1);
  const mix = scaled - index;

  return mixRgb(hexToRgb(palette[index]), hexToRgb(palette[nextIndex]), mix);
}

function colorAtCss(paletteName, amount, alpha = 1) {
  return rgbToCss(colorAt(paletteName, amount), alpha);
}

module.exports = {
  adjustHex,
  colorAt,
  colorAtCss,
  getPalette,
  hexToRgb,
  mixRgb,
  normalizeHex,
  rgbToCss,
  rgbToHex,
  samplePalette,
};
