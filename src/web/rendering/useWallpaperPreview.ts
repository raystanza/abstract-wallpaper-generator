import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GenerationRequest,
  GeneratorMetadata,
  RenderMode,
} from "../../shared/contracts";
import {
  choosePreviewRenderMode,
  createPreviewMetrics,
  previewDebounceMs,
  serializePreviewRequest,
  type PreviewMetrics,
} from "../../shared/previewOrchestration.mjs";
import {
  createPreviewRenderer,
  detectRendererCapabilities,
  renderServerPreview,
  type BrowserRendererCapabilities,
  type PreviewRenderer,
} from ".";

export type WallpaperPreviewStatus =
  | "idle"
  | "rendering"
  | "ready"
  | "fallback"
  | "error";

export type WallpaperPreviewState = {
  activeMode: RenderMode;
  capabilities: BrowserRendererCapabilities | null;
  imageUrl: string | null;
  message: string;
  metrics: PreviewMetrics;
  pendingManualRender: boolean;
  requestKey: string;
  status: WallpaperPreviewStatus;
};

type UseWallpaperPreviewOptions = {
  autoPreview: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  forceServer?: boolean;
  generator: GeneratorMetadata | undefined;
  request: GenerationRequest | null;
};

const emptyMetrics = createPreviewMetrics({
  elapsedMs: null,
  mode: "server-cpu",
  request: null,
});

