const { getRandomPaletteColor, getRandomInt, getRandomPosition } = require('../utils');

function drawKochSnowflake(ctx, width, height, shapes, shapeTypes, colorPalette) {
    function drawKochCurve(x1, y1, x2, y2, depth, color) {
        if (depth === 0) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = color; // Use gradient color for this line
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

        drawKochCurve(x1, y1, xA, yA, depth - 1, color);
        drawKochCurve(xA, yA, xPeak, yPeak, depth - 1, color);
        drawKochCurve(xPeak, yPeak, xB, yB, depth - 1, color);
        drawKochCurve(xB, yB, x2, y2, depth - 1, color);
    }

    // Set background color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Add randomness to size, depth, line thickness, and rotation
    const depth = getRandomInt(3, 6); // Random recursion depth between 3 and 6
    const randomRotation = getRandomInt(0, 360); // Random rotation angle in degrees
    const randomLineWidth = getRandomInt(1, 5); // Random line width between 1 and 5
    const randomSizeFactor = Math.random() * 0.2 + 0.5; // Randomize size factor between 0.5 and 0.7

    // Define the initial equilateral triangle with random size
    const size = Math.min(width, height) * randomSizeFactor;
    const xCenter = width / 2;
    const yCenter = height / 2;
    const heightOffset = (Math.sqrt(3) / 2) * size;

    const x1 = xCenter - size / 2;
    const y1 = yCenter + heightOffset / 3;

    const x2 = xCenter + size / 2;
    const y2 = y1;

    const x3 = xCenter;
    const y3 = yCenter - (2 * heightOffset) / 3;

    // Randomize line properties
    ctx.lineWidth = randomLineWidth;

    // Randomize whether the lines are solid or dashed
    if (Math.random() > 0.5) {
        const dashLength = getRandomInt(5, 15);
        ctx.setLineDash([dashLength, dashLength]);
    } else {
        ctx.setLineDash([]); // Solid line
    }

    // Apply random rotation to the entire canvas
    ctx.save();
    ctx.translate(xCenter, yCenter); // Move to center
    ctx.rotate((randomRotation * Math.PI) / 180); // Rotate by random degrees
    ctx.translate(-xCenter, -yCenter); // Move back to original position

    // Generate random gradient colors for each side of the snowflake
    const gradient1 = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient1.addColorStop(0, getRandomPaletteColor(colorPalette));
    gradient1.addColorStop(1, getRandomPaletteColor(colorPalette));

    const gradient2 = ctx.createLinearGradient(x2, y2, x3, y3);
    gradient2.addColorStop(0, getRandomPaletteColor(colorPalette));
    gradient2.addColorStop(1, getRandomPaletteColor(colorPalette));

    const gradient3 = ctx.createLinearGradient(x3, y3, x1, y1);
    gradient3.addColorStop(0, getRandomPaletteColor(colorPalette));
    gradient3.addColorStop(1, getRandomPaletteColor(colorPalette));

    // Draw the three sides of the Koch Snowflake with randomness
    drawKochCurve(x1, y1, x2, y2, getRandomInt(3, 6), gradient1); // Random depth for each side
    drawKochCurve(x2, y2, x3, y3, getRandomInt(3, 6), gradient2);
    drawKochCurve(x3, y3, x1, y1, getRandomInt(3, 6), gradient3);

    // Restore canvas to prevent affecting future drawings
    ctx.restore();
}

module.exports = drawKochSnowflake;
