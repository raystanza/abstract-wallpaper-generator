const { drawVignette, fillLinearGradient } = require("../generation/canvas");
const {
  colorAtCss,
  hexToRgb,
  rgbToCss,
  samplePalette,
} = require("../generation/color");

function drawBubbles(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const count = Math.min(Math.max(shapes, 8), 360);
  const minDimension = Math.min(width, height);

  fillLinearGradient(ctx, width, height, colorPalette, "vertical");

  for (let i = 0; i < count; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const radius = minDimension * (0.012 + rng() * 0.08);
    const baseRgb = hexToRgb(samplePalette(colorPalette, rng));
    const alpha = 0.18 + rng() * 0.26;

    const gradient = ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.35,
      radius * 0.08,
      x,
      y,
      radius,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.78)");
    gradient.addColorStop(0.42, rgbToCss(baseRgb, alpha));
    gradient.addColorStop(1, rgbToCss(baseRgb, 0));

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = colorAtCss(colorPalette, i / count, 0.28);
    ctx.lineWidth = Math.max(1, radius * 0.025);
    ctx.stroke();
  }

  drawVignette(ctx, width, height, 0.28);
}

module.exports = drawBubbles;
