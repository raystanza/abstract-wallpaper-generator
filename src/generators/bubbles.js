const { getRandomPaletteColor, getRandomInt, getRandomPosition, getPaletteColors } = require('../utils');

function drawBubbles(ctx, width, height, shapes, shapeTypes, colorPalette) {
    // Get the palette colors
    const paletteColors = getPaletteColors(colorPalette) || getPaletteColors('mixed');

    // Use two colors from the palette for the background gradient
    const bgColor1 = paletteColors[0];
    const bgColor2 = paletteColors[1 % paletteColors.length]; // Ensures we have at least two colors

    // Draw background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, bgColor1);
    bgGradient.addColorStop(1, bgColor2);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < shapes; i++) {
        const x = getRandomPosition(width);
        const y = getRandomPosition(height);
        const radius = getRandomInt(20, 100);

        // Get a random color from the palette for the bubble
        const bubbleBaseColor = getRandomPaletteColor(colorPalette);
        const baseRgb = hexToRgb(bubbleBaseColor);

        // Create bubble gradient using the palette color
        const bubbleGradient = ctx.createRadialGradient(
            x - radius / 3,
            y - radius / 3,
            radius / 10,
            x,
            y,
            radius
        );
        bubbleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Highlight
        bubbleGradient.addColorStop(0.5, `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.3)`);
        bubbleGradient.addColorStop(1, `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0)`);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = bubbleGradient;
        ctx.fill();

        // Draw bubble outline
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();

        // Add a highlight to simulate light reflection
        const highlightX = x - radius / 3;
        const highlightY = y - radius / 3;
        const highlightRadius = radius / 5;

        ctx.beginPath();
        ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
    }
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

    return { r, g, b };
}

module.exports = drawBubbles;
