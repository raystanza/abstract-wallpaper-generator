const { createCanvas } = require('canvas');
const fs = require('fs');
const { getRandomColor } = require('./utils');

const generators = {};

function registerGenerator(name, generatorFunction) {
    generators[name] = generatorFunction;
}

async function generateWallpaper(width, height, shapes, shapeTypes, colorPalette, generationType, outputFile) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = getRandomColor();
    ctx.fillRect(0, 0, width, height);

    // Draw based on generation type
    const generatorFunction = generators[generationType];

    if (!generatorFunction) {
        const errorMsg = `Unknown generation type: ${generationType}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Check if the generator function is asynchronous
    const isAsync = generatorFunction.constructor.name === 'AsyncFunction';

    if (isAsync) {
        await generatorFunction(ctx, width, height, shapes, shapeTypes, colorPalette, outputFile);
    } else {
        generatorFunction(ctx, width, height, shapes, shapeTypes, colorPalette);
        // Save the image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputFile, buffer);
        console.log('Wallpaper generated:', outputFile);
    }
}

module.exports = { generateWallpaper, registerGenerator };
