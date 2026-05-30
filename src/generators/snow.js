const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawSnowflake(ctx, x, y, size, color, rng) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rng() * Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, size * 0.035);

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const xEnd = Math.cos(angle) * size;
    const yEnd = Math.sin(angle) * size;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();

    for (const direction of [-1, 1]) {
      const branchAngle = angle + direction * Math.PI * 0.24;
      const branchLength = size * 0.36;
      const branchStartX = xEnd * 0.58;
      const branchStartY = yEnd * 0.58;
      ctx.beginPath();
      ctx.moveTo(branchStartX, branchStartY);
      ctx.lineTo(
        branchStartX + Math.cos(branchAngle) * branchLength,
        branchStartY + Math.sin(branchAngle) * branchLength,
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawSnow(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const count = Math.min(Math.max(shapes, 16), 360);
  const minDimension = Math.min(width, height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < count; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const size = minDimension * (0.008 + rng() * 0.035);
    drawSnowflake(
      ctx,
      x,
      y,
      size,
      colorAtCss(colorPalette, i / count, 0.42 + rng() * 0.45),
      rng,
    );
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.22);
}

module.exports = drawSnow;
