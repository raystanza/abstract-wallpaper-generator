const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function fieldAt(x, y, poles) {
  let vx = 0;
  let vy = 0;

  for (const pole of poles) {
    const dx = x - pole.x;
    const dy = y - pole.y;
    const distance = Math.max(90, dx * dx + dy * dy);
    vx += (pole.charge * dx) / distance;
    vy += (pole.charge * dy) / distance;
  }

  return Math.atan2(vy, vx) + Math.PI * 0.5;
}

function drawMagneticField(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const minSize = Math.min(width, height);
  const poleCount = 3 + Math.floor(rng() * 3);
  const poles = Array.from({ length: poleCount }, (_, index) => ({
    x: width * (0.18 + rng() * 0.64),
    y: height * (0.18 + rng() * 0.64),
    charge: index % 2 === 0 ? 1 : -1,
  }));
  const lineCount = Math.min(1200, Math.max(180, shapes * 4));
  const stepLength = minSize * 0.009;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  for (let line = 0; line < lineCount; line += 1) {
    let x = rng() * width;
    let y = rng() * height;
    const direction = rng() > 0.5 ? 1 : -1;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let step = 0; step < 80; step += 1) {
      const angle = fieldAt(x, y, poles);
      x += Math.cos(angle) * stepLength * direction;
      y += Math.sin(angle) * stepLength * direction;

      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
        break;
      }

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = colorAtCss(colorPalette, line / Math.max(1, lineCount - 1), 0.08 + rng() * 0.2);
    ctx.lineWidth = Math.max(0.5, minSize * (0.0007 + rng() * 0.0018));
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "lighter";
  for (const pole of poles) {
    const gradient = ctx.createRadialGradient(pole.x, pole.y, 0, pole.x, pole.y, minSize * 0.16);
    gradient.addColorStop(0, colorAtCss(colorPalette, pole.charge > 0 ? 0.12 : 0.82, 0.42));
    gradient.addColorStop(1, colorAtCss(colorPalette, pole.charge > 0 ? 0.28 : 0.66, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.24);
}

module.exports = drawMagneticField;