export function useWallpaperPreview({
  autoPreview,
  canvasRef,
  forceServer = false,
  generator,
  request,
}: UseWallpaperPreviewOptions) {
  const [capabilities, setCapabilities] =
    useState<BrowserRendererCapabilities | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<WallpaperPreviewState>({
    activeMode: "server-cpu",
    capabilities: null,
    imageUrl: null,
    message: "Detecting renderer",
    metrics: emptyMetrics,
    pendingManualRender: false,
    requestKey: "",
    status: "idle",
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRunIdRef = useRef(0);
  const lastImmediateRefreshVersionRef = useRef(0);
  const lastManualRefreshVersionRef = useRef(0);
  const objectUrlRef = useRef<string | null>(null);
  const rendererRef = useRef<PreviewRenderer | null>(null);

  useEffect(() => {
    setCapabilities(detectRendererCapabilities());
  }, []);

  useEffect(() => {
    setState((currentState) => ({
      ...currentState,
      capabilities,
    }));
  }, [capabilities]);

  const requestKey = useMemo(
    () => serializePreviewRequest(request),
    [request],
  );
  const debounceMs = useMemo(
    () => previewDebounceMs(request, generator),
    [generator, request],
  );
  const plannedMode = useMemo(
    () =>
      choosePreviewRenderMode({
        autoPreview,
        capabilities,
        forceServer,
        generator,
        request,
      }),
    [autoPreview, capabilities, forceServer, generator, request],
  );

  const revokeObjectUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const clearObjectUrl = useCallback(() => {
    revokeObjectUrl(objectUrlRef.current);
    objectUrlRef.current = null;
  }, [revokeObjectUrl]);

  const refreshPreview = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const runId = latestRunIdRef.current + 1;
    latestRunIdRef.current = runId;
    abortControllerRef.current?.abort();

    if (!request || !generator) {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      setState((currentState) => ({
        ...currentState,
        message: "Waiting for generator",
        pendingManualRender: false,
        requestKey,
        status: "idle",
      }));
      return;
    }

    const renderMode =
      plannedMode === "manual" &&
      refreshVersion !== lastManualRefreshVersionRef.current
        ? choosePreviewRenderMode({
            autoPreview: true,
            capabilities,
            forceServer,
            generator,
            request,
          })
        : plannedMode;

    if (plannedMode === "manual") {
      if (renderMode === "manual") {
        setState((currentState) => ({
          ...currentState,
          message: "Auto preview off. Refresh when ready.",
          pendingManualRender: true,
          requestKey,
          status: currentState.imageUrl ? "ready" : "idle",
        }));
        return;
      }

      lastManualRefreshVersionRef.current = refreshVersion;
    }

    if (renderMode === "idle") {
      setState((currentState) => ({
        ...currentState,
        message: "Waiting for request",
        pendingManualRender: false,
        requestKey,
        status: "idle",
      }));
      return;
    }

    const renderRequest = request;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const isExplicitRefresh =
      refreshVersion !== lastImmediateRefreshVersionRef.current;
    if (isExplicitRefresh) {
      lastImmediateRefreshVersionRef.current = refreshVersion;
    }
    const timer = window.setTimeout(() => {
      const startedAt = performance.now();

      async function renderServer(reason: string) {
        setState((currentState) => ({
          ...currentState,
          activeMode: "server-cpu",
          message: `${reason} Rendering server preview`,
          pendingManualRender: false,
          requestKey,
          status: reason ? "fallback" : "rendering",
        }));
        const result = await renderServerPreview(renderRequest, {
          signal: abortController.signal,
        });

        if (
          abortController.signal.aborted ||
          latestRunIdRef.current !== runId
        ) {
          return;
        }

        const objectUrl = URL.createObjectURL(result.blob);
        const previousUrl = objectUrlRef.current;
        objectUrlRef.current = objectUrl;
        revokeObjectUrl(previousUrl);
        rendererRef.current?.dispose();
        rendererRef.current = null;
        setState((currentState) => ({
          ...currentState,
          activeMode: "server-cpu",
          imageUrl: objectUrl,
          message: `Server preview ${(result.metadata.elapsedMs ?? 0).toFixed(
            1,
          )}ms`,
          metrics: createPreviewMetrics({
            elapsedMs: result.metadata.elapsedMs ?? performance.now() - startedAt,
            mode: "server-cpu",
            request: renderRequest,
          }),
          pendingManualRender: false,
          requestKey,
          status: reason ? "fallback" : "ready",
        }));
      }

      async function render() {
        setState((currentState) => ({
          ...currentState,
          activeMode: renderMode === "webgl2" ? "webgl2" : "server-cpu",
          message:
            renderMode === "webgl2"
              ? "Rendering GPU preview"
              : "Rendering server preview",
          pendingManualRender: false,
          requestKey,
          status: "rendering",
        }));

        if (renderMode !== "webgl2") {
          await renderServer(
            forceServer || capabilities?.preferredMode === "webgl2"
              ? ""
              : "WebGL2 unavailable.",
          );
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas || !capabilities) {
          await renderServer("Canvas unavailable.");
          return;
        }

        try {
          rendererRef.current?.dispose();
          rendererRef.current = createPreviewRenderer(canvas, {
            capabilities,
          });
          await rendererRef.current.renderPreview(renderRequest);

          if (
            abortController.signal.aborted ||
            latestRunIdRef.current !== runId
          ) {
            return;
          }

          clearObjectUrl();
          setState((currentState) => ({
            ...currentState,
            activeMode: "webgl2",
            imageUrl: null,
            message: "GPU preview active",
            metrics: createPreviewMetrics({
              elapsedMs: performance.now() - startedAt,
              mode: "webgl2",
              request: renderRequest,
            }),
            pendingManualRender: false,
            requestKey,
            status: "ready",
          }));
        } catch (error) {
          rendererRef.current?.dispose();
          rendererRef.current = null;

          if (
            abortController.signal.aborted ||
            latestRunIdRef.current !== runId
          ) {
            return;
          }

          await renderServer(
            error instanceof Error ? `GPU failed: ${error.message}.` : "GPU failed.",
          );
        }
      }

      render().catch((error) => {
        if (
          abortController.signal.aborted ||
          latestRunIdRef.current !== runId
        ) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          message: error instanceof Error ? error.message : "Preview failed",
          pendingManualRender: false,
          requestKey,
          status: "error",
        }));
      });
    }, isExplicitRefresh ? 0 : debounceMs);

    return () => {
      window.clearTimeout(timer);
      abortController.abort();
    };
  }, [
    autoPreview,
    canvasRef,
    capabilities,
    clearObjectUrl,
    debounceMs,
    forceServer,
    generator,
    plannedMode,
    refreshVersion,
    request,
    requestKey,
    revokeObjectUrl,
  ]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      rendererRef.current?.dispose();
      clearObjectUrl();
    },
    [clearObjectUrl],
  );

  return {
    ...state,
    capabilities,
    refreshPreview,
  };
}
