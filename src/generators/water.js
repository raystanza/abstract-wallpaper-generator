const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');

function drawWater(ctx, width, height, shapes, shapeTypes, colorPalette) {
    for (let i = 0; i < shapes; i++) {
        const x = getRandomPosition(width);
        const y = getRandomPosition(height);
        const radius = getRandomInt(30, 80);
        const alpha = Math.random() * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = getRandomPaletteColor(['#1E90FF', '#00BFFF', '#87CEFA']);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = getRandomInt(2, 5);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

module.exports = drawWater;
