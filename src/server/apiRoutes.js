const express = require("express");
const { generateWallpaper } = require("../generateWallpaper");
const { ValidationError } = require("../generation/validation");
const { createDownloadFilename } = require("../generation/output");
const { listGeneratorMetadata } = require("../generators");
const { CONTRACT_VERSION, EXPORT_FORMATS } = require("../shared/generationContract");
const { ERROR_CODES, sendError } = require("./errors");
const {
  normalizeExportRequest,
  normalizeGenerationRequest,
} = require("./generationRequest");

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

function createExportMetadata(result, filename, elapsedMs, format = "png") {
  return {
    ...createGenerationMetadata(result, filename, elapsedMs),
    format,
    renderer: "server-cpu",
  };
}

function setGenerationHeaders(
  res,
  result,
  metadata,
  disposition = "inline",
) {
  res.set({
    "Cache-Control": "no-store",
    "Content-Disposition": `${disposition}; filename="${metadata.filename}"`,
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

  if (metadata.format) {
    res.set({
      "X-Wallpaper-Export-Format": metadata.format,
      "X-Wallpaper-Renderer": metadata.renderer,
    });
  }
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

function validateExportRequest(request) {
  if (!EXPORT_FORMATS.includes(request.format)) {
    throw new ValidationError("Invalid wallpaper export request.", [
      `format must be one of: ${EXPORT_FORMATS.join(", ")}.`,
    ]);
  }

  return request;
}

async function exportImage(req, res) {
  const startedAt = process.hrtime.bigint();
  const createdAt = new Date();

  try {
    const exportRequest = validateExportRequest(
      normalizeExportRequest(req.body),
    );
    const result = await generateWallpaper(exportRequest);
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const filename = createDownloadFilename({
      generationType: result.generationType,
      width: result.width,
      height: result.height,
      seed: result.seed,
      createdAt,
      format: exportRequest.format,
    });
    const metadata = createExportMetadata(
      result,
      filename,
      elapsedMs,
      exportRequest.format,
    );

    setGenerationHeaders(res, result, metadata, "attachment");
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
  router.post("/export", exportImage);

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
  createExportMetadata,
  createGenerationMetadata,
  exportImage,
  generateImage,
  normalizeExportRequest,
  normalizeGenerationRequest,
  setGenerationHeaders,
};
