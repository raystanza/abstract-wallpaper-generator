const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawSpiralGalaxy(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const minSize = Math.min(width, height);
  const centerX = width * (0.45 + (rng() - 0.5) * 0.16);
  const centerY = height * (0.5 + (rng() - 0.5) * 0.16);
  const armCount = 3 + Math.floor(rng() * 3);
  const particleCount = Math.min(9000, Math.max(1200, shapes * 22));
  const rotation = rng() * Math.PI * 2;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const coreGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    minSize * 0.28,
  );
  coreGradient.addColorStop(0, colorAtCss(colorPalette, 0.92, 0.76));
  coreGradient.addColorStop(1, colorAtCss(colorPalette, 0.18, 0));
  ctx.fillStyle = coreGradient;
  ctx.fillRect(0, 0, width, height);

  for (let particle = 0; particle < particleCount; particle += 1) {
    const arm = particle % armCount;
    const distance = Math.pow(rng(), 0.62) * minSize * 0.58;
    const angle =
      rotation +
      (arm / armCount) * Math.PI * 2 +
      distance * 0.018 +
      (rng() - 0.5) * (0.9 - distance / minSize);
    const flatten = 0.56 + rng() * 0.14;
    const x = centerX + Math.cos(angle) * distance + (rng() - 0.5) * minSize * 0.025;
    const y = centerY + Math.sin(angle) * distance * flatten + (rng() - 0.5) * minSize * 0.025;
    const radius = minSize * (0.00055 + rng() * 0.0028);
    const alpha = 0.05 + (1 - distance / (minSize * 0.64)) * 0.38;

    ctx.fillStyle = colorAtCss(colorPalette, distance / (minSize * 0.6), alpha);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "lighter";
  for (let star = 0; star < 220; star += 1) {
    const radius = minSize * (0.0006 + rng() * 0.002);
    ctx.fillStyle = colorAtCss(colorPalette, rng(), 0.22 + rng() * 0.55);
    ctx.beginPath();
    ctx.arc(rng() * width, rng() * height, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.3);
}

module.exports = drawSpiralGalaxy;
