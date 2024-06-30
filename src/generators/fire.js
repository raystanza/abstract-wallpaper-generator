const { createNoise2D } = require('simplex-noise');
const { getRandomInt, getPaletteColors } = require('../utils');

function drawFire(ctx, width, height, shapes, shapeTypes, colorPaletteName) {
    const noise2D = createNoise2D();
    const imageData = ctx.createImageData(width, height);
    const colorPalette = getPaletteColors(colorPaletteName);

    if (!colorPalette) {
        console.error(`Invalid color palette: ${colorPaletteName}`);
        return;
    }

    function noise(x, y) {
        return (noise2D(x / 100, y / 100) + 1) / 2;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const noiseValue = noise(x, y - height / 2);
            const value = noiseValue * Math.exp(-y / height * 3);
            const color = getFireColor(value, colorPalette);
            setPixel(imageData, x, y, color);
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function getFireColor(value, colorPalette) {
    const index = Math.floor(value * (colorPalette.length - 1));
    const color1 = hexToRgb(colorPalette[index]);
    const color2 = hexToRgb(colorPalette[index + 1] || colorPalette[index]);

    const mix = value * (colorPalette.length - 1) - index;
    const r = Math.floor(color1.r * (1 - mix) + color2.r * mix);
    const g = Math.floor(color1.g * (1 - mix) + color2.g * mix);
    const b = Math.floor(color1.b * (1 - mix) + color2.b * mix);

    return { r, g, b, a: 255 };
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

function setPixel(imageData, x, y, color) {
    const index = (x + y * imageData.width) * 4;
    imageData.data[index + 0] = color.r;
    imageData.data[index + 1] = color.g;
    imageData.data[index + 2] = color.b;
    imageData.data[index + 3] = color.a;
}

module.exports = drawFire;
