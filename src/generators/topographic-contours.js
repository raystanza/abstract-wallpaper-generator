const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawTopographicContours(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const noise2D = createNoise2D(rng);
  const centerCount = 3 + Math.floor(rng() * 3);
  const centers = Array.from({ length: centerCount }, () => ({
    x: width * (0.18 + rng() * 0.64),
    y: height * (0.18 + rng() * 0.64),
    radius: Math.min(width, height) * (0.08 + rng() * 0.1),
  }));
  const contourCount = Math.min(90, Math.max(28, Math.round(shapes * 0.85)));

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  centers.forEach((center, centerIndex) => {
    for (let ring = 0; ring < contourCount / centerCount; ring++) {
      const t = ring / (contourCount / centerCount);
      const radius = center.radius + t * Math.min(width, height) * 0.42;

      ctx.beginPath();

      for (let i = 0; i <= 180; i++) {
        const angle = (Math.PI * 2 * i) / 180;
        const nx = Math.cos(angle) * 1.6 + centerIndex * 10;
        const ny = Math.sin(angle) * 1.6 + ring * 0.13;
        const wobble = noise2D(nx, ny) * Math.min(width, height) * 0.025;
        const localRadius = radius + wobble;
        const x = center.x + Math.cos(angle) * localRadius;
        const y = center.y + Math.sin(angle) * localRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = colorAtCss(colorPalette, t, 0.32);
      ctx.lineWidth = 0.8 + (1 - t) * 1.6;
      ctx.stroke();
    }
  });

  ctx.restore();
  drawVignette(ctx, width, height, 0.2);
}

module.exports = drawTopographicContours;
