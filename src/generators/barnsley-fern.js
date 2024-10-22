const { getRandomPaletteColor, getRandomInt } = require('../utils');

function drawBarnsleyFern(ctx, width, height, shapes, shapeTypes, colorPalette) {
    // Add randomness to scaling and offsets
    const scaleX = (width / 6) * (Math.random() * 0.2 + 0.9); // Random scale factor for X
    const scaleY = -(height / 10) * (Math.random() * 0.2 + 0.9); // Random scale factor for Y
    const offsetX = width / 2 + getRandomInt(-50, 50); // Random horizontal offset
    const offsetY = height + getRandomInt(-50, 50); // Random vertical offset

    let x = 0;
    let y = 0;

    // Randomize the number of iterations slightly for each drawing
    const iterations = getRandomInt(80000, 120000); // Random iteration count between 80k and 120k

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

        // Randomize point size
        const pointSize = Math.random() * 1.5 + 0.5; // Random size between 0.5 and 2

        // Draw a point with random color and size
        ctx.fillStyle = getRandomPaletteColor(colorPalette);
        ctx.fillRect(px, py, pointSize, pointSize);
    }
}

module.exports = drawBarnsleyFern;
