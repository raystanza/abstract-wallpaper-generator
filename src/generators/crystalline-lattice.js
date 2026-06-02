const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function nearestPoints(point, points, limit) {
  return points
    .filter((candidate) => candidate !== point)
    .map((candidate) => ({
      point: candidate,
      distance:
        (candidate.x - point.x) * (candidate.x - point.x) +
        (candidate.y - point.y) * (candidate.y - point.y),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((entry) => entry.point);
}

function drawCrystallineLattice(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const minSize = Math.min(width, height);
  const pointCount = Math.min(150, Math.max(36, Math.round(shapes * 0.8)));
  const points = Array.from({ length: pointCount }, (_, index) => ({
    x: rng() * width,
    y: rng() * height,
    t: index / Math.max(1, pointCount - 1),
  }));

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const point of points) {
    const nearest = nearestPoints(point, points, 4);

    for (let index = 0; index < nearest.length - 1; index += 1) {
      const a = nearest[index];
      const b = nearest[index + 1];
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.closePath();
      ctx.fillStyle = colorAtCss(colorPalette, (point.t + index * 0.11) % 1, 0.08);
      ctx.fill();
      ctx.strokeStyle = colorAtCss(colorPalette, (point.t + 0.18) % 1, 0.13);
      ctx.lineWidth = Math.max(0.6, minSize * 0.0012);
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const point of points) {
    const nearest = nearestPoints(point, points, 3);
    for (const target of nearest) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = colorAtCss(colorPalette, point.t, 0.08);
      ctx.lineWidth = Math.max(0.5, minSize * 0.0008);
      ctx.stroke();
    }
  }

  for (const point of points) {
    const radius = minSize * (0.0025 + rng() * 0.006);
    ctx.fillStyle = colorAtCss(colorPalette, point.t, 0.45);
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.26);
}

module.exports = drawCrystallineLattice;
