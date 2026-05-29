const { colorAtCss, getPalette } = require('./color');

function fillLinearGradient(ctx, width, height, colors, direction = 'diagonal') {
    const gradient =
        direction === 'vertical'
            ? ctx.createLinearGradient(0, 0, 0, height)
            : ctx.createLinearGradient(0, 0, width, height);

    const palette = Array.isArray(colors) ? colors : getPalette(colors);
    palette.forEach((color, index) => {
        const stop = palette.length === 1 ? 0 : index / (palette.length - 1);
        gradient.addColorStop(stop, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function fillRadialBackdrop(ctx, width, height, paletteName) {
    fillLinearGradient(ctx, width, height, paletteName, 'diagonal');

    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.42)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawVignette(ctx, width, height, alpha = 0.35) {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function strokePaletteLine(ctx, paletteName, t, alpha = 1) {
    ctx.strokeStyle = colorAtCss(paletteName, t, alpha);
}

module.exports = {
    drawVignette,
    fillLinearGradient,
    fillRadialBackdrop,
    strokePaletteLine,
};

