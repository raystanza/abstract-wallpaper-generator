const { colorAtCss, getPalette } = require("./color");

function fillLinearGradient(
  ctx,
  width,
  height,
  colors,
  direction = "diagonal",
) {
  let gradient;

  if (direction === "vertical") {
    gradient = ctx.createLinearGradient(0, 0, 0, height);
  } else if (direction === "horizontal") {
    gradient = ctx.createLinearGradient(0, 0, width, 0);
  } else {
    gradient = ctx.createLinearGradient(0, 0, width, height);
  }

  const palette = Array.isArray(colors) ? colors : getPalette(colors);
  palette.forEach((color, index) => {
    const stop = palette.length === 1 ? 0 : index / (palette.length - 1);
    gradient.addColorStop(stop, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function fillRadialGradient(ctx, width, height, colors) {
  const palette = Array.isArray(colors) ? colors : getPalette(colors);
  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    0,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72,
  );

  palette.forEach((color, index) => {
    const stop = palette.length === 1 ? 0 : index / (palette.length - 1);
    gradient.addColorStop(stop, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function fillBackground(ctx, width, height, background) {
  const normalizedBackground = background || {
    type: "solid",
    colors: ["#101820"],
    direction: "diagonal",
  };

  if (normalizedBackground.type === "linear-gradient") {
    fillLinearGradient(
      ctx,
      width,
      height,
      normalizedBackground.colors,
      normalizedBackground.direction,
    );
    return;
  }

  if (normalizedBackground.type === "radial-gradient") {
    fillRadialGradient(ctx, width, height, normalizedBackground.colors);
    return;
  }

  ctx.fillStyle = normalizedBackground.colors[0];
  ctx.fillRect(0, 0, width, height);
}

function fillRadialBackdrop(ctx, width, height, paletteName) {
  fillLinearGradient(ctx, width, height, paletteName, "diagonal");

  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    0,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.75,
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  gradient.addColorStop(0.55, "rgba(0, 0, 0, 0.08)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.42)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawVignette(ctx, width, height, alpha = 0.35) {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function strokePaletteLine(ctx, paletteName, t, alpha = 1) {
  ctx.strokeStyle = colorAtCss(paletteName, t, alpha);
}

module.exports = {
  drawVignette,
  fillBackground,
  fillLinearGradient,
  fillRadialBackdrop,
  fillRadialGradient,
  strokePaletteLine,
};
