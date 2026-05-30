const { drawVignette, fillLinearGradient } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawParticleOrbits(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const attractorCount = 3 + Math.floor(rng() * 3);
  const attractors = Array.from({ length: attractorCount }, () => ({
    x: width * (0.2 + rng() * 0.6),
    y: height * (0.2 + rng() * 0.6),
    mass: 0.45 + rng() * 1.2,
  }));
  const trailCount = Math.min(520, Math.max(80, shapes * 3));
  const steps = 110;

  fillLinearGradient(ctx, width, height, colorPalette, "diagonal");

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  for (let i = 0; i < trailCount; i++) {
    let x = rng() * width;
    let y = rng() * height;
    let vx = (rng() - 0.5) * 2.2;
    let vy = (rng() - 0.5) * 2.2;
    const t = i / trailCount;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let step = 0; step < steps; step++) {
      for (const attractor of attractors) {
        const dx = attractor.x - x;
        const dy = attractor.y - y;
        const distanceSq = Math.max(90, dx * dx + dy * dy);
        const force = (attractor.mass * 35) / distanceSq;
        vx += dx * force;
        vy += dy * force;
      }

      const speed = Math.hypot(vx, vy) || 1;
      vx = (vx / speed) * Math.min(speed, 3.6);
      vy = (vy / speed) * Math.min(speed, 3.6);
      x += vx;
      y += vy;

      if (x < -40 || x > width + 40 || y < -40 || y > height + 40) {
        break;
      }

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = colorAtCss(colorPalette, t, 0.16 + rng() * 0.34);
    ctx.lineWidth = 0.45 + rng() * 1.25;
    ctx.stroke();
  }

  attractors.forEach((attractor, index) => {
    ctx.beginPath();
    ctx.arc(
      attractor.x,
      attractor.y,
      Math.min(width, height) * 0.012,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = colorAtCss(colorPalette, index / attractors.length, 0.8);
    ctx.fill();
  });

  ctx.restore();
  drawVignette(ctx, width, height, 0.24);
}

module.exports = drawParticleOrbits;
