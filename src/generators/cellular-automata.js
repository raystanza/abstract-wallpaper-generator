const { createCanvas } = require("canvas");
const { drawVignette } = require("../generation/canvas");
const { colorAt, colorAtCss } = require("../generation/color");

function countNeighbors(grid, x, y, size) {
  let count = 0;

  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) {
        continue;
      }
      const nx = (x + ox + size) % size;
      const ny = (y + oy + size) % size;
      count += grid[ny * size + nx];
    }
  }

  return count;
}

function drawCellularAutomata(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const size = Math.min(180, Math.max(54, Math.round(Math.sqrt(shapes) * 9)));
  let grid = new Uint8Array(size * size);
  let next = new Uint8Array(size * size);

  for (let index = 0; index < grid.length; index += 1) {
    grid[index] = rng() > 0.53 ? 1 : 0;
  }

  for (let iteration = 0; iteration < 7; iteration += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const neighbors = countNeighbors(grid, x, y, size);
        const alive = grid[y * size + x] === 1;
        next[y * size + x] = alive
          ? neighbors === 2 || neighbors === 3
            ? 1
            : 0
          : neighbors === 3 || (neighbors === 4 && rng() > 0.64)
            ? 1
            : 0;
      }
    }
    [grid, next] = [next, grid];
  }

  const tempCanvas = createCanvas(size, size);
  const tempCtx = tempCanvas.getContext("2d");
  const imageData = tempCtx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const neighbors = countNeighbors(grid, x, y, size);
      const amount = Math.min(1, (grid[y * size + x] * 0.52 + neighbors / 8) * 0.82);
      const color = colorAt(colorPalette, amount);
      const index = (y * size + x) * 4;
      imageData.data[index] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }

  tempCtx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tempCanvas, 0, 0, width, height);

  ctx.globalCompositeOperation = "overlay";
  ctx.strokeStyle = colorAtCss(colorPalette, 0.95, 0.16);
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.001);
  for (let step = 0; step <= size; step += 6) {
    const x = (step / size) * width;
    const y = (step / size) * height;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.22);
}

module.exports = drawCellularAutomata;
