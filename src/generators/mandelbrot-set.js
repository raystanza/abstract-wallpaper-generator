const { colorAt } = require("../generation/color");
const { drawVignette } = require("../generation/canvas");

const regions = [
  { x: -0.7435, y: 0.1319, zoom: 10 },
  { x: -0.77568377, y: 0.13646737, zoom: 18 },
  { x: -1.25066, y: 0.02012, zoom: 8 },
  { x: -0.101, y: 0.838, zoom: 12 },
  { x: -1.768, y: 0.004, zoom: 16 },
  { x: 0.285, y: 0.01, zoom: 10 },
  { x: -0.74529, y: 0.113075, zoom: 22 },
  { x: -1.401155, y: 0, zoom: 6 },
];

function drawMandelbrotSet(ctx, request) {
  const { width, height, colorPalette, rng } = request;
  const maxPixels = 760000;
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
  const renderWidth = Math.max(180, Math.round(width * scale));
  const renderHeight = Math.max(100, Math.round(height * scale));
  const imageData = ctx.createImageData(renderWidth, renderHeight);
  const maxIterations = 360;
  const region = regions[Math.floor(rng() * regions.length)];
  const zoom = region.zoom * (0.75 + rng() * 0.55);
  const aspect = width / height;
  const rangeY = 2.2 / zoom;
  const rangeX = rangeY * aspect;
  const xmin = region.x - rangeX / 2;
  const ymin = region.y - rangeY / 2;

  for (let py = 0; py < renderHeight; py++) {
    for (let px = 0; px < renderWidth; px++) {
      const x0 = xmin + (rangeX * px) / renderWidth;
      const y0 = ymin + (rangeY * py) / renderHeight;
      let x = 0;
      let y = 0;
      let iteration = 0;

      while (x * x + y * y <= 4 && iteration < maxIterations) {
        const xTemp = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xTemp;
        iteration++;
      }

      const smooth =
        iteration === maxIterations ? 0 : Math.sqrt(iteration / maxIterations);
      const color = colorAt(colorPalette, smooth);
      const index = (py * renderWidth + px) * 4;
      imageData.data[index] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  if (renderWidth !== width || renderHeight !== height) {
    const { createCanvas } = require("canvas");
    const tempCanvas = createCanvas(renderWidth, renderHeight);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tempCanvas, 0, 0, width, height);
  }

  drawVignette(ctx, width, height, 0.28);
}

module.exports = drawMandelbrotSet;
