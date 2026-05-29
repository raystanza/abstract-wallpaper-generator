const { drawVignette, fillLinearGradient } = require('../generation/canvas');
const { colorAtCss } = require('../generation/color');

function drawTriangle(ctx, x, y, size, depth, maxDepth, colorPalette) {
    if (depth === 0) {
        const height = (Math.sqrt(3) / 2) * size;
        const t = 1 - maxDepth / 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size / 2, y + height);
        ctx.lineTo(x - size / 2, y + height);
        ctx.closePath();
        ctx.fillStyle = colorAtCss(colorPalette, t + y / (ctx.canvas.height * 2), 0.78);
        ctx.fill();
        return;
    }

    const nextSize = size / 2;
    const height = (Math.sqrt(3) / 4) * size;
    drawTriangle(ctx, x, y, nextSize, depth - 1, maxDepth, colorPalette);
    drawTriangle(ctx, x - size / 4, y + height, nextSize, depth - 1, maxDepth, colorPalette);
    drawTriangle(ctx, x + size / 4, y + height, nextSize, depth - 1, maxDepth, colorPalette);
}

function drawSierpinski(ctx, request) {
    const { width, height, shapes, colorPalette, rng } = request;
    const depth = Math.max(4, Math.min(7, Math.round(4 + shapes / 85)));
    const size = Math.min(width, height) * (0.82 + rng() * 0.08);
    const x = width / 2;
    const y = height * 0.08;

    fillLinearGradient(ctx, width, height, colorPalette, 'diagonal');

    ctx.save();
    ctx.translate(x, y + size * 0.42);
    ctx.rotate((rng() - 0.5) * Math.PI * 0.12);
    ctx.translate(-x, -(y + size * 0.42));
    drawTriangle(ctx, x, y, size, depth, depth, colorPalette);
    ctx.restore();

    drawVignette(ctx, width, height, 0.28);
}

module.exports = drawSierpinski;

