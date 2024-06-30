const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');

function drawIce(ctx, width, height, shapes, shapeTypes, colorPalette) {
    for (let i = 0; i < shapes; i++) {
        const x = getRandomPosition(width);
        const y = getRandomPosition(height);
        const length = getRandomInt(20, 100);
        const angle = Math.random() * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length * Math.cos(angle), y + length * Math.sin(angle));
        ctx.strokeStyle = getRandomPaletteColor(['#00FFFF', '#E0FFFF', '#AFEEEE']);
        ctx.lineWidth = getRandomInt(1, 4);
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

module.exports = drawIce;
