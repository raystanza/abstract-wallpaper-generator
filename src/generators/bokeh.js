const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');

function drawBokeh(ctx, width, height, shapes, shapeTypes, colorPalette) {
    for (let i = 0; i < shapes; i++) {
        const x = getRandomPosition(width);
        const y = getRandomPosition(height);
        const radius = getRandomInt(20, 100);
        const alpha = Math.random() * 0.5 + 0.2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = getRandomPaletteColor(colorPalette);
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

module.exports = drawBokeh;
