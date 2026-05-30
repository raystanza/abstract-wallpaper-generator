const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawWaves(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const lineCount = Math.max(14, Math.min(96, Math.round(shapes * 0.9)));
  const amplitude = height * (0.018 + rng() * 0.035);
  const frequency = 0.006 + rng() * 0.009;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < lineCount; i++) {
    const t = lineCount === 1 ? 0 : i / (lineCount - 1);
    const yBase = height * (0.04 + t * 0.92);
    const phase = rng() * Math.PI * 2;
    const localAmplitude = amplitude * (0.7 + rng() * 0.8);

    ctx.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const y =
        yBase +
        Math.sin(x * frequency + phase) * localAmplitude +
        Math.sin(x * frequency * 0.43 + phase * 1.7) * localAmplitude * 0.55;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = colorAtCss(
      colorPalette,
      t,
      0.32 + 0.42 * (1 - Math.abs(t - 0.5)),
    );
    ctx.lineWidth = 1.2 + rng() * 3;
    ctx.stroke();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.24);
}

module.exports = drawWaves;
