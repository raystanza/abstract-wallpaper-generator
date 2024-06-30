const { createCanvas } = require('canvas');
const fs = require('fs');
const { getRandomColor } = require('./utils');

const generators = {};

function registerGenerator(name, generatorFunction) {
    generators[name] = generatorFunction;
}

function generateWallpaper(width, height, shapes, shapeTypes, colorPalette, generationType, outputFile) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = getRandomColor();
    ctx.fillRect(0, 0, width, height);

    // Draw based on generation type
    if (generators[generationType]) {
        generators[generationType](ctx, width, height, shapes, shapeTypes, colorPalette);
    } else {
        console.error(`Unknown generation type: ${generationType}`);
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    console.log('Wallpaper generated:', outputFile);
}

module.exports = { generateWallpaper, registerGenerator };
