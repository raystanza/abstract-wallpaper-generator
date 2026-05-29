const fs = require('fs');
const { createCanvas } = require('canvas');
const { validateGenerationInput } = require('./validation');
const { ensureOutputDirectory } = require('./output');
const { getPaletteColors } = require('./palettes');
const { createSeededRandom, withSeededMathRandom } = require('../random');
const { getRandomColor } = require('../utils');

async function renderWallpaper(input) {
    const request = validateGenerationInput(input);
    const canvas = createCanvas(request.width, request.height);
    const ctx = canvas.getContext('2d');
    const rng = createSeededRandom(request.seed);

    await withSeededMathRandom(request.seed, async () => {
        ctx.fillStyle = getRandomColor();
        ctx.fillRect(0, 0, request.width, request.height);

        await request.generator.render(ctx, {
            ...request,
            canvas,
            palette: getPaletteColors(request.colorPalette),
            rng,
        });
    });

    const buffer = canvas.toBuffer('image/png');
    ensureOutputDirectory(request.outputFile);
    fs.writeFileSync(request.outputFile, buffer);

    return {
        outputFile: request.outputFile,
        buffer,
        width: request.width,
        height: request.height,
        generationType: request.generationType,
        colorPalette: request.colorPalette,
        seed: request.seed,
    };
}

module.exports = {
    renderWallpaper,
};

