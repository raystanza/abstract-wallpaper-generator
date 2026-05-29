const drawBarnsleyFern = require('./barnsley-fern');
const drawBokeh = require('./bokeh');
const drawBubbles = require('./bubbles');
const drawFire = require('./fire');
const drawFractalTree = require('./fractal-tree');
const drawIce = require('./ice');
const drawJuliaSet = require('./julia-set');
const drawKochSnowflake = require('./koch-snowflake');
const drawMandelbrotSet = require('./mandelbrot-set');
const drawShapes = require('./shapes');
const drawSierpinskiTriangle = require('./sierpinski-triangle');
const drawSnow = require('./snow');
const drawWater = require('./water');
const drawWaves = require('./waves');

function legacyRender(render) {
    return (ctx, request) =>
        render(ctx, request.width, request.height, request.shapes, request.shapeTypes, request.colorPalette);
}

const sharedParameters = [
    {
        id: 'colorPalette',
        label: 'Color Palette',
        type: 'palette',
        defaultValue: 'mixed',
    },
    {
        id: 'seed',
        label: 'Seed',
        type: 'text',
        defaultValue: '',
    },
];

const densityParameter = {
    id: 'shapes',
    label: 'Density',
    type: 'number',
    min: 1,
    max: 5000,
    step: 1,
    defaultValue: 50,
};

const generators = {
    shapes: {
        id: 'shapes',
        name: 'Shapes',
        description: 'Layered geometric shapes with randomized size, position, and palette color.',
        category: 'geometry',
        parameters: [
            densityParameter,
            {
                id: 'shapeTypes',
                label: 'Shape Types',
                type: 'multi-select',
                defaultValue: ['circle', 'rectangle', 'triangle', 'hexagon', 'star', 'spiral'],
            },
            ...sharedParameters,
        ],
        render: legacyRender(drawShapes),
    },
    'fractal-tree': {
        id: 'fractal-tree',
        name: 'Fractal Tree',
        description: 'Recursive branching line structure with palette-driven strokes.',
        category: 'fractal',
        parameters: [densityParameter, ...sharedParameters],
        render: legacyRender(drawFractalTree),
    },
    'barnsley-fern': {
        id: 'barnsley-fern',
        name: 'Barnsley Fern',
        description: 'Iterated function system that renders a fern-like fractal.',
        category: 'fractal',
        parameters: [...sharedParameters],
        render: legacyRender(drawBarnsleyFern),
    },
    'julia-set': {
        id: 'julia-set',
        name: 'Julia Set',
        description: 'Complex-plane fractal generated from a randomized Julia constant.',
        category: 'fractal',
        parameters: [...sharedParameters],
        render: legacyRender(drawJuliaSet),
    },
    'koch-snowflake': {
        id: 'koch-snowflake',
        name: 'Koch Snowflake',
        description: 'Recursive triangular snowflake using gradient strokes.',
        category: 'fractal',
        parameters: [...sharedParameters],
        render: legacyRender(drawKochSnowflake),
    },
    'mandelbrot-set': {
        id: 'mandelbrot-set',
        name: 'Mandelbrot Set',
        description: 'Mandelbrot fractal view selected from interesting complex-plane regions.',
        category: 'fractal',
        parameters: [...sharedParameters],
        render: legacyRender(drawMandelbrotSet),
    },
    'sierpinski-triangle': {
        id: 'sierpinski-triangle',
        name: 'Sierpinski Triangle',
        description: 'Recursive triangular subdivision pattern.',
        category: 'fractal',
        parameters: [...sharedParameters],
        render: legacyRender(drawSierpinskiTriangle),
    },
    waves: {
        id: 'waves',
        name: 'Waves',
        description: 'Layered sinusoidal wave lines across the canvas.',
        category: 'pattern',
        parameters: [...sharedParameters],
        render: legacyRender(drawWaves),
    },
    bubbles: {
        id: 'bubbles',
        name: 'Bubbles',
        description: 'Soft translucent bubbles over a palette gradient.',
        category: 'atmospheric',
        parameters: [densityParameter, ...sharedParameters],
        render: legacyRender(drawBubbles),
    },
    bokeh: {
        id: 'bokeh',
        name: 'Bokeh',
        description: 'Blurred circular light layers with depth and glow.',
        category: 'atmospheric',
        parameters: [densityParameter, ...sharedParameters],
        render: legacyRender(drawBokeh),
    },
    fire: {
        id: 'fire',
        name: 'Fire',
        description: 'Noise-based heat texture mapped through the selected palette.',
        category: 'texture',
        parameters: [...sharedParameters],
        render: legacyRender(drawFire),
    },
    ice: {
        id: 'ice',
        name: 'Ice',
        description: 'Crystalline line texture with cool translucent strokes.',
        category: 'texture',
        parameters: [densityParameter, ...sharedParameters],
        render: legacyRender(drawIce),
    },
    snow: {
        id: 'snow',
        name: 'Snow',
        description: 'Snowflake-inspired crystalline pattern.',
        category: 'texture',
        parameters: [densityParameter, ...sharedParameters],
        render: legacyRender(drawSnow),
    },
    water: {
        id: 'water',
        name: 'Water',
        description: 'Concentric ripple fields over a dark background.',
        category: 'texture',
        parameters: [densityParameter, ...sharedParameters],
        render: legacyRender(drawWater),
    },
};

function hasGenerator(id) {
    return Object.prototype.hasOwnProperty.call(generators, id);
}

function getGenerator(id) {
    return generators[id] || null;
}

function listGenerators() {
    return Object.values(generators);
}

function listGeneratorMetadata() {
    return listGenerators().map(({ render, ...metadata }) => metadata);
}

module.exports = {
    generators,
    getGenerator,
    hasGenerator,
    listGeneratorMetadata,
    listGenerators,
};

