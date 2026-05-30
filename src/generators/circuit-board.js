const { drawVignette } = require("../generation/canvas");
const { colorAtCss } = require("../generation/color");

function drawCircuitBoard(ctx, request) {
  const { width, height, shapes, colorPalette, rng } = request;
  const cellSize = Math.max(
    26,
    Math.min(64, Math.round(Math.min(width, height) / 18)),
  );
  const columns = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const traceCount = Math.min(420, Math.max(70, shapes * 2.2));

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < traceCount; i++) {
    let column = Math.floor(rng() * columns);
    let row = Math.floor(rng() * rows);
    const segmentCount = 2 + Math.floor(rng() * 7);
    const t = i / traceCount;

    ctx.beginPath();
    ctx.moveTo(column * cellSize + cellSize / 2, row * cellSize + cellSize / 2);

    for (let segment = 0; segment < segmentCount; segment++) {
      if (rng() > 0.5) {
        column += rng() > 0.5 ? 1 : -1;
      } else {
        row += rng() > 0.5 ? 1 : -1;
      }

      column = Math.max(0, Math.min(columns - 1, column));
      row = Math.max(0, Math.min(rows - 1, row));
      ctx.lineTo(
        column * cellSize + cellSize / 2,
        row * cellSize + cellSize / 2,
      );
    }

    ctx.strokeStyle = colorAtCss(colorPalette, t, 0.28 + rng() * 0.36);
    ctx.lineWidth = 1 + rng() * 2.5;
    ctx.stroke();
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (rng() > 0.18) {
        continue;
      }

      const x = column * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;
      const radius = cellSize * (0.08 + rng() * 0.11);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colorAtCss(colorPalette, rng(), 0.45);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.stroke();
    }
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.3);
}

module.exports = drawCircuitBoard;
