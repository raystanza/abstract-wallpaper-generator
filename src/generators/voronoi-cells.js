const { createCanvas } = require('canvas');
const { colorAt, colorAtCss } = require('../generation/color');
const { drawVignette } = require('../generation/canvas');

function drawVoronoiCells(ctx, request) {
    const { width, height, shapes, colorPalette, rng } = request;
    const siteCount = Math.min(140, Math.max(24, Math.round(shapes * 1.4)));
    const maxPixels = 520000;
    const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
    const renderWidth = Math.max(180, Math.round(width * scale));
    const renderHeight = Math.max(100, Math.round(height * scale));
    const sites = Array.from({ length: siteCount }, (_, index) => ({
        x: rng() * renderWidth,
        y: rng() * renderHeight,
        t: index / Math.max(1, siteCount - 1),
    }));
    const imageData = ctx.createImageData(renderWidth, renderHeight);

    for (let y = 0; y < renderHeight; y++) {
        for (let x = 0; x < renderWidth; x++) {
            let nearest = Infinity;
            let second = Infinity;
            let nearestSite = sites[0];

            for (const site of sites) {
                const dx = x - site.x;
                const dy = y - site.y;
                const distance = dx * dx + dy * dy;

                if (distance < nearest) {
                    second = nearest;
                    nearest = distance;
                    nearestSite = site;
                } else if (distance < second) {
                    second = distance;
                }
            }

            const edge = Math.sqrt(second) - Math.sqrt(nearest);
            const shade = Math.max(0, Math.min(1, nearestSite.t * 0.82 + edge / 90));
            const color = colorAt(colorPalette, shade);
            const index = (y * renderWidth + x) * 4;
            imageData.data[index] = color.r;
            imageData.data[index + 1] = color.g;
            imageData.data[index + 2] = color.b;
            imageData.data[index + 3] = 255;
        }
    }

    if (renderWidth === width && renderHeight === height) {
        ctx.putImageData(imageData, 0, 0);
    } else {
        const tempCanvas = createCanvas(renderWidth, renderHeight);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(tempCanvas, 0, 0, width, height);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    sites.forEach((site) => {
        const x = (site.x / renderWidth) * width;
        const y = (site.y / renderHeight) * height;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.5, Math.min(width, height) * 0.003), 0, Math.PI * 2);
        ctx.fillStyle = colorAtCss(colorPalette, site.t, 0.5);
        ctx.fill();
    });
    ctx.restore();

    drawVignette(ctx, width, height, 0.25);
}

module.exports = drawVoronoiCells;

