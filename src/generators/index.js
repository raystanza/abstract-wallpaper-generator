const drawBarnsleyFern = require("./barnsley-fern");
const drawBokeh = require("./bokeh");
const drawBubbles = require("./bubbles");
const drawFire = require("./fire");
const drawFlowField = require("./flow-field");
const drawFractalTree = require("./fractal-tree");
const drawIce = require("./ice");
const drawJuliaSet = require("./julia-set");
const drawKochSnowflake = require("./koch-snowflake");
const drawMandelbrotSet = require("./mandelbrot-set");
const drawParticleOrbits = require("./particle-orbits");
const drawShapes = require("./shapes");
const drawSierpinskiTriangle = require("./sierpinski-triangle");
const drawSnow = require("./snow");
const drawTopographicContours = require("./topographic-contours");
const drawVoronoiCells = require("./voronoi-cells");
const drawWater = require("./water");
const drawWaves = require("./waves");
const drawCircuitBoard = require("./circuit-board");

const sharedParameters = [
  {
    id: "colorPalette",
    label: "Motif Palette",
    type: "palette",
    defaultValue: "mixed",
  },
  {
    id: "background",
    label: "Background",
    type: "background",
    defaultValue: {
      type: "solid",
      colors: ["#101820"],
      direction: "diagonal",
    },
  },
  {
    id: "seed",
    label: "Seed",
    type: "text",
    defaultValue: "",
  },
];

const densityParameter = {
  id: "shapes",
  label: "Density",
  type: "number",
  min: 1,
  max: 5000,
  step: 1,
  defaultValue: 50,
};

const generators = {
  shapes: {
    id: "shapes",
    name: "Shapes",
    description:
      "Composed geometric layers over the selected background with controlled scale, opacity, and palette colors.",
    category: "geometry",
    parameters: [
      densityParameter,
      {
        id: "shapeTypes",
        label: "Shape Types",
        type: "multi-select",
        defaultValue: [
          "circle",
          "rectangle",
          "triangle",
          "hexagon",
          "star",
          "spiral",
        ],
      },
      ...sharedParameters,
    ],
    render: drawShapes,
  },
  "fractal-tree": {
    id: "fractal-tree",
    name: "Fractal Tree",
    description:
      "Recursive branching structure with depth controlled by detail and palette-weighted strokes.",
    category: "fractal",
    parameters: [densityParameter, ...sharedParameters],
    render: drawFractalTree,
  },
  "barnsley-fern": {
    id: "barnsley-fern",
    name: "Barnsley Fern",
    description:
      "Iterated function system with dense palette-colored fern points over the selected background.",
    category: "fractal",
    parameters: [densityParameter, ...sharedParameters],
    render: drawBarnsleyFern,
  },
  "julia-set": {
    id: "julia-set",
    name: "Julia Set",
    description:
      "Bounded complex-plane Julia fractal with smooth palette coloring and deterministic seeded constants.",
    category: "fractal",
    parameters: [densityParameter, ...sharedParameters],
    render: drawJuliaSet,
  },
  "koch-snowflake": {
    id: "koch-snowflake",
    name: "Koch Snowflake",
    description:
      "Recursive Koch snowflake with balanced depth, palette strokes, and canvas-safe framing.",
    category: "fractal",
    parameters: [densityParameter, ...sharedParameters],
    render: drawKochSnowflake,
  },
  "mandelbrot-set": {
    id: "mandelbrot-set",
    name: "Mandelbrot Set",
    description:
      "Mandelbrot detail region with smoother iteration coloring and bounded render workload.",
    category: "fractal",
    parameters: [densityParameter, ...sharedParameters],
    render: drawMandelbrotSet,
  },
  "sierpinski-triangle": {
    id: "sierpinski-triangle",
    name: "Sierpinski Triangle",
    description:
      "Recursive triangular subdivision with palette depth and stable composition.",
    category: "fractal",
    parameters: [densityParameter, ...sharedParameters],
    render: drawSierpinskiTriangle,
  },
  waves: {
    id: "waves",
    name: "Waves",
    description:
      "Layered sinusoidal wave fields with palette depth and screen blending.",
    category: "pattern",
    parameters: [densityParameter, ...sharedParameters],
    render: drawWaves,
  },
  bubbles: {
    id: "bubbles",
    name: "Bubbles",
    description:
      "Soft translucent bubble fields with highlights, outlines, and gradient depth.",
    category: "atmospheric",
    parameters: [densityParameter, ...sharedParameters],
    render: drawBubbles,
  },
  bokeh: {
    id: "bokeh",
    name: "Bokeh",
    description:
      "Multi-depth blurred light layers rendered through the shared output pipeline.",
    category: "atmospheric",
    parameters: [densityParameter, ...sharedParameters],
    render: drawBokeh,
  },
  fire: {
    id: "fire",
    name: "Fire",
    description:
      "Bounded noise-based heat texture mapped continuously through the selected palette.",
    category: "texture",
    parameters: [densityParameter, ...sharedParameters],
    render: drawFire,
  },
  ice: {
    id: "ice",
    name: "Ice",
    description:
      "Crystalline shard texture using the selected palette instead of fixed ice colors.",
    category: "texture",
    parameters: [densityParameter, ...sharedParameters],
    render: drawIce,
  },
  snow: {
    id: "snow",
    name: "Snow",
    description:
      "Snowflake-inspired crystal field with palette-aware strokes and seeded rotation.",
    category: "texture",
    parameters: [densityParameter, ...sharedParameters],
    render: drawSnow,
  },
  water: {
    id: "water",
    name: "Water",
    description:
      "Concentric palette-colored ripple fields over the selected background with bounded ripple density.",
    category: "texture",
    parameters: [densityParameter, ...sharedParameters],
    render: drawWater,
  },
  "flow-field": {
    id: "flow-field",
    name: "Flow Field",
    description:
      "Coherent-noise vector field that advects thousands of short palette-colored strokes.",
    category: "algorithmic",
    parameters: [densityParameter, ...sharedParameters],
    render: drawFlowField,
  },
  "voronoi-cells": {
    id: "voronoi-cells",
    name: "Voronoi Cells",
    description:
      "Cellular nearest-site diagram with softened borders and seed-driven site placement.",
    category: "algorithmic",
    parameters: [densityParameter, ...sharedParameters],
    render: drawVoronoiCells,
  },
  "topographic-contours": {
    id: "topographic-contours",
    name: "Topographic Contours",
    description:
      "Noise-warped contour rings that resemble elevation maps and terrain isolines.",
    category: "algorithmic",
    parameters: [densityParameter, ...sharedParameters],
    render: drawTopographicContours,
  },
  "particle-orbits": {
    id: "particle-orbits",
    name: "Particle Orbits",
    description:
      "Particle trails integrated around seeded attractors for orbital motion studies.",
    category: "simulation",
    parameters: [densityParameter, ...sharedParameters],
    render: drawParticleOrbits,
  },
  "circuit-board": {
    id: "circuit-board",
    name: "Circuit Board",
    description:
      "Generative orthogonal traces and nodes inspired by printed circuit board routing.",
    category: "systems",
    parameters: [densityParameter, ...sharedParameters],
    render: drawCircuitBoard,
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
