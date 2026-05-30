const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawFlowField(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const noise2D = createNoise2D(rng);
  const particleCount = Math.min(1800, Math.max(220, shapes * 7));
  const stepCount = 70;
  const stepLength = Math.min(width, height) * 0.008;
  const noiseScale = 2.8 + rng() * 2.4;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  for (let i = 0; i < particleCount; i++) {
    let x = rng() * width;
    let y = rng() * height;
    const t = i / particleCount;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let step = 0; step < stepCount; step++) {
      const nx = (x / width) * noiseScale;
      const ny = (y / height) * noiseScale;
      const angle = noise2D(nx, ny) * Math.PI * 2.2 + t * Math.PI;
      x += Math.cos(angle) * stepLength;
      y += Math.sin(angle) * stepLength;

      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
        break;
      }

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = colorAtCss(colorPalette, t, 0.15 + rng() * 0.3);
    ctx.lineWidth = 0.6 + rng() * 1.5;
    ctx.stroke();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.24);
}

module.exports = drawFlowField;
