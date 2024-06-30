const { getRandomColor, getRandomInt, getRandomPosition, getRandomPaletteColor } = require('../utils');

function drawCircle(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    ctx.arc(
        getRandomPosition(width),
        getRandomPosition(height),
        getRandomInt(20, 100),
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawRectangle(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    ctx.fillRect(
        getRandomPosition(width),
        getRandomPosition(height),
        getRandomInt(50, 150),
        getRandomInt(50, 150)
    );
}

function drawTriangle(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    ctx.moveTo(x, y);
    ctx.lineTo(x + getRandomInt(50, 150), y);
    ctx.lineTo(x + getRandomInt(25, 75), y - getRandomInt(50, 150));
    ctx.closePath();
    ctx.fill();
}

function drawHexagon(ctx, width, height, colorPalette) {
    const sideLength = getRandomInt(30, 100);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(
            x + sideLength * Math.cos((i * Math.PI) / 3),
            y + sideLength * Math.sin((i * Math.PI) / 3)
        );
    }
    ctx.closePath();
    ctx.fill();
}

function drawRhombus(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const size = getRandomInt(50, 100);
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y - size / 2);
    ctx.lineTo(x + 2 * size, y);
    ctx.lineTo(x + size, y + size / 2);
    ctx.closePath();
    ctx.fill();
}

function drawStar(ctx, width, height, colorPalette) {
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const spikes = 5;
    const outerRadius = getRandomInt(30, 100);
    const innerRadius = getRandomInt(15, 50);
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rot) * outerRadius, y - Math.sin(rot) * outerRadius);
        rot += step;

        ctx.lineTo(x + Math.cos(rot) * innerRadius, y - Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    ctx.fill();
}

function drawSpiral(ctx, width, height, colorPalette) {
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const radius = getRandomInt(20, 50);
    const coils = 5;
    const revolutions = getRandomInt(1, 5);
    const rotation = (2 * Math.PI) / 100;

    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < 100 * coils; i++) {
        const angle = i * rotation * revolutions;
        const newX = x + Math.cos(angle) * (radius * i) / 100;
        const newY = y + Math.sin(angle) * (radius * i) / 100;
        ctx.lineTo(newX, newY);
    }
    ctx.strokeStyle = getRandomPaletteColor(colorPalette);
    ctx.stroke();
}

function drawEllipse(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    ctx.ellipse(
        getRandomPosition(width),
        getRandomPosition(height),
        getRandomInt(20, 100),
        getRandomInt(30, 150),
        Math.PI / 4,
        0,
        2 * Math.PI
    );
    ctx.fill();
}

function drawPentagon(ctx, width, height, colorPalette) {
    const sideLength = getRandomInt(30, 100);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(
            x + sideLength * Math.cos((i * Math.PI) / 2.5),
            y + sideLength * Math.sin((i * Math.PI) / 2.5)
        );
    }
    ctx.closePath();
    ctx.fill();
}

function drawHeart(ctx, width, height, colorPalette) {
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const size = getRandomInt(30, 100);
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size, x, y + size);
    ctx.bezierCurveTo(x, y + size, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
}

function drawDiamond(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const size = getRandomInt(50, 100);
    ctx.moveTo(x, y);
    ctx.lineTo(x + size / 2, y - size / 2);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.closePath();
    ctx.fill();
}

function drawCross(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const size = getRandomInt(50, 100);
    ctx.fillRect(x - size / 4, y - size, size / 2, size * 2);
    ctx.fillRect(x - size, y - size / 4, size * 2, size / 2);
}

function drawArrow(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const size = getRandomInt(50, 100);
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size, y - size / 2);
    ctx.lineTo(x + size * 1.5, y + size / 2);
    ctx.lineTo(x + size, y + size * 1.5);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();
}

function drawParallelogram(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const widthSize = getRandomInt(50, 150);
    const heightSize = getRandomInt(30, 100);
    const skew = getRandomInt(20, 60);
    ctx.moveTo(x, y);
    ctx.lineTo(x + widthSize, y);
    ctx.lineTo(x + widthSize - skew, y + heightSize);
    ctx.lineTo(x - skew, y + heightSize);
    ctx.closePath();
    ctx.fill();
}

function drawTrapezoid(ctx, width, height, colorPalette) {
    ctx.beginPath();
    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const topWidth = getRandomInt(30, 80);
    const bottomWidth = getRandomInt(50, 100);
    const heightSize = getRandomInt(30, 60);
    ctx.moveTo(x, y);
    ctx.lineTo(x + topWidth, y);
    ctx.lineTo(x + bottomWidth, y + heightSize);
    ctx.lineTo(x - (bottomWidth - topWidth), y + heightSize);
    ctx.closePath();
    ctx.fill();
}

function drawWave(ctx, width, height, colorPalette) {
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const waveWidth = getRandomInt(50, 100);
    const waveHeight = getRandomInt(20, 50);
    const amplitude = getRandomInt(10, 30);

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 0; i < waveWidth; i++) {
        ctx.lineTo(x + i, y + Math.sin(i * 0.1) * amplitude);
    }

    ctx.lineTo(x + waveWidth, y + waveHeight);
    ctx.lineTo(x, y + waveHeight);
    ctx.closePath();

    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    ctx.fill();
}

function drawZigzag(ctx, width, height, colorPalette) {
    const x = getRandomPosition(width);
    const y = getRandomPosition(height);
    const zigzagWidth = getRandomInt(50, 100);
    const zigzagHeight = getRandomInt(20, 50);
    const amplitude = getRandomInt(10, 30);

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 0; i < zigzagWidth; i++) {
        const isPeak = i % 2 === 0;
        ctx.lineTo(x + i, y + (isPeak ? amplitude : -amplitude));
    }

    ctx.lineTo(x + zigzagWidth, y + zigzagHeight);
    ctx.lineTo(x, y + zigzagHeight);
    ctx.closePath();

    ctx.fillStyle = getRandomPaletteColor(colorPalette);
    ctx.fill();
}

function drawShapes(ctx, width, height, shapes, shapeTypes, colorPalette) {
    const shapeFunctions = {
        circle: drawCircle,
        rectangle: drawRectangle,
        triangle: drawTriangle,
        hexagon: drawHexagon,
        rhombus: drawRhombus,
        star: drawStar,
        spiral: drawSpiral,
        ellipse: drawEllipse,
        pentagon: drawPentagon,
        heart: drawHeart,
        diamond: drawDiamond,
        cross: drawCross,
        arrow: drawArrow,
        parallelogram: drawParallelogram,
        trapezoid: drawTrapezoid,
        wave: drawWave,
        zigzag: drawZigzag,
    };

    for (let i = 0; i < shapes; i++) {
        const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        shapeFunctions[shapeType](ctx, width, height, colorPalette);
    }
}

module.exports = drawShapes;
