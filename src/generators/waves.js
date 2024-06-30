const { getRandomPaletteColor, getRandomInt } = require('../utils');

function drawWaves(ctx, width, height, shapes, shapeTypes, colorPalette) {
    const waveHeight = height / 20;
    const amplitude = 20;
    const frequency = 0.1;

    ctx.clearRect(0, 0, width, height);

    for (let y = 0; y < height; y += waveHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);

        for (let x = 0; x < width; x++) {
            ctx.lineTo(x, y + Math.sin(x * frequency + y * 0.5) * amplitude);
        }

        ctx.strokeStyle = getRandomPaletteColor(colorPalette);
        ctx.lineWidth = getRandomInt(2, 5);
        ctx.stroke();
    }
}

module.exports = drawWaves;
