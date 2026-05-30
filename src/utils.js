const { colorPalettes, getPaletteColors } = require("./generation/palettes");
const { samplePalette } = require("./generation/color");

// Utility functions
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPosition(max) {
  return Math.random() * max;
}

function getRandomPaletteColor(paletteName) {
  return samplePalette(
    Array.isArray(paletteName)
      ? paletteName
      : getPaletteColors(paletteName) || colorPalettes.mixed,
  );
}

// Improved Perlin noise implementation
class Perlin {
  constructor() {
    this.gradient = [];
    this.permutation = [];
    this.init();
  }

  init() {
    for (let i = 0; i < 256; i++) {
      this.gradient[i] = [
        Math.cos((2 * Math.PI * i) / 256),
        Math.sin((2 * Math.PI * i) / 256),
      ];
      this.permutation[i] = i;
    }
    for (let i = 0; i < 256; i++) {
      const j = Math.floor(Math.random() * 256);
      [this.permutation[i], this.permutation[j]] = [
        this.permutation[j],
        this.permutation[i],
      ];
    }
    this.permutation = this.permutation.concat(this.permutation);
  }

  dotGridGradient(ix, iy, x, y) {
    const gradientIndex = this.permutation[this.permutation[ix] + iy];
    const gradient = this.gradient[gradientIndex % 256];
    const dx = x - ix;
    const dy = y - iy;
    return dx * gradient[0] + dy * gradient[1];
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  noise(x, y) {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const sx = this.fade(x - x0);
    const sy = this.fade(y - y0);

    const n0 = this.dotGridGradient(x0, y0, x, y);
    const n1 = this.dotGridGradient(x1, y0, x, y);
    const ix0 = this.lerp(n0, n1, sx);

    const n2 = this.dotGridGradient(x0, y1, x, y);
    const n3 = this.dotGridGradient(x1, y1, x, y);
    const ix1 = this.lerp(n2, n3, sx);

    return this.lerp(ix0, ix1, sy);
  }
}

const perlin = new Perlin();

function perlinNoise(x) {
  return perlin.noise(x, 0);
}

function getComplexRandom(min, max) {
  const randomValue = perlinNoise(Math.random() * 10); // Adjust scaling as needed
  return Math.floor(randomValue * (max - min + 1)) + min;
}

module.exports = {
  getRandomColor,
  getRandomInt,
  getRandomPosition,
  getRandomPaletteColor,
  getComplexRandom,
  getPaletteColors,
};
