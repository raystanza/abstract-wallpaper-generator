// index.js
const express = require('express');
const path = require('path');
const { generateWallpaper } = require('./src/generateWallpaper');
const { ValidationError } = require('./src/generation/validation');
const { listGeneratorMetadata } = require('./src/generators');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/generators', (req, res) => {
    res.json({ generators: listGeneratorMetadata() });
});

app.post('/generate', async (req, res) => {
    const shapeTypes = Array.isArray(req.body.shapeTypes) ? req.body.shapeTypes : [req.body.shapeTypes];

    const outputFilename = `wallpaper_${Date.now()}.png`;
    const outputFile = path.join(__dirname, 'output', outputFilename);

    try {
        const result = await generateWallpaper({
            width: req.body.width,
            height: req.body.height,
            shapes: req.body.shapes,
            shapeTypes,
            colorPalette: req.body.colorPalette,
            generationType: req.body.generationType,
            seed: req.body.seed,
            outputFile,
        });

        res.sendFile(result.outputFile);
    } catch (error) {
        console.error('Error generating wallpaper:', error);

        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
                details: error.details,
            });
            return;
        }

        res.status(500).send('An error occurred while generating the wallpaper.');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
