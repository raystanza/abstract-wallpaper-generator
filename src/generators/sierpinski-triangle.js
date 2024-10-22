const { getRandomPaletteColor, getRandomInt } = require('../utils');

function drawSierpinskiTriangle(ctx, x, y, size, depth, colorPalette) {
    if (depth === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size / 2, y + (Math.sqrt(3) / 2) * size);
        ctx.lineTo(x - size / 2, y + (Math.sqrt(3) / 2) * size);
        ctx.closePath();
        ctx.fillStyle = getRandomPaletteColor(colorPalette); // Random color for each triangle
        ctx.fill();
        return;
    }

    // Top triangle
    drawSierpinskiTriangle(ctx, x, y, size / 2, depth - 1, colorPalette);
    // Left triangle
    drawSierpinskiTriangle(ctx, x - size / 4, y + (Math.sqrt(3) / 4) * size, size / 2, depth - 1, colorPalette);
    // Right triangle
    drawSierpinskiTriangle(ctx, x + size / 4, y + (Math.sqrt(3) / 4) * size, size / 2, depth - 1, colorPalette);
}

function drawSierpinski(ctx, width, height, shapes, shapeTypes, colorPalette) {
    // Set background color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Add randomness to depth, size, rotation, and position with reduced variation
    const depth = getRandomInt(3, 6); // Random recursion depth between 3 and 6
    const randomRotation = getRandomInt(-30, 30); // Reduced random rotation between -30 and +30 degrees
    const randomSizeFactor = Math.random() * 0.2 + 0.8; // Reduced randomness in size (80%-100%)

    // Reduced random position offsets to ensure triangle stays in view
    const offsetX = getRandomInt(-width * 0.05, width * 0.05); // Smaller X-axis offset
    const offsetY = getRandomInt(-height * 0.05, height * 0.05); // Smaller Y-axis offset

    const size = Math.min(width, height) * randomSizeFactor; // Randomized triangle size
    const x = (width / 2) + offsetX;
    const y = (height * 0.05) + offsetY;

    // Apply random rotation to the entire canvas
    ctx.save();
    ctx.translate(x, y); // Move to center of the main triangle
    ctx.rotate((randomRotation * Math.PI) / 180); // Rotate the triangle within a reduced range
    ctx.translate(-x, -y); // Move back to original position

    // Draw the Sierpinski triangle with randomness
    drawSierpinskiTriangle(ctx, x, y, size, depth, colorPalette);

    // Restore canvas state after drawing
    ctx.restore();
}

module.exports = drawSierpinski;
