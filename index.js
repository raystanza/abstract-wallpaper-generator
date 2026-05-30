const express = require("express");
const path = require("path");
const { createApiRouter, generateImage } = require("./src/server/apiRoutes");
const {
  ERROR_CODES,
  isJsonSyntaxError,
  sendError,
} = require("./src/server/errors");

const port = 3000;
const publicDirectory = path.join(__dirname, "public");
const clientBuildDirectory = path.join(__dirname, "dist");

function createApp() {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(publicDirectory));

  app.use("/api", createApiRouter());
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
        res
          .status(404)
          .send(
            "Frontend build not found. Run `pnpm run build` or use `pnpm run dev` for the Vite development server.",
          );
        return;
      }

      next(error);
    });
  });

  app.use((error, req, res, next) => {
    if (isJsonSyntaxError(error)) {
      sendError(
        res,
        400,
        ERROR_CODES.INVALID_JSON,
        "Invalid JSON request body.",
      );
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
