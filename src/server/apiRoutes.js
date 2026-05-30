const express = require("express");
const { generateWallpaper } = require("../generateWallpaper");
const { ValidationError } = require("../generation/validation");
const { createDownloadFilename } = require("../generation/output");
const { listGeneratorMetadata } = require("../generators");
const { CONTRACT_VERSION } = require("../shared/generationContract");
const { ERROR_CODES, sendError } = require("./errors");
const { normalizeGenerationRequest } = require("./generationRequest");

function createGenerationMetadata(result, filename, elapsedMs) {
  return {
    generationType: result.generationType,
    width: result.width,
    height: result.height,
    colorPalette: result.colorPalette,
    background: result.background,
    seed: result.seed,
    filename,
    elapsedMs: Number(elapsedMs.toFixed(1)),
  };
}

function setGenerationHeaders(res, result, metadata) {
  res.set({
    "Cache-Control": "no-store",
    "Content-Disposition": `inline; filename="${metadata.filename}"`,
    "Content-Length": result.buffer.length,
    "Content-Type": "image/png",
    "X-Generation-Time-Ms": metadata.elapsedMs.toFixed(1),
    "X-Wallpaper-Filename": metadata.filename,
    "X-Wallpaper-Generator": metadata.generationType,
    "X-Wallpaper-Metadata": JSON.stringify(metadata),
    "X-Wallpaper-Palette": metadata.colorPalette,
    "X-Wallpaper-Background": JSON.stringify(metadata.background),
    "X-Wallpaper-Resolution": `${metadata.width}x${metadata.height}`,
    "X-Wallpaper-Seed": metadata.seed,
  });
}

function sendGenerationError(res, error) {
  if (error instanceof ValidationError) {
    sendError(
      res,
      400,
      ERROR_CODES.INVALID_GENERATION_REQUEST,
      error.message,
      error.details,
    );
    return;
  }

  console.error("Error generating wallpaper:", error);
  sendError(
    res,
    500,
    ERROR_CODES.GENERATION_FAILED,
    "An error occurred while generating the wallpaper.",
  );
}

async function generateImage(req, res) {
  const startedAt = process.hrtime.bigint();
  const createdAt = new Date();

  try {
    const result = await generateWallpaper(
      normalizeGenerationRequest(req.body),
    );
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const filename = createDownloadFilename({
      generationType: result.generationType,
      width: result.width,
      height: result.height,
      seed: result.seed,
      createdAt,
    });
    const metadata = createGenerationMetadata(result, filename, elapsedMs);

    setGenerationHeaders(res, result, metadata);
    res.send(result.buffer);
  } catch (error) {
    sendGenerationError(res, error);
  }
}

function createApiRouter() {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({
      status: "ok",
      contractVersion: CONTRACT_VERSION,
      renderer: "server-cpu",
    });
  });

  router.get("/generators", (req, res) => {
    res.json({
      generators: listGeneratorMetadata(),
    });
  });

  router.post("/generate", generateImage);

  router.use((req, res) => {
    sendError(
      res,
      404,
      ERROR_CODES.NOT_FOUND,
      `API route ${req.method} ${req.originalUrl} was not found.`,
    );
  });

  return router;
}

module.exports = {
  createApiRouter,
  createGenerationMetadata,
  generateImage,
  normalizeGenerationRequest,
  setGenerationHeaders,
};
