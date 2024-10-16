const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

async function drawBokeh(ctx, width, height, shapes, shapeTypes, colorPalette, outputFile) {
    // Draw a background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#111');
    bgGradient.addColorStop(1, '#333');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Define layers for depth effect
    const layers = [
        { count: Math.floor(shapes * 0.3), blur: 20, minRadius: 80, maxRadius: 150 },
        { count: Math.floor(shapes * 0.5), blur: 10, minRadius: 40, maxRadius: 80 },
        { count: Math.floor(shapes * 0.2), blur: 5, minRadius: 10, maxRadius: 40 },
    ];

    for (const layer of layers) {
        // Create a new canvas for each layer
        const layerCanvas = createCanvas(width, height);
        const layerCtx = layerCanvas.getContext('2d');

        for (let i = 0; i < layer.count; i++) {
            const x = getRandomPosition(width);
            const y = getRandomPosition(height);
            const radius = getRandomInt(layer.minRadius, layer.maxRadius);
            const alpha = Math.random() * 0.4 + 0.1; // Adjust transparency

            // Slightly vary the color for a natural effect
            const baseColor = getRandomPaletteColor(colorPalette);
            const adjustedColor = adjustColor(baseColor, 0.1);

            // Create radial gradient
            const gradient = layerCtx.createRadialGradient(x, y, 0, x, y, radius);
            const rgbColor = hexToRgb(adjustedColor);

            gradient.addColorStop(0, `rgba(${rgbColor}, ${alpha})`);
            gradient.addColorStop(1, `rgba(${rgbColor}, 0)`);

            layerCtx.beginPath();
            layerCtx.arc(x, y, radius, 0, Math.PI * 2);
            layerCtx.fillStyle = gradient;
            layerCtx.fill();
        }

        // Convert layer to buffer
        const layerBuffer = layerCanvas.toBuffer('image/png');

        // Apply blur to the layer using Sharp
        const blurredLayerBuffer = await sharp(layerBuffer)
            .blur(layer.blur)
            .toBuffer();

        // Load the blurred layer image
        const blurredLayerImage = await loadImage(blurredLayerBuffer);

        // Draw the blurred layer onto the main canvas
        ctx.drawImage(blurredLayerImage, 0, 0, width, height);
    }

    // Save the final image
    const finalBuffer = ctx.canvas.toBuffer('image/png');
    await sharp(finalBuffer).toFile(outputFile);
    console.log('Wallpaper generated:', outputFile);
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    // Remove '#' if present
    hex = hex.replace(/^#/, '');

    let r, g, b;

    if (hex.length === 3) {
        // 3-digit hex
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        // 6-digit hex
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }

    return `${r}, ${g}, ${b}`;
}

// Helper function to adjust color brightness
function adjustColor(hex, amount) {
    const usePound = hex[0] === '#';
    hex = hex.replace(/^#/, '');

    let num = parseInt(hex, 16);
    let r = (num >> 16) + Math.round(amount * 255);
    let g = ((num >> 8) & 0x00FF) + Math.round(amount * 255);
    let b = (num & 0x0000FF) + Math.round(amount * 255);

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return (usePound ? '#' : '') + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

module.exports = drawBokeh;
