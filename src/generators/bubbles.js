const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');

function drawBubbles(ctx, width, height, shapes, shapeTypes, colorPalette) {
    for (let i = 0; i < shapes; i++) {
        const x = getRandomPosition(width);
        const y = getRandomPosition(height);
        const radius = getRandomInt(20, 100);
        const alpha = Math.random() * 0.3 + 0.2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = getRandomPaletteColor(['#ADD8E6', '#87CEEB', '#B0E0E6']);
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();
    }
}

module.exports = drawBubbles;
