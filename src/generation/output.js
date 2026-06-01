const fs = require("fs");
const path = require("path");

function sanitizeSegment(value) {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "wallpaper"
  );
}

function createDefaultOutputPath({ generationType, width, height, seed }) {
  const outputDirectory = path.join(__dirname, "..", "..", "output");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const seedPart = seed ? `_${sanitizeSegment(seed)}` : "";
  const filename = `${sanitizeSegment(generationType)}_${width}x${height}${seedPart}_${timestamp}.png`;

  return path.join(outputDirectory, filename);
}

function createDownloadFilename({
  generationType,
  width,
  height,
  seed,
  createdAt = new Date(),
  format = "png",
}) {
  const timestamp = createdAt.toISOString().replace(/[:.]/g, "-");
  const seedPart = seed ? `_${sanitizeSegment(seed)}` : "";
  const extension = sanitizeSegment(format);

  return `${sanitizeSegment(generationType)}_${width}x${height}${seedPart}_${timestamp}.${extension}`;
}

function ensureOutputDirectory(outputFile) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
}

module.exports = {
  createDownloadFilename,
  createDefaultOutputPath,
  ensureOutputDirectory,
  sanitizeSegment,
};
