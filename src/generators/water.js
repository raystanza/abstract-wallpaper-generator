const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');

function drawWater(ctx, width, height, shapes, shapeTypes, colorPalette) {
    // Clear the canvas with a background color (optional, adjust if needed)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Create water ripple effect
    for (let i = 0; i < shapes; i++) {
        // Random center point for each ripple
        const x = getRandomPosition(width);
        const y = getRandomPosition(height);

        // Random number of ripples for each droplet
        const rippleCount = getRandomInt(2, 8); // Now ripple count varies from 2 to 8
        const baseRadius = getRandomInt(10, 30); // Smaller base radius for more variation
        const maxRadius = getRandomInt(40, 100); // Max radius for outermost ripple

        // Color for the ripple
        const strokeColor = getRandomPaletteColor(['#1E90FF', '#00BFFF', '#87CEFA', '#4682B4']);

        // Draw concentric circles with variable gaps and sizes
        for (let j = 0; j < rippleCount; j++) {
            // Vary the radius more by calculating a random ripple size between the base and max radius
            const currentRadius = baseRadius + (j * (maxRadius - baseRadius)) / rippleCount;
            const alpha = 1 - j / rippleCount; // Fade effect as the ripples expand

            // Vary line width and ripple gaps
            const lineWidth = getRandomInt(1, 3); // Randomized line width for each ripple

            ctx.beginPath();
            ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = strokeColor;
            ctx.globalAlpha = alpha; // Reduce opacity as the ripple grows
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.globalAlpha = 1.0; // Reset opacity
        }
    }
}

module.exports = drawWater;
