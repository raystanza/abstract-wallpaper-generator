const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function hexPath(ctx, x, y, radius) {
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = Math.PI / 6 + side * (Math.PI / 3);
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (side === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function drawHexMosaic(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const minSize = Math.min(width, height);
  const radius = Math.max(14, minSize / Math.sqrt(Math.max(20, shapes * 5)));
  const stepX = radius * Math.sqrt(3);
  const stepY = radius * 1.5;
  const columns = Math.ceil(width / stepX) + 2;
  const rows = Math.ceil(height / stepY) + 2;

  ctx.save();
  ctx.lineJoin = "round";

  for (let row = -1; row < rows; row += 1) {
    for (let column = -1; column < columns; column += 1) {
      const x = column * stepX + (row % 2 ? stepX * 0.5 : 0);
      const y = row * stepY;
      const jitterX = (rng() - 0.5) * radius * 0.16;
      const jitterY = (rng() - 0.5) * radius * 0.16;
      const t = (row / rows) * 0.55 + (column / columns) * 0.45 + rng() * 0.12;
      const gradient = ctx.createRadialGradient(
        x - radius * 0.32,
        y - radius * 0.4,
        radius * 0.05,
        x,
        y,
        radius * 1.1,
      );
      gradient.addColorStop(0, colorAtCss(colorPalette, t + 0.12, 0.95));
      gradient.addColorStop(1, colorAtCss(colorPalette, t, 0.72));

      hexPath(ctx, x + jitterX, y + jitterY, radius * (0.88 + rng() * 0.12));
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = Math.max(1, radius * 0.04);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = Math.max(1, radius * 0.02);
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  drawVignette(ctx, width, height, 0.2);
}

module.exports = drawHexMosaic;
