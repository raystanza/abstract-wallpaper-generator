const { getRandomColor } = require('./utils');

function drawShapes(ctx, width, height) {
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.fillStyle = getRandomColor();
        ctx.arc(
            Math.random() * width,
            Math.random() * height,
            Math.random() * 100,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

module.exports = { drawShapes };
