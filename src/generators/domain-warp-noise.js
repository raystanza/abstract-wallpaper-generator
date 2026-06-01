const { createCanvas } = require("canvas");
const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAt } = require("../generation/color");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fbm(noise2D, x, y, octaves) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    total += amplitude;
    amplitude *= 0.52;
    frequency *= 2.03;
  }

  return total === 0 ? 0 : value / total;
}

function drawDomainWarpNoise(ctx, request) {
  const { width, height, colorPalette, rng } = request;
  const options = request.options || {};
  const noise2D = createNoise2D(rng);
  const maxPixels = 760000;
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
  const renderWidth = Math.max(220, Math.round(width * scale));
  const renderHeight = Math.max(124, Math.round(height * scale));
  const frequency = clamp(Number(options.frequency ?? 2.7), 0.5, 7);
  const warpStrength = clamp(Number(options.warpStrength ?? 0.82), 0, 2);
  const contrast = clamp(Number(options.contrast ?? 0.62), 0.1, 1);
  const octaves = Math.round(clamp(Number(options.octaves ?? 5), 2, 7));
  const aspect = renderWidth / Math.max(1, renderHeight);
  const imageData = ctx.createImageData(renderWidth, renderHeight);
  const seedOffset = rng() * 80;

  for (let y = 0; y < renderHeight; y += 1) {
    for (let x = 0; x < renderWidth; x += 1) {
      const px = ((x / renderWidth) - 0.5) * aspect;
      const py = y / renderHeight - 0.5;
      const qx = px * frequency;
      const qy = py * frequency;
      const warpX = fbm(noise2D, qx + 8.2 + seedOffset, qy - 4.1, octaves);
      const warpY = fbm(noise2D, qx - 2.7, qy + 6.8 + seedOffset, octaves);
      const ridged = Math.abs(
        fbm(
          noise2D,
          qx + warpX * warpStrength * 2.8,
          qy + warpY * warpStrength * 2.8,
          octaves,
        ),
      );
      const band = Math.sin(
        (qx + warpY * warpStrength + qy * 0.65) * Math.PI * 2.4,
      );
      const field = clamp(
        0.5 +
          ridged * (0.74 + contrast) +
          band * (0.08 + contrast * 0.16) -
          0.25,
        0,
        1,
      );
      const color = colorAt(colorPalette, field);
      const index = (y * renderWidth + x) * 4;
      imageData.data[index] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }

  if (renderWidth === width && renderHeight === height) {
    ctx.putImageData(imageData, 0, 0);
  } else {
    const tempCanvas = createCanvas(renderWidth, renderHeight);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tempCanvas, 0, 0, width, height);
  }

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  drawVignette(ctx, width, height, 0.18);
}

module.exports = drawDomainWarpNoise;
