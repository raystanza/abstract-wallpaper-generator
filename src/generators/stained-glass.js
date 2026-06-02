const { createCanvas } = require("canvas");
const { drawVignette } = require("../generation/canvas");
const { colorAt, colorAtCss } = require("../generation/color");

function drawStainedGlass(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const siteCount = Math.min(180, Math.max(36, Math.round(shapes * 0.9)));
  const maxPixels = 440000;
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
  const renderWidth = Math.max(180, Math.round(width * scale));
  const renderHeight = Math.max(104, Math.round(height * scale));
  const sites = Array.from({ length: siteCount }, (_, index) => ({
    x: rng() * renderWidth,
    y: rng() * renderHeight,
    weight: 0.72 + rng() * 0.56,
    t: index / Math.max(1, siteCount - 1),
  }));
  const imageData = ctx.createImageData(renderWidth, renderHeight);

  for (let y = 0; y < renderHeight; y += 1) {
    for (let x = 0; x < renderWidth; x += 1) {
      let nearest = null;
      let nextNearest = Infinity;
      let nearestDistance = Infinity;

      for (const site of sites) {
        const dx = x - site.x;
        const dy = y - site.y;
        const distance = (dx * dx + dy * dy) / site.weight;

        if (distance < nearestDistance) {
          nextNearest = nearestDistance;
          nearestDistance = distance;
          nearest = site;
        } else if (distance < nextNearest) {
          nextNearest = distance;
        }
      }

      const edge = Math.min(1, Math.max(0, (nextNearest - nearestDistance) / 180));
      const shade = 0.74 + edge * 0.26;
      const color = colorAt(colorPalette, (nearest.t + edge * 0.18) % 1);
      const index = (y * renderWidth + x) * 4;
      imageData.data[index] = color.r * shade;
      imageData.data[index + 1] = color.g * shade;
      imageData.data[index + 2] = color.b * shade;
      imageData.data[index + 3] = 255;
    }
  }

  const tempCanvas = createCanvas(renderWidth, renderHeight);
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tempCanvas, 0, 0, width, height);
  ctx.globalCompositeOperation = "multiply";
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.0025);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.34)";

  for (const site of sites) {
    const x = (site.x / renderWidth) * width;
    const y = (site.y / renderHeight) * height;
    ctx.beginPath();
    ctx.arc(x, y, Math.min(width, height) * (0.016 + rng() * 0.02), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorAtCss(colorPalette, rng(), 0.12);
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.0014);
  for (let line = 0; line < 22; line += 1) {
    ctx.beginPath();
    ctx.moveTo(rng() * width, 0);
    ctx.lineTo(rng() * width, height);
    ctx.stroke();
  }
  ctx.restore();
  drawVignette(ctx, width, height, 0.24);
}

module.exports = drawStainedGlass;
