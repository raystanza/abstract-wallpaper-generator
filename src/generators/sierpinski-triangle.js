// src/generators/sierpinski_triangle.js
const { getRandomPaletteColor } = require('../utils');

function drawSierpinskiTriangle(ctx, x, y, size, depth, colorPalette) {
    if (depth === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size / 2, y + (Math.sqrt(3) / 2) * size);
        ctx.lineTo(x - size / 2, y + (Math.sqrt(3) / 2) * size);
        ctx.closePath();
        ctx.fillStyle = getRandomPaletteColor(colorPalette);
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

    const depth = 5; // Adjust recursion depth as needed

    const size = Math.min(width, height) * 0.9;
    const x = width / 2;
    const y = height * 0.05;

    drawSierpinskiTriangle(ctx, x, y, size, depth, colorPalette);
}

module.exports = drawSierpinski;
