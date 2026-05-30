const { drawVignette } = require("../generation/canvas");
const { samplePalette } = require("../generation/color");

function randomBetween(rng, min, max) {
  return min + rng() * (max - min);
}

function drawRegularPolygon(ctx, sides, radius) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawStar(ctx, radius) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (Math.PI * i) / 5;
    const pointRadius = i % 2 === 0 ? radius : radius * 0.45;
    const x = Math.cos(angle) * pointRadius;
    const y = Math.sin(angle) * pointRadius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawHeart(ctx, radius) {
  const size = radius / 32;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = (Math.PI * 2 * i) / 120;
    const x = 16 * Math.sin(t) ** 3 * size;
    const y =
      -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      ) * size;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawCross(ctx, radius) {
  const arm = radius * 0.36;
  ctx.beginPath();
  ctx.rect(-arm / 2, -radius, arm, radius * 2);
  ctx.rect(-radius, -arm / 2, radius * 2, arm);
}

function drawArrow(ctx, radius) {
  ctx.beginPath();
  ctx.moveTo(-radius, -radius * 0.38);
  ctx.lineTo(radius * 0.15, -radius * 0.38);
  ctx.lineTo(radius * 0.15, -radius * 0.85);
  ctx.lineTo(radius, 0);
  ctx.lineTo(radius * 0.15, radius * 0.85);
  ctx.lineTo(radius * 0.15, radius * 0.38);
  ctx.lineTo(-radius, radius * 0.38);
  ctx.closePath();
}

function drawSpiral(ctx, radius, rng) {
  ctx.beginPath();
  for (let i = 0; i < 180; i++) {
    const t = i / 179;
    const angle = t * Math.PI * 2 * randomBetween(rng, 2.5, 5.5);
    const currentRadius = radius * t;
    const x = Math.cos(angle) * currentRadius;
    const y = Math.sin(angle) * currentRadius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
}

function drawWave(ctx, radius) {
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  for (let i = 0; i <= 60; i++) {
    const x = -radius + (radius * 2 * i) / 60;
    const y = Math.sin(i * 0.35) * radius * 0.35;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(radius, radius * 0.45);
  ctx.lineTo(-radius, radius * 0.45);
  ctx.closePath();
}

function drawShapePath(ctx, shapeType, radius, rng) {
  switch (shapeType) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      break;
    case "rectangle":
      ctx.beginPath();
      ctx.rect(-radius, -radius * 0.68, radius * 2, radius * 1.36);
      break;
    case "triangle":
      drawRegularPolygon(ctx, 3, radius);
      break;
    case "hexagon":
      drawRegularPolygon(ctx, 6, radius);
      break;
    case "rhombus":
    case "diamond":
      drawRegularPolygon(ctx, 4, radius);
      break;
    case "star":
      drawStar(ctx, radius);
      break;
    case "spiral":
      drawSpiral(ctx, radius, rng);
      break;
    case "ellipse":
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.25, radius * 0.65, 0, 0, Math.PI * 2);
      break;
    case "pentagon":
      drawRegularPolygon(ctx, 5, radius);
      break;
    case "heart":
      drawHeart(ctx, radius);
      break;
    case "cross":
      drawCross(ctx, radius);
      break;
    case "arrow":
      drawArrow(ctx, radius);
      break;
    case "parallelogram":
      ctx.beginPath();
      ctx.moveTo(-radius * 0.75, -radius * 0.55);
      ctx.lineTo(radius, -radius * 0.55);
      ctx.lineTo(radius * 0.72, radius * 0.55);
      ctx.lineTo(-radius, radius * 0.55);
      ctx.closePath();
      break;
    case "trapezoid":
      ctx.beginPath();
      ctx.moveTo(-radius * 0.55, -radius * 0.55);
      ctx.lineTo(radius * 0.55, -radius * 0.55);
      ctx.lineTo(radius, radius * 0.55);
      ctx.lineTo(-radius, radius * 0.55);
      ctx.closePath();
      break;
    case "wave":
    case "zigzag":
      drawWave(ctx, radius);
      break;
    default:
      drawRegularPolygon(ctx, 6, radius);
  }
}

function drawShapes(ctx, request) {
  const { width, height, shapes, shapeTypes, colorPalette, rng } = request;
  const count = Math.min(shapes, 900);
  const minDimension = Math.min(width, height);
  const types =
    shapeTypes.length > 0 ? shapeTypes : ["circle", "rectangle", "triangle"];

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < count; i++) {
    const shapeType = types[Math.floor(rng() * types.length)];
    const radius = randomBetween(
      rng,
      minDimension * 0.018,
      minDimension * 0.11,
    );
    const x = randomBetween(rng, radius, width - radius);
    const y = randomBetween(rng, radius, height - radius);
    const alpha = randomBetween(rng, 0.22, 0.74);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(randomBetween(rng, 0, Math.PI * 2));
    drawShapePath(ctx, shapeType, radius, rng);
    ctx.fillStyle = samplePalette(colorPalette, rng);
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.lineWidth = Math.max(1, radius * 0.035);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
  drawVignette(ctx, width, height, 0.28);
}

module.exports = drawShapes;
