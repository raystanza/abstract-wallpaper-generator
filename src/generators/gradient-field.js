const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawGradientField(ctx, request) {
  const { width, height, colorPalette, rng } = request;
  const options = request.options || {};
  const noise2D = createNoise2D(rng);
  const nodeCount = Math.round(clamp(Number(options.nodes ?? 7), 3, 14));
  const softness = clamp(Number(options.softness ?? 0.68), 0.2, 1);
  const turbulence = clamp(Number(options.turbulence ?? 0.42), 0, 1);
  const minSize = Math.min(width, height);
  const aspect = width / Math.max(1, height);
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const nx = rng();
    const ny = rng();
    const warpX = noise2D(nx * 2.4 + index, ny * 2.4) * turbulence * 0.2;
    const warpY = noise2D(nx * 2.4, ny * 2.4 - index) * turbulence * 0.2;
    return {
      x: width * clamp(nx + warpX, -0.12, 1.12),
      y: height * clamp(ny + warpY, -0.12, 1.12),
      radius: minSize * (0.28 + softness * 0.34 + rng() * 0.2),
      t: index / Math.max(1, nodeCount - 1),
    };
  });

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const node of nodes) {
    const gradient = ctx.createRadialGradient(
      node.x,
      node.y,
      0,
      node.x,
      node.y,
      node.radius * (aspect > 1 ? 1.08 : 0.92),
    );
    gradient.addColorStop(0, colorAtCss(colorPalette, node.t, 0.82));
    gradient.addColorStop(
      0.54,
      colorAtCss(colorPalette, (node.t + 0.18) % 1, 0.32),
    );
    gradient.addColorStop(1, colorAtCss(colorPalette, (node.t + 0.38) % 1, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.globalCompositeOperation = "overlay";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(0.7, minSize * 0.0011);
  const contourCount = Math.round(24 + turbulence * 48);

  for (let line = 0; line < contourCount; line += 1) {
    const t = line / Math.max(1, contourCount - 1);
    const y = height * t;
    ctx.beginPath();

    for (let step = 0; step <= 96; step += 1) {
      const x = (step / 96) * width;
      const wobble =
        noise2D(
          (x / width) * 2.6 + line * 0.06,
          (y / height) * 2.6,
        ) *
        minSize *
        0.035 *
        turbulence;
      const nextY = y + wobble;

      if (step === 0) {
        ctx.moveTo(x, nextY);
      } else {
        ctx.lineTo(x, nextY);
      }
    }

    ctx.strokeStyle = colorAtCss(colorPalette, t, 0.1 + turbulence * 0.16);
    ctx.stroke();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.16);
}

module.exports = drawGradientField;
