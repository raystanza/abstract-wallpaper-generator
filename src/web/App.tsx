import { useEffect, useMemo, useState } from "react";
import type { GeneratorMetadata, GeneratorResponse } from "../shared/contracts";

type ApiStatus = "loading" | "ready" | "error";

function formatCategory(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function App() {
  const [generators, setGenerators] = useState<GeneratorMetadata[]>([]);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState("");
  const [status, setStatus] = useState<ApiStatus>("loading");
  const [statusMessage, setStatusMessage] = useState(
    "Connecting to the generator API.",
  );

  useEffect(() => {
    let isCurrent = true;

    async function loadGenerators() {
      try {
        const response = await fetch("/api/generators");

        if (!response.ok) {
          throw new Error(`Generator API returned ${response.status}.`);
        }

        const payload = (await response.json()) as GeneratorResponse;
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
          <div className="preview-canvas" aria-hidden="true">
            <span className="preview-line preview-line--one" />
            <span className="preview-line preview-line--two" />
            <span className="preview-line preview-line--three" />
          </div>
          <div className="preview-details">
            <span className="category-label">
              {selectedGenerator
                ? formatCategory(selectedGenerator.category)
                : "No category"}
            </span>
            <h3>{selectedGenerator?.name ?? "No generator selected"}</h3>
            <p>
              This React workspace is connected to the existing Express API.
              Live rendering controls will build on this shell in the next
              migration prompts.
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
