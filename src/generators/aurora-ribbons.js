const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawRibbon(ctx, points, width) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 2; index += 1) {
    const next = points[index + 1];
    const controlX = (points[index].x + next.x) * 0.5;
    const controlY = (points[index].y + next.y) * 0.5;
    ctx.quadraticCurveTo(points[index].x, points[index].y, controlX, controlY);
  }

  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawAuroraRibbons(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const noise2D = createNoise2D(rng);
  const minSize = Math.min(width, height);
  const ribbonCount = Math.min(18, Math.max(7, Math.round(shapes / 18)));
  const segmentCount = 84;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let ribbon = 0; ribbon < ribbonCount; ribbon += 1) {
    const baseY = height * (0.18 + rng() * 0.64);
    const phase = rng() * Math.PI * 2;
    const drift = (rng() - 0.5) * height * 0.3;
    const amplitude = minSize * (0.05 + rng() * 0.18);
    const points = [];

    for (let step = 0; step <= segmentCount; step += 1) {
      const t = step / segmentCount;
      const x = width * (t * 1.18 - 0.09);
      const wave =
        Math.sin(t * Math.PI * (1.4 + rng() * 0.1) + phase) * amplitude;
      const noise = noise2D(t * 2.8 + ribbon * 0.31, ribbon * 0.17) * amplitude;
      points.push({
        x,
        y: baseY + wave + noise + drift * (t - 0.5),
      });
    }

    for (let glow = 0; glow < 4; glow += 1) {
      ctx.strokeStyle = colorAtCss(
        colorPalette,
        (ribbon / Math.max(1, ribbonCount - 1) + glow * 0.08) % 1,
        0.055 + glow * 0.035,
      );
      drawRibbon(ctx, points, minSize * (0.045 - glow * 0.008));
    }

    ctx.strokeStyle = colorAtCss(colorPalette, rng(), 0.34);
    drawRibbon(ctx, points, Math.max(1.2, minSize * 0.006));
  }

  ctx.globalCompositeOperation = "overlay";
  for (let ray = 0; ray < 120; ray += 1) {
    const x = rng() * width;
    const gradient = ctx.createLinearGradient(x, 0, x, height);
    gradient.addColorStop(0, colorAtCss(colorPalette, rng(), 0));
    gradient.addColorStop(0.45, colorAtCss(colorPalette, rng(), 0.05));
    gradient.addColorStop(1, colorAtCss(colorPalette, rng(), 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - minSize * 0.008, 0, minSize * 0.016, height);
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.22);
}

module.exports = drawAuroraRibbons;
