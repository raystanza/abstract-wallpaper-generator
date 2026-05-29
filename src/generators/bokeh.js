const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');
const { adjustHex, hexToRgb, rgbToCss, samplePalette } = require('../generation/color');
const { drawVignette, fillLinearGradient } = require('../generation/canvas');

async function drawBokeh(ctx, request) {
    const { width, height, shapes, colorPalette, rng } = request;
    const minDimension = Math.min(width, height);
    const baseCount = Math.min(Math.max(shapes, 18), 240);

    fillLinearGradient(ctx, width, height, colorPalette, 'diagonal');

    const layers = [
        { count: Math.round(baseCount * 0.22), blur: 18, minRadius: 0.08, maxRadius: 0.16, alpha: 0.2 },
        { count: Math.round(baseCount * 0.38), blur: 10, minRadius: 0.04, maxRadius: 0.1, alpha: 0.24 },
        { count: Math.round(baseCount * 0.4), blur: 4, minRadius: 0.015, maxRadius: 0.055, alpha: 0.32 },
    ];

    for (const layer of layers) {
        const layerCanvas = createCanvas(width, height);
        const layerCtx = layerCanvas.getContext('2d');

        for (let i = 0; i < layer.count; i++) {
            const x = rng() * width;
            const y = rng() * height;
            const radius = minDimension * (layer.minRadius + rng() * (layer.maxRadius - layer.minRadius));
            const baseColor = adjustHex(samplePalette(colorPalette, rng), 0.12);
            const rgb = hexToRgb(baseColor);
            const alpha = layer.alpha * (0.5 + rng() * 0.8);

            const gradient = layerCtx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, rgbToCss(rgb, alpha));
            gradient.addColorStop(0.62, rgbToCss(rgb, alpha * 0.38));
            gradient.addColorStop(1, rgbToCss(rgb, 0));

            layerCtx.beginPath();
            layerCtx.arc(x, y, radius, 0, Math.PI * 2);
            layerCtx.fillStyle = gradient;
            layerCtx.fill();
        }

        const blurredLayerBuffer = await sharp(layerCanvas.toBuffer('image/png')).blur(layer.blur).toBuffer();
        const blurredLayerImage = await loadImage(blurredLayerBuffer);
        ctx.drawImage(blurredLayerImage, 0, 0, width, height);
    }

    drawVignette(ctx, width, height, 0.25);
}

module.exports = drawBokeh;

