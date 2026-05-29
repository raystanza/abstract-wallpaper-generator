const { drawVignette, fillLinearGradient } = require('../generation/canvas');
const { colorAtCss } = require('../generation/color');

function drawBarnsleyFern(ctx, request) {
    const { width, height, shapes, colorPalette, rng } = request;
    const iterations = Math.min(180000, Math.max(45000, shapes * 1700));
    const scaleX = width / 8.8;
    const scaleY = -height / 11.2;
    const offsetX = width * (0.5 + (rng() - 0.5) * 0.08);
    const offsetY = height * 0.96;
    let x = 0;
    let y = 0;

    fillLinearGradient(ctx, width, height, colorPalette, 'vertical');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < iterations; i++) {
        const r = rng();
        let nextX;
        let nextY;

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

        if (i < 20) {
            continue;
        }

        const px = x * scaleX + offsetX;
        const py = y * scaleY + offsetY;
        const t = Math.max(0, Math.min(1, py / height));

        ctx.fillStyle = colorAtCss(colorPalette, 1 - t, 0.22);
        ctx.fillRect(px, py, 0.85, 0.85);
    }

    ctx.restore();
    drawVignette(ctx, width, height, 0.2);
}

module.exports = drawBarnsleyFern;

