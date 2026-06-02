const { createCanvas } = require("canvas");
const { createNoise2D } = require("simplex-noise");
const { drawVignette } = require("../generation/canvas");
const { colorAt, colorAtCss } = require("../generation/color");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fbm(noise2D, x, y) {
  let value = 0;
  let amplitude = 0.58;
  let frequency = 1;
  let total = 0;

  for (let octave = 0; octave < 6; octave += 1) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    total += amplitude;
    amplitude *= 0.52;
    frequency *= 2.04;
  }

  return value / total;
}

function drawNebulaClouds(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const noise2D = createNoise2D(rng);
  const maxPixels = 620000;
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
  const renderWidth = Math.max(220, Math.round(width * scale));
  const renderHeight = Math.max(128, Math.round(height * scale));
  const imageData = ctx.createImageData(renderWidth, renderHeight);
  const aspect = renderWidth / Math.max(1, renderHeight);
  const offset = rng() * 100;

  for (let y = 0; y < renderHeight; y += 1) {
    for (let x = 0; x < renderWidth; x += 1) {
      const nx = ((x / renderWidth) - 0.5) * aspect;
      const ny = y / renderHeight - 0.5;
      const radial = Math.hypot(nx * 0.9, ny * 1.25);
      const cloud = fbm(noise2D, nx * 2.4 + offset, ny * 2.4 - offset);
      const wisps = Math.abs(fbm(noise2D, nx * 7.2 - offset, ny * 7.2));
      const field = clamp(0.48 + cloud * 0.82 + wisps * 0.22 - radial * 0.46, 0, 1);
      const color = colorAt(colorPalette, field);
      const index = (y * renderWidth + x) * 4;
      imageData.data[index] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }

  const tempCanvas = createCanvas(renderWidth, renderHeight);
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tempCanvas, 0, 0, width, height);

  ctx.globalCompositeOperation = "screen";
  const starCount = Math.min(900, Math.max(120, shapes * 5));
  for (let star = 0; star < starCount; star += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const radius = Math.max(0.5, Math.min(width, height) * (0.0005 + rng() * 0.0018));
    ctx.fillStyle = colorAtCss(colorPalette, rng(), 0.18 + rng() * 0.55);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  drawVignette(ctx, width, height, 0.28);
}

module.exports = drawNebulaClouds;
