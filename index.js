// index.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { generateWallpaper, registerGenerator } = require('./src/generateWallpaper');

// Import and register generators
const drawShapes = require('./src/generators/shapes');
const drawFractal = require('./src/generators/fractals');
const drawWaves = require('./src/generators/waves');
const drawBubbles = require('./src/generators/bubbles');
const drawBokeh = require('./src/generators/bokeh');
const drawFire = require('./src/generators/fire');
const drawIce = require('./src/generators/ice');
const drawSnow = require('./src/generators/snow');
const drawWater = require('./src/generators/water');

registerGenerator('shapes', drawShapes);
registerGenerator('fractals', drawFractal);
registerGenerator('waves', drawWaves);
registerGenerator('bubbles', drawBubbles);
registerGenerator('bokeh', drawBokeh);
registerGenerator('fire', drawFire);
registerGenerator('ice', drawIce);
registerGenerator('snow', drawSnow);
registerGenerator('water', drawWater);

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/generate', async (req, res) => {
    const width = parseInt(req.body.width, 10);
    const height = parseInt(req.body.height, 10);
    const shapes = parseInt(req.body.shapes, 10);
    const shapeTypes = Array.isArray(req.body.shapeTypes) ? req.body.shapeTypes : [req.body.shapeTypes];
    const colorPalette = req.body.colorPalette;
    const generationType = req.body.generationType;

    const outputFilename = `wallpaper_${Date.now()}.png`;
    const outputFile = path.join(__dirname, 'output', outputFilename);

    try {
        await generateWallpaper(width, height, shapes, shapeTypes, colorPalette, generationType, outputFile);
        res.sendFile(outputFile);
    } catch (error) {
        console.error('Error generating wallpaper:', error);
        res.status(500).send('An error occurred while generating the wallpaper.');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
