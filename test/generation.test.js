const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const { renderWallpaper } = require('../src/generateWallpaper');
const { ValidationError, validateGenerationInput } = require('../src/generation/validation');
const { getGenerator, listGeneratorMetadata } = require('../src/generators');

test('generator registry exposes metadata without render functions', () => {
    const metadata = listGeneratorMetadata();
    const ids = metadata.map((generator) => generator.id);

    assert.ok(ids.includes('shapes'));
    assert.ok(ids.includes('waves'));
    assert.equal(getGenerator('shapes').name, 'Shapes');
    assert.equal(Object.prototype.hasOwnProperty.call(metadata[0], 'render'), false);
});

test('generation validation rejects unsupported generator and palette values', () => {
    assert.throws(
        () =>
            validateGenerationInput({
                width: 640,
                height: 360,
                shapes: 10,
                generationType: 'missing-generator',
                colorPalette: 'mixed',
            }),
        ValidationError
    );

    assert.throws(
        () =>
            validateGenerationInput({
                width: 640,
                height: 360,
                shapes: 10,
                generationType: 'shapes',
                colorPalette: 'missing-palette',
            }),
        ValidationError
    );
});

test('renderWallpaper writes png output for representative generators', async () => {
    const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'awg-'));
    const cases = ['shapes', 'waves'];

    try {
        for (const generationType of cases) {
            const outputFile = path.join(outputDirectory, `${generationType}.png`);
            const result = await renderWallpaper({
                width: 320,
                height: 180,
                shapes: 8,
                shapeTypes: ['circle', 'rectangle'],
                colorPalette: 'mixed',
                generationType,
                seed: `test-${generationType}`,
                outputFile,
            });

            assert.equal(result.outputFile, outputFile);
            assert.equal(fs.existsSync(outputFile), true);
            assert.ok(fs.statSync(outputFile).size > 100);
        }
    } finally {
        fs.rmSync(outputDirectory, { recursive: true, force: true });
    }
});

