const { getRandomPaletteColor } = require('../utils');

function drawKochSnowflake(ctx, width, height, shapes, shapeTypes, colorPalette) {
    function drawKochCurve(x1, y1, x2, y2, depth) {
        if (depth === 0) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            return;
        }

        const deltaX = x2 - x1;
        const deltaY = y2 - y1;

        const xA = x1 + deltaX / 3;
        const yA = y1 + deltaY / 3;

        const xB = x1 + deltaX * 2 / 3;
        const yB = y1 + deltaY * 2 / 3;

        const angle = Math.PI / 3; // 60 degrees in radians
        const xPeak = xA + Math.cos(angle) * (xB - xA) - Math.sin(angle) * (yB - yA);
        const yPeak = yA + Math.sin(angle) * (xB - xA) + Math.cos(angle) * (yB - yA);

        drawKochCurve(x1, y1, xA, yA, depth - 1);
        drawKochCurve(xA, yA, xPeak, yPeak, depth - 1);
        drawKochCurve(xPeak, yPeak, xB, yB, depth - 1);
        drawKochCurve(xB, yB, x2, y2, depth - 1);
    }

    // Set background color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const depth = 4; // Adjust recursion depth as needed

    // Define the initial equilateral triangle
    const size = Math.min(width, height) * 0.6;
    const xCenter = width / 2;
    const yCenter = height / 2;
    const heightOffset = (Math.sqrt(3) / 2) * size;

    const x1 = xCenter - size / 2;
    const y1 = yCenter + heightOffset / 3;

    const x2 = xCenter + size / 2;
    const y2 = y1;

    const x3 = xCenter;
    const y3 = yCenter - (2 * heightOffset) / 3;

    // Set line properties
    ctx.strokeStyle = getRandomPaletteColor(colorPalette);
    ctx.lineWidth = 1;

    // Draw the three sides of the Koch Snowflake
    drawKochCurve(x1, y1, x2, y2, depth);
    drawKochCurve(x2, y2, x3, y3, depth);
    drawKochCurve(x3, y3, x1, y1, depth);
}

module.exports = drawKochSnowflake;
