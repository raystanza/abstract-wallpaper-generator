const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawCutoutBand(ctx, width, height, yBase, amplitude, noise2D, offset) {
  const steps = 90;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, yBase);

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = t * width;
    const y =
      yBase +
      noise2D(t * 2.2 + offset, offset * 0.17) * amplitude +
      Math.sin(t * Math.PI * 2 + offset) * amplitude * 0.2;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(width, height);
  ctx.closePath();
}

function drawLayeredCutouts(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const noise2D = createNoise2D(rng);
  const minSize = Math.min(width, height);
  const layerCount = Math.min(28, Math.max(9, Math.round(shapes / 11)));

  ctx.save();
  for (let layer = 0; layer < layerCount; layer += 1) {
    const t = layer / Math.max(1, layerCount - 1);
    const yBase = height * (0.18 + t * 0.78);
    const amplitude = minSize * (0.035 + rng() * 0.08);

    drawCutoutBand(ctx, width, height, yBase, amplitude, noise2D, rng() * 40);
    ctx.fillStyle = colorAtCss(colorPalette, t, 0.2 + t * 0.42);
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = minSize * 0.014;
    ctx.shadowOffsetY = -minSize * 0.006;
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = colorAtCss(colorPalette, (t + 0.16) % 1, 0.18);
    ctx.lineWidth = Math.max(1, minSize * 0.0014);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "screen";
  for (let circle = 0; circle < Math.min(220, shapes * 2); circle += 1) {
    const radius = minSize * (0.004 + rng() * 0.022);
    ctx.fillStyle = colorAtCss(colorPalette, rng(), 0.04 + rng() * 0.12);
    ctx.beginPath();
    ctx.arc(rng() * width, rng() * height, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.21);
}

module.exports = drawLayeredCutouts;
