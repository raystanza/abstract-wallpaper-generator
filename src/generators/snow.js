const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');

function drawSnowflake(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Draw a hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(
            x + size * Math.cos((i * Math.PI) / 3),
            y + size * Math.sin((i * Math.PI) / 3)
        );
    }
    ctx.closePath();
    ctx.stroke();

    // Draw lines within the hexagon to mimic snowflake patterns
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const xEnd = x + size * Math.cos(angle);
        const yEnd = y + size * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        // Draw smaller branches
        const branchSize = size * 0.5;
        const branchAngle1 = angle + Math.PI / 6;
        const branchAngle2 = angle - Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(xEnd, yEnd);
        ctx.lineTo(xEnd + branchSize * Math.cos(branchAngle1), yEnd + branchSize * Math.sin(branchAngle1));
        ctx.moveTo(xEnd, yEnd);
        ctx.lineTo(xEnd + branchSize * Math.cos(branchAngle2), yEnd + branchSize * Math.sin(branchAngle2));
        ctx.stroke();
    }
}

function drawSnow(ctx, width, height, shapes, shapeTypes, colorPalette) {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < shapes; i++) {
        const x = getRandomPosition(width);
        const y = getRandomPosition(height);
        const size = getRandomInt(10, 30);
        const color = getRandomPaletteColor(colorPalette);

        drawSnowflake(ctx, x, y, size, color);
    }
}

module.exports = drawSnow;
