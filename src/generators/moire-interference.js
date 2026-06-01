const { createCanvas } = require("canvas");
const { drawVignette } = require("../generation/canvas");
const { colorAt, colorAtCss } = require("../generation/color");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawMoireInterference(ctx, request) {
  const { width, height, colorPalette, rng } = request;
  const options = request.options || {};
  const maxPixels = 680000;
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
  const renderWidth = Math.max(220, Math.round(width * scale));
  const renderHeight = Math.max(124, Math.round(height * scale));
  const ringFrequency = clamp(Number(options.ringFrequency ?? 34), 8, 96);
  const interference = clamp(Number(options.interference ?? 0.72), 0.1, 1);
  const centerCount = Math.round(clamp(Number(options.centerCount ?? 3), 2, 5));
  const phase = rng() * Math.PI * 2;
  const centers = Array.from({ length: centerCount }, (_, index) => ({
    x: renderWidth * (0.18 + rng() * 0.64),
    y: renderHeight * (0.18 + rng() * 0.64),
    phase: phase + index * 1.7 + rng() * 1.2,
  }));
  const imageData = ctx.createImageData(renderWidth, renderHeight);
  const diagonal = Math.hypot(renderWidth, renderHeight);

  for (let y = 0; y < renderHeight; y += 1) {
    for (let x = 0; x < renderWidth; x += 1) {
      let wave = 0;

      for (const center of centers) {
        const distance = Math.hypot(x - center.x, y - center.y) / diagonal;
        wave += Math.sin(distance * ringFrequency * Math.PI * 2 + center.phase);
      }

      wave /= centerCount;
      const cross = Math.sin(
        ((x - y) / diagonal) * ringFrequency * 2.1 + phase,
      );
      const field = clamp(
        0.5 + wave * 0.36 * interference + cross * 0.14 * interference,
        0,
        1,
      );
      const edge = Math.pow(Math.abs(wave), 8) * 0.28;
      const color = colorAt(colorPalette, clamp(field + edge, 0, 1));
      const index = (y * renderWidth + x) * 4;
      imageData.data[index] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }

  if (renderWidth === width && renderHeight === height) {
    ctx.putImageData(imageData, 0, 0);
  } else {
    const tempCanvas = createCanvas(renderWidth, renderHeight);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tempCanvas, 0, 0, width, height);
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineWidth = Math.max(0.8, Math.min(width, height) * 0.0012);
  centers.forEach((center, index) => {
    ctx.strokeStyle = colorAtCss(colorPalette, index / centerCount, 0.2);
    ctx.beginPath();
    ctx.arc(
      (center.x / renderWidth) * width,
      (center.y / renderHeight) * height,
      Math.min(width, height) * (0.16 + index * 0.08),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  });
  ctx.restore();
  drawVignette(ctx, width, height, 0.2);
}

module.exports = drawMoireInterference;
