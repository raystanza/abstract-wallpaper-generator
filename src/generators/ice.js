const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawIce(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const shardCount = Math.min(Math.max(shapes * 2, 60), 1200);
  const diagonal = Math.hypot(width, height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < shardCount; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const length = diagonal * (0.015 + rng() * 0.08);
    const angle = -Math.PI / 4 + rng() * Math.PI * 1.5;
    const t = i / shardCount;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.strokeStyle = colorAtCss(colorPalette, t, 0.22 + rng() * 0.4);
    ctx.lineWidth = 0.8 + rng() * 2.6;
    ctx.stroke();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.3);
}

module.exports = drawIce;
