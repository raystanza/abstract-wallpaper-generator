const { colorAt } = require("../generation/color");
const { drawVignette } = require("../generation/canvas");

function drawJuliaSet(ctx, request) {
  const { width, height, colorPalette, rng } = request;
  const maxPixels = 900000;
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
  const renderWidth = Math.max(180, Math.round(width * scale));
  const renderHeight = Math.max(100, Math.round(height * scale));
  const imageData = ctx.createImageData(renderWidth, renderHeight);
  const maxIterations = 150;
  const cRe = -0.835 + rng() * 0.44;
  const cIm = 0.156 + rng() * 0.42;
  const aspect = width / height;
  const viewHeight = 2.55;
  const viewWidth = viewHeight * aspect;

  for (let py = 0; py < renderHeight; py++) {
    for (let px = 0; px < renderWidth; px++) {
      let x = -viewWidth / 2 + (viewWidth * px) / renderWidth;
      let y = -viewHeight / 2 + (viewHeight * py) / renderHeight;
      let iteration = 0;

      while (x * x + y * y <= 4 && iteration < maxIterations) {
        const xTemp = x * x - y * y + cRe;
        y = 2 * x * y + cIm;
        x = xTemp;
        iteration++;
      }

      const value = iteration === maxIterations ? 0 : iteration / maxIterations;
      const color = colorAt(colorPalette, value ** 0.55);
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

  drawVignette(ctx, width, height, 0.2);
}

module.exports = drawJuliaSet;
