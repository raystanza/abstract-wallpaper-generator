const { drawVignette, fillLinearGradient } = require('../generation/canvas');
const { colorAtCss } = require('../generation/color');

function drawWater(ctx, request) {
    const { width, height, shapes, colorPalette, rng } = request;
    const rippleSources = Math.min(Math.max(shapes, 12), 180);

    fillLinearGradient(ctx, width, height, colorPalette, 'vertical');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < rippleSources; i++) {
        const x = rng() * width;
        const y = rng() * height;
        const rippleCount = 3 + Math.floor(rng() * 6);
        const maxRadius = Math.min(width, height) * (0.035 + rng() * 0.09);

        for (let j = 0; j < rippleCount; j++) {
            const t = j / rippleCount;
            const radius = maxRadius * (0.25 + t);

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = colorAtCss(colorPalette, 0.25 + t * 0.6, (1 - t) * 0.42);
            ctx.lineWidth = 1 + (1 - t) * 2;
            ctx.stroke();
        }
    }

    ctx.restore();
    drawVignette(ctx, width, height, 0.36);
}

module.exports = drawWater;

