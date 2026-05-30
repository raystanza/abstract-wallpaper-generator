const { drawVignette, fillLinearGradient } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawKochCurve(ctx, x1, y1, x2, y2, depth) {
  if (depth === 0) {
    ctx.lineTo(x2, y2);
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const xA = x1 + dx / 3;
  const yA = y1 + dy / 3;
  const xB = x1 + (dx * 2) / 3;
  const yB = y1 + (dy * 2) / 3;
  const xPeak =
    xA + Math.cos(Math.PI / 3) * (xB - xA) - Math.sin(Math.PI / 3) * (yB - yA);
  const yPeak =
    yA + Math.sin(Math.PI / 3) * (xB - xA) + Math.cos(Math.PI / 3) * (yB - yA);

  drawKochCurve(ctx, x1, y1, xA, yA, depth - 1);
  drawKochCurve(ctx, xA, yA, xPeak, yPeak, depth - 1);
  drawKochCurve(ctx, xPeak, yPeak, xB, yB, depth - 1);
  drawKochCurve(ctx, xB, yB, x2, y2, depth - 1);
}

function drawKochSnowflake(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const depth = Math.max(3, Math.min(5, Math.round(3 + shapes / 80)));
  const minDimension = Math.min(width, height);
  const size = minDimension * (0.54 + rng() * 0.16);
  const centerX = width / 2;
  const centerY = height / 2;
  const triangleHeight = (Math.sqrt(3) / 2) * size;

  fillLinearGradient(ctx, width, height, colorPalette, "diagonal");

  const points = [
    [centerX - size / 2, centerY + triangleHeight / 3],
    [centerX + size / 2, centerY + triangleHeight / 3],
    [centerX, centerY - (triangleHeight * 2) / 3],
  ];

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rng() - 0.5) * Math.PI * 0.16);
  ctx.translate(-centerX, -centerY);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.2, minDimension * 0.0035);

  for (let side = 0; side < 3; side++) {
    const [x1, y1] = points[side];
    const [x2, y2] = points[(side + 1) % 3];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    drawKochCurve(ctx, x1, y1, x2, y2, depth);
    ctx.strokeStyle = colorAtCss(colorPalette, side / 3, 0.82);
    ctx.stroke();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.28);
}

module.exports = drawKochSnowflake;
