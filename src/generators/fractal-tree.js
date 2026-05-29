const { drawVignette, fillLinearGradient } = require('../generation/canvas');
const { colorAtCss } = require('../generation/color');

function drawFractalTree(ctx, request) {
    const { width, height, shapes, colorPalette, rng } = request;
    const depth = Math.max(7, Math.min(12, Math.round(7 + shapes / 18)));
    const startLength = height * (0.22 + rng() * 0.12);

    fillLinearGradient(ctx, width, height, colorPalette, 'vertical');

    function drawBranch(x, y, length, angle, currentDepth, branchWidth) {
        if (currentDepth <= 0 || length < 2) {
            return;
        }

        const progress = 1 - currentDepth / depth;
        const xEnd = x + Math.cos(angle) * length;
        const yEnd = y + Math.sin(angle) * length;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.lineWidth = branchWidth;
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorAtCss(colorPalette, progress, 0.52 + progress * 0.35);
        ctx.stroke();

        const branchCount = currentDepth > depth - 3 ? 2 : 2 + Math.floor(rng() * 2);
        const spread = Math.PI * (0.13 + rng() * 0.13);

        for (let i = 0; i < branchCount; i++) {
            const offset = branchCount === 1 ? 0 : (i / (branchCount - 1) - 0.5) * 2;
            drawBranch(
                xEnd,
                yEnd,
                length * (0.66 + rng() * 0.08),
                angle + offset * spread + (rng() - 0.5) * 0.1,
                currentDepth - 1,
                branchWidth * (0.66 + rng() * 0.08)
            );
        }
    }

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    drawBranch(width / 2, height * 1.04, startLength, -Math.PI / 2, depth, Math.max(4, width * 0.008));
    ctx.restore();

    drawVignette(ctx, width, height, 0.24);
}

module.exports = drawFractalTree;

