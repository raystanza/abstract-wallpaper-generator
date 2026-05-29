const { createNoise2D } = require('simplex-noise');
const { createCanvas } = require('canvas');
const { colorAt, rgbToCss } = require('../generation/color');
const { drawVignette } = require('../generation/canvas');

function drawFire(ctx, request) {
    const { width, height, colorPalette, rng } = request;
    const noise2D = createNoise2D(rng);
    const maxPixels = 900000;
    const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
    const renderWidth = Math.max(160, Math.round(width * scale));
    const renderHeight = Math.max(90, Math.round(height * scale));
    const imageData = ctx.createImageData(renderWidth, renderHeight);

    for (let y = 0; y < renderHeight; y++) {
        const vertical = 1 - y / renderHeight;
        for (let x = 0; x < renderWidth; x++) {
            const nx = x / renderWidth;
            const ny = y / renderHeight;
            const turbulence =
                (noise2D(nx * 4.2, ny * 4.8 + 0.2) + 1) * 0.32 +
                (noise2D(nx * 11.0, ny * 8.0) + 1) * 0.15;
            const heat = Math.max(0, Math.min(1, vertical ** 1.55 + turbulence - ny * 0.22));
            const color = colorAt(colorPalette, heat);
            const index = (x + y * renderWidth) * 4;

            imageData.data[index] = color.r;
            imageData.data[index + 1] = color.g;
            imageData.data[index + 2] = color.b;
            imageData.data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    if (renderWidth !== width || renderHeight !== height) {
        const source = ctx.getImageData(0, 0, renderWidth, renderHeight);
        const tempCanvas = createCanvas(renderWidth, renderHeight);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(source, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(tempCanvas, 0, 0, width, height);
    }

    ctx.fillStyle = rgbToCss(colorAt(colorPalette, 0.08), 0.22);
    ctx.fillRect(0, 0, width, height * 0.22);
    drawVignette(ctx, width, height, 0.32);
}

module.exports = drawFire;
