const { getRandomPaletteColor, getRandomInt } = require('../utils');

function drawFractalTree(ctx, width, height, shapes, shapeTypes, colorPalette) {
    function drawBranch(x, y, length, angle, depth, branchWidth, colorPalette) {
        if (depth === 0) return;

        // Set line properties
        ctx.lineWidth = branchWidth;
        ctx.strokeStyle = getRandomPaletteColor(colorPalette);

        // Calculate the end point of the branch
        const xEnd = x + length * Math.cos(angle);
        const yEnd = y + length * Math.sin(angle);

        // Draw the branch
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        // Decrease depth and branch width for the next level
        const newDepth = depth - 1;
        const newBranchWidth = branchWidth * (0.7 + Math.random() * 0.1); // Randomly decrease branch width

        // Randomize the branch length
        const lengthFactor = 0.7 + Math.random() * 0.05; // Between 0.7 and 0.75
        const newLength = length * lengthFactor;

        // Randomize the angle variation
        const angleVariation = Math.PI / 8 + Math.random() * (Math.PI / 16); // Between 22.5° and 33.75°

        // Randomly decide the number of branches (2 or 3)
        const branches = getRandomInt(2, 3);

        if (branches >= 2) {
            // Left branch
            drawBranch(xEnd, yEnd, newLength, angle - angleVariation, newDepth, newBranchWidth, colorPalette);
            // Right branch
            drawBranch(xEnd, yEnd, newLength, angle + angleVariation, newDepth, newBranchWidth, colorPalette);
        }
        if (branches === 3) {
            // Center branch
            drawBranch(xEnd, yEnd, newLength, angle, newDepth, newBranchWidth, colorPalette);
        }
    }

    // Set background color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Adjusted initial settings
    const depth = getRandomInt(8, 12);
    const initialAngle = -Math.PI / 2; // Start pointing upwards
    const initialBranchWidth = 10;

    // Adjust starting position and initial branch length
    const startX = width / 2;
    const startY = height * 1.3; // Start 10% below the bottom of the canvas
    const initialBranchLength = height * 0.35; // Reduced initial length to 35% of canvas height

    // Save the context state
    ctx.save();

    // Move to the starting position
    ctx.translate(startX, startY);

    // Draw the fractal tree
    drawBranch(0, 0, initialBranchLength, initialAngle, depth, initialBranchWidth, colorPalette);

    // Restore the context state
    ctx.restore();
}

module.exports = drawFractalTree;
