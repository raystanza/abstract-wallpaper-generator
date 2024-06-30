const { createCanvas } = require('canvas');
const fs = require('fs');
const { drawShapes } = require('./shapes');
const { getRandomColor } = require('./utils');

function generateWallpaper(width, height, outputFile) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = getRandomColor();
    ctx.fillRect(0, 0, width, height);

    // Draw abstract shapes
    drawShapes(ctx, width, height);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    console.log('Wallpaper generated:', outputFile);
}

module.exports = generateWallpaper;
