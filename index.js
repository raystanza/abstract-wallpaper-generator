const express = require("express");
const path = require("path");
const { generateWallpaper } = require("./src/generateWallpaper");
const { ValidationError } = require("./src/generation/validation");
const { createDownloadFilename } = require("./src/generation/output");
const { listGeneratorMetadata } = require("./src/generators");

const port = 3000;
const publicDirectory = path.join(__dirname, "public");
const clientBuildDirectory = path.join(__dirname, "dist");

function normalizeShapeTypes(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

function createGenerationRequest(body) {
  return {
    width: body.width,
    height: body.height,
    shapes: body.shapes,
    shapeTypes: normalizeShapeTypes(body.shapeTypes),
    colorPalette: body.colorPalette,
    background: body.background,
    backgroundType: body.backgroundType,
    backgroundColor: body.backgroundColor,
    backgroundColor2: body.backgroundColor2,
    backgroundColors: body.backgroundColors,
    backgroundDirection: body.backgroundDirection,
    generationType: body.generationType,
    seed: body.seed,
    options: body.options || {},
  };
}

function sendStructuredError(res, error) {
  if (error instanceof ValidationError) {
    res.status(400).json({
      error: error.message,
      details: error.details,
    });
    return;
  }

  console.error("Error generating wallpaper:", error);
  res.status(500).json({
    error: "An error occurred while generating the wallpaper.",
  });
}

async function generateImage(req, res) {
  const startedAt = process.hrtime.bigint();
  const createdAt = new Date();

  try {
    const result = await generateWallpaper(createGenerationRequest(req.body));
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const filename = createDownloadFilename({
      generationType: result.generationType,
      width: result.width,
      height: result.height,
      seed: result.seed,
      createdAt,
    });

    res.set({
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": result.buffer.length,
      "Content-Type": "image/png",
      "X-Generation-Time-Ms": elapsedMs.toFixed(1),
      "X-Wallpaper-Filename": filename,
      "X-Wallpaper-Generator": result.generationType,
      "X-Wallpaper-Palette": result.colorPalette,
      "X-Wallpaper-Background": JSON.stringify(result.background),
      "X-Wallpaper-Resolution": `${result.width}x${result.height}`,
      "X-Wallpaper-Seed": result.seed,
    });
    res.send(result.buffer);
  } catch (error) {
    sendStructuredError(res, error);
  }
}

function createApp() {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(publicDirectory));

  app.get("/api/generators", (req, res) => {
    res.json({
      generators: listGeneratorMetadata(),
    });
  });

  app.post("/api/generate", generateImage);
  app.post("/generate", generateImage);

  app.use(express.static(clientBuildDirectory));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.sendFile(path.join(clientBuildDirectory, "index.html"), (error) => {
      if (!error) {
        return;
      }

      if (error.code === "ENOENT") {
        res.status(404).send(
          "Frontend build not found. Run `pnpm run build` or use `pnpm run dev` for the Vite development server.",
        );
        return;
      }

      next(error);
    });
  });

  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({
        error: "Invalid JSON request body.",
      });
      return;
    }

    next(error);
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

module.exports = {
  app,
  createApp,
};
