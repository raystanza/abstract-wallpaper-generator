const { getRandomPaletteColor, getRandomInt } = require('../utils');

function drawFractal(ctx, width, height, shapes, shapeTypes, colorPalette) {
    function drawBranch(x, y, length, angle, depth) {
        if (depth === 0) return;

        const xEnd = x + length * Math.cos(angle);
        const yEnd = y + length * Math.sin(angle);

        ctx.strokeStyle = getRandomPaletteColor(colorPalette);
        ctx.lineWidth = depth;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        drawBranch(xEnd, yEnd, length * 0.67, angle - Math.PI / 4, depth - 1);
        drawBranch(xEnd, yEnd, length * 0.67, angle + Math.PI / 4, depth - 1);
    }

    ctx.clearRect(0, 0, width, height);
    const depth = getRandomInt(8, 12);
    const initialAngle = -Math.PI / 2;
    ctx.translate(width / 2, height);
    drawBranch(0, 0, height / 3, initialAngle, depth);
    ctx.resetTransform();
}

module.exports = drawFractal;
