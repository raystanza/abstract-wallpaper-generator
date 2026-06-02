const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawOrganicBlob(ctx, centerX, centerY, radius, noise2D, offset) {
  const steps = 96;
  ctx.beginPath();

  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * Math.PI * 2;
    const distortion =
      0.72 +
      noise2D(Math.cos(angle) * 1.7 + offset, Math.sin(angle) * 1.7 - offset) *
        0.22;
    const x = centerX + Math.cos(angle) * radius * distortion;
    const y = centerY + Math.sin(angle) * radius * distortion;

    if (step === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
}

function drawInkWash(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const noise2D = createNoise2D(rng);
  const minSize = Math.min(width, height);
  const blobCount = Math.min(42, Math.max(10, Math.round(shapes / 9)));

  ctx.save();
  ctx.globalCompositeOperation = "multiply";

  for (let blob = 0; blob < blobCount; blob += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const radius = minSize * (0.08 + rng() * 0.22);
    const offset = rng() * 100;

    for (let wash = 0; wash < 5; wash += 1) {
      drawOrganicBlob(ctx, x, y, radius * (1 - wash * 0.11), noise2D, offset + wash);
      ctx.fillStyle = colorAtCss(colorPalette, (blob / blobCount + wash * 0.09) % 1, 0.06);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "screen";
    drawOrganicBlob(ctx, x, y, radius * 0.72, noise2D, offset + 8);
    ctx.strokeStyle = colorAtCss(colorPalette, rng(), 0.18);
    ctx.lineWidth = Math.max(0.8, minSize * 0.0018);
    ctx.stroke();
    ctx.globalCompositeOperation = "multiply";
  }

  ctx.globalCompositeOperation = "screen";
  for (let splatter = 0; splatter < Math.min(650, shapes * 3); splatter += 1) {
    const radius = minSize * (0.0008 + rng() * 0.004);
    ctx.fillStyle = colorAtCss(colorPalette, rng(), 0.12 + rng() * 0.28);
    ctx.beginPath();
    ctx.arc(rng() * width, rng() * height, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.19);
}

module.exports = drawInkWash;
