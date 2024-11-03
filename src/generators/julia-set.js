const { getRandomPaletteColor, getPaletteColors } = require('../utils');

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');

    let r, g, b;

    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }

    return { r, g, b };
}

function drawJuliaSet(ctx, width, height, shapes, shapeTypes, colorPalette) {
    const imageData = ctx.createImageData(width, height);
    const maxIterations = 100;

    // Get the palette colors or fall back to default
    const paletteColors = getPaletteColors(colorPalette) || getPaletteColors('mixed');
    const baseColor = hexToRgb(paletteColors[0]); // Base color for inside the set

    // Define the viewport in the complex plane
    const xmin = -1.5;
    const xmax = 1.5;
    const ymin = -1;
    const ymax = 1;

    // Randomize Julia constant c for different outputs
    const cRe = -0.7 + Math.random() * 1.4 - 0.7;
    const cIm = 0.27015 + Math.random() * 0.5 - 0.25;

    for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            let x = xmin + (xmax - xmin) * px / width;
            let y = ymin + (ymax - ymin) * py / height;

            let iteration = 0;

            while (x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + cRe;
                y = 2 * x * y + cIm;
                x = xTemp;
                iteration++;
            }

            const index = (py * width + px) * 4;
            if (iteration === maxIterations) {
                // Inside the Julia set: use a fixed base color from the palette
                imageData.data[index] = baseColor.r;
                imageData.data[index + 1] = baseColor.g;
                imageData.data[index + 2] = baseColor.b;
                imageData.data[index + 3] = 255;
            } else {
                // Outside the Julia set: get a color from the palette based on iteration
                const color = hexToRgb(getRandomPaletteColor(colorPalette));
                imageData.data[index] = color.r;
                imageData.data[index + 1] = color.g;
                imageData.data[index + 2] = color.b;
                imageData.data[index + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

module.exports = drawJuliaSet;
