// src/generators/barnsley_fern.js
const { getRandomPaletteColor } = require('../utils');

function drawBarnsleyFern(ctx, width, height, shapes, shapeTypes, colorPalette) {
    // Set up scaling
    const scaleX = width / 6;
    const scaleY = -height / 10; // Negative because canvas y-axis is downwards
    const offsetX = width / 2;
    const offsetY = height;

    let x = 0;
    let y = 0;

    const iterations = 100000; // Adjust as needed

    for (let i = 0; i < iterations; i++) {
        let nextX, nextY;
        const r = Math.random();
        if (r < 0.01) {
            nextX = 0;
            nextY = 0.16 * y;
        } else if (r < 0.86) {
            nextX = 0.85 * x + 0.04 * y;
            nextY = -0.04 * x + 0.85 * y + 1.6;
        } else if (r < 0.93) {
            nextX = 0.2 * x - 0.26 * y;
            nextY = 0.23 * x + 0.22 * y + 1.6;
        } else {
            nextX = -0.15 * x + 0.28 * y;
            nextY = 0.26 * x + 0.24 * y + 0.44;
        }
        x = nextX;
        y = nextY;

        // Map to canvas coordinates
        const px = x * scaleX + offsetX;
        const py = y * scaleY + offsetY;

        // Draw a point
        ctx.fillStyle = getRandomPaletteColor(colorPalette);
        ctx.fillRect(px, py, 1, 1);
    }
}

module.exports = drawBarnsleyFern;
