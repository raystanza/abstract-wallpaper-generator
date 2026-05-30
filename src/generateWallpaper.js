const { renderWallpaper } = require("./generation/renderWallpaper");

function normalizeGenerationArgs(args) {
  if (args.length === 1 && typeof args[0] === "object") {
    return args[0];
  }

  const [
    width,
    height,
    shapes,
    shapeTypes,
    colorPalette,
    generationType,
    outputFile,
  ] = args;

  return {
    width,
    height,
    shapes,
    shapeTypes,
    colorPalette,
    generationType,
    outputFile,
  };
}

async function generateWallpaper(...args) {
  return renderWallpaper(normalizeGenerationArgs(args));
}

module.exports = {
  generateWallpaper,
  renderWallpaper,
};
