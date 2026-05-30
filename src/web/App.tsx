import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GenerationRequest,
  GeneratorMetadata,
  RenderMode,
} from "../shared/contracts";
import { getGenerators } from "./lib/apiClient";
import {
  createPreviewRenderer,
  detectRendererCapabilities,
  renderServerPreview,
  rendererModeLabel,
  type BrowserRendererCapabilities,
  type PreviewRenderer,
} from "./rendering";

type ApiStatus = "loading" | "ready" | "error";
type PreviewStatus = "idle" | "rendering" | "ready" | "error";

function formatCategory(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRendererRef = useRef<PreviewRenderer | null>(null);
  const [generators, setGenerators] = useState<GeneratorMetadata[]>([]);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState("");
  const [status, setStatus] = useState<ApiStatus>("loading");
  const [statusMessage, setStatusMessage] = useState(
    "Connecting to the generator API.",
  );
  const [capabilities, setCapabilities] =
    useState<BrowserRendererCapabilities | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("idle");
  const [previewMessage, setPreviewMessage] = useState(
    "Waiting for renderer capabilities.",
  );
  const [activeMode, setActiveMode] = useState<RenderMode>("server-cpu");
  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setCapabilities(detectRendererCapabilities());
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function loadGenerators() {
      try {
        const payload = await getGenerators();
        const nextGenerators = Array.isArray(payload.generators)
          ? payload.generators
          : [];

        if (!isCurrent) {
          return;
        }

        setGenerators(nextGenerators);
        setSelectedGeneratorId(nextGenerators[0]?.id ?? "");
        setStatus("ready");
        setStatusMessage(
          `Connected to ${nextGenerators.length} generator${nextGenerators.length === 1 ? "" : "s"}.`,
        );
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setStatus("error");
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Unable to load generator metadata.",
        );
      }
    }

    loadGenerators();

    return () => {
      isCurrent = false;
    };
  }, []);

  const selectedGenerator = useMemo(
    () =>
      generators.find((generator) => generator.id === selectedGeneratorId) ??
      generators[0],
    [generators, selectedGeneratorId],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(generators.map((generator) => generator.category)),
      ).sort(),
    [generators],
  );

  const previewRequest = useMemo<GenerationRequest | null>(() => {
    if (!selectedGenerator) {
      return null;
    }

    return {
      width: 960,
      height: 540,
      shapes: selectedGenerator.defaults.shapes,
      shapeTypes: selectedGenerator.defaults.shapeTypes,
      colorPalette: selectedGenerator.defaults.colorPalette,
      background: selectedGenerator.defaults.background,
      generationType: selectedGenerator.id,
      seed:
        selectedGenerator.defaults.seed || `preview-${selectedGenerator.id}`,
      options: selectedGenerator.defaults.options,
    };
  }, [selectedGenerator]);

  useEffect(() => {
    let isCurrent = true;
    let objectUrl: string | null = null;
    const canvas = canvasRef.current;

    previewRendererRef.current?.dispose();
    previewRendererRef.current = null;

    if (!canvas || !capabilities || !previewRequest) {
      return () => {
        isCurrent = false;
      };
    }

    const targetCanvas = canvas;
    const detectedCapabilities = capabilities;
    const request = previewRequest;

    async function renderFallback(reason: string) {
      setPreviewStatus("rendering");
      setPreviewMessage(`${reason} Rendering server preview.`);
      const result = await renderServerPreview(request);
      objectUrl = URL.createObjectURL(result.blob);

      if (!isCurrent) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      setServerPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return objectUrl;
      });
      setActiveMode("server-cpu");
      setPreviewStatus("ready");
      setPreviewMessage(
        `CPU/server fallback rendered in ${(result.metadata.elapsedMs ?? 0).toFixed(1)}ms.`,
      );
    }

    async function renderPreview() {
      setPreviewStatus("rendering");
      setPreviewMessage("Preparing preview renderer.");

      if (detectedCapabilities.preferredMode !== "webgl2") {
        await renderFallback("WebGL2 preview is unavailable.");
        return;
      }

      try {
        const renderer = createPreviewRenderer(targetCanvas, {
          capabilities: detectedCapabilities,
        });
        previewRendererRef.current = renderer;
        await renderer.renderPreview(request);

        if (!isCurrent) {
          return;
        }

        setServerPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }

          return null;
        });
        setActiveMode("webgl2");
        setPreviewStatus("ready");
        setPreviewMessage("GPU preview active.");
      } catch (error) {
        previewRendererRef.current?.dispose();
        previewRendererRef.current = null;

        if (!isCurrent) {
          return;
        }

        await renderFallback(
          error instanceof Error
            ? `GPU preview failed: ${error.message}.`
            : "GPU preview failed.",
        );
      }
    }

    renderPreview().catch((error) => {
      if (!isCurrent) {
        return;
      }

      setPreviewStatus("error");
      setPreviewMessage(
        error instanceof Error ? error.message : "Preview rendering failed.",
      );
    });

    return () => {
      isCurrent = false;
      previewRendererRef.current?.dispose();
      previewRendererRef.current = null;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [capabilities, previewRequest]);

  return (
    <main className="studio-shell" aria-labelledby="app-title">
      <aside className="studio-sidebar" aria-label="Generator setup">
        <header className="studio-brand">
          <p className="eyebrow">Creator Studio</p>
          <h1 id="app-title">Abstract Wallpaper Generator</h1>
        </header>

        <section className="control-group" aria-labelledby="generator-heading">
          <div className="section-title-row">
            <h2 id="generator-heading">Generator</h2>
            <span className={`status-pill status-pill--${status}`}>
              {status}
            </span>
          </div>

          <label htmlFor="generator-select">Algorithm</label>
          <select
            id="generator-select"
            value={selectedGeneratorId}
            onChange={(event) => setSelectedGeneratorId(event.target.value)}
            disabled={generators.length === 0}
          >
            {generators.length === 0 ? (
              <option value="">Loading generators</option>
            ) : (
              generators.map((generator) => (
                <option key={generator.id} value={generator.id}>
                  {generator.name}
                </option>
              ))
            )}
          </select>

          <p className="field-note" aria-live="polite">
            {selectedGenerator?.description ??
              "Generator metadata will appear here when the API responds."}
          </p>
        </section>

        <section className="control-group" aria-labelledby="canvas-heading">
          <h2 id="canvas-heading">Canvas</h2>
          <div className="metric-grid">
            <div>
              <span className="metric-label">Resolution</span>
              <strong>1920 x 1080</strong>
            </div>
            <div>
              <span className="metric-label">Seed</span>
              <strong>Auto</strong>
            </div>
          </div>
        </section>

        <section className="control-group" aria-labelledby="api-heading">
          <h2 id="api-heading">API Status</h2>
          <p className="status-copy" role="status">
            {statusMessage}
          </p>
        </section>

        <section className="control-group" aria-labelledby="renderer-heading">
          <div className="section-title-row">
            <h2 id="renderer-heading">Renderer</h2>
            <span className={`status-pill status-pill--${previewStatus}`}>
              {rendererModeLabel(activeMode)}
            </span>
          </div>
          <p className="status-copy" role="status">
            {previewMessage}
          </p>
          <dl className="diagnostics-list" aria-label="Renderer diagnostics">
            {(capabilities?.diagnostics ?? ["Detecting renderer."]).map(
              (detail) => (
                <div key={detail}>
                  <dt>{detail}</dt>
                </div>
              ),
            )}
          </dl>
        </section>
      </aside>

      <section className="preview-workspace" aria-label="Wallpaper preview">
        <div className="preview-toolbar">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{selectedGenerator?.name ?? "Waiting for API"}</h2>
          </div>
          <div className="toolbar-meta" aria-label="Generator summary">
            <span>{generators.length} generators</span>
            <span>{categories.length} categories</span>
          </div>
        </div>

        <div className="preview-stage">
          <canvas
            ref={canvasRef}
            className="preview-render-canvas"
            aria-label="Hardware accelerated abstract wallpaper preview"
          />
          {serverPreviewUrl ? (
            <img
              className="preview-render-image"
              src={serverPreviewUrl}
              alt="Server-rendered abstract wallpaper preview"
            />
          ) : null}
          <div className="preview-details">
            <span className="category-label">
              {selectedGenerator
                ? formatCategory(selectedGenerator.category)
                : "No category"}
            </span>
            <h3>{selectedGenerator?.name ?? "No generator selected"}</h3>
            <p>
              {previewStatus === "ready"
                ? previewMessage
                : "The preview layer detects browser GPU support and falls back to server rendering when needed."}
            </p>
          </div>
        </div>

        <div className="metadata-strip" aria-label="Selected generator details">
          <div>
            <span>ID</span>
            <strong>{selectedGenerator?.id ?? "none"}</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>
              {selectedGenerator
                ? formatCategory(selectedGenerator.category)
                : "none"}
            </strong>
          </div>
          <div>
            <span>Controls</span>
            <strong>{selectedGenerator?.parameters.length ?? 0}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
