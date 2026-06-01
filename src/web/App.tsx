import {
  ChevronDown,
  ChevronUp,
  Copy,
  Cpu,
  ClipboardPaste,
  Download,
  History,
  ImageIcon,
  Palette,
  PanelRight,
  Plus,
  RefreshCcw,
  Save,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BackgroundSpec,
  GenerationRequest,
  GeneratorMetadata,
  GeneratorParameter,
  ParameterOption,
  WallpaperHistoryItem,
  WallpaperPreset,
} from "../shared/contracts";
import generatorSettings, {
  type GeneratorSettings,
} from "../shared/generatorSettings.mjs";
import { listPaletteEntries, randomPaletteId } from "../shared/paletteCatalog.mjs";
import {
  PROJECT_STORAGE_KEY,
  createHistoryItem,
  parseProjectState,
  removeHistoryItem,
  restoreHistorySettings,
  serializeProjectState,
  toggleHistoryFavorite,
  upsertHistoryItem,
} from "../shared/projectState.mjs";
import {
  applyWallpaperPreset,
  listWallpaperPresets,
  parseGeneratorSettingsJson,
  serializeGeneratorSettings,
} from "../shared/wallpaperPresets.mjs";
import {
  Button,
  ColorSwatch,
  IconButton,
  InputField,
  PanelHeader,
  SegmentedControl,
  SelectField,
  SliderField,
  StatusBadge,
  Toggle,
} from "./components/ui";
import { exportWallpaper, getGenerators } from "./lib/apiClient";
import { rendererModeLabel } from "./rendering";
import { getPreviewPalette } from "./rendering/palettes";
import { useWallpaperPreview } from "./rendering/useWallpaperPreview";

const {
  BACKGROUND_DIRECTIONS,
  BACKGROUND_TYPES,
  createDefaultGeneratorSettings,
  createExportRequest,
  createGenerationRequest,
  normalizeBackground,
  presetValueForSize,
  resolutionPresets,
  switchGeneratorSettings,
  updateGeneratorParameter,
  updateGeneratorSize,
  validateGeneratorSettings,
} = generatorSettings;

const builtInPresets = listWallpaperPresets();

type ApiStatus = "loading" | "ready" | "error";
type ExportStatus = "idle" | "exporting" | "ready" | "error";
type PreviewStatus = "idle" | "rendering" | "ready" | "fallback" | "error";
type ParameterGroupName = "generator" | "style" | "seed" | "advanced";
type WorkflowTone = "neutral" | "success" | "warning" | "danger";

const HISTORY_CAPTURE_COOLDOWN_MS = 2500;

const groupLabels: Record<ParameterGroupName, { eyebrow: string; title: string }> =
  {
    generator: { eyebrow: "Controls", title: "Generator" },
    style: { eyebrow: "Look", title: "Style" },
    seed: { eyebrow: "Seed", title: "Variation" },
    advanced: { eyebrow: "Advanced", title: "Fine Tune" },
  };

function formatCategory(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createSeed() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(36)).join("-");
}

function statusTone(status: ApiStatus | ExportStatus | PreviewStatus) {
  if (status === "ready") {
    return "success";
  }

  if (status === "error") {
    return "danger";
  }

  if (
    status === "exporting" ||
    status === "fallback" ||
    status === "rendering" ||
    status === "loading"
  ) {
    return "warning";
  }

  return "neutral";
}

function optionLabel(options: ParameterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function describeValue(parameter: GeneratorParameter, value: unknown) {
  if (parameter.kind === "background") {
    const background = normalizeBackground(value);
    return `${formatCategory(background.type)} ${background.colors.join(" ")}`;
  }

  if (parameter.kind === "select") {
    if (parameter.multiple) {
      const values = Array.isArray(value) ? value : [];
      return values
        .slice(0, 3)
        .map((entry) => optionLabel(parameter.options, String(entry)))
        .join(", ");
    }

    return optionLabel(parameter.options, String(value));
  }

  if (parameter.kind === "palette") {
    return optionLabel(parameter.options, String(value));
  }

  if (parameter.kind === "boolean") {
    return value ? "On" : "Off";
  }

  if (parameter.kind === "color-array") {
    return Array.isArray(value) ? value.join(" ") : "";
  }

  if (parameter.kind === "group") {
    return `${parameter.children.length} controls`;
  }

  return String(value ?? "");
}

function getParameterValue(
  settings: GeneratorSettings,
  parameter: GeneratorParameter,
) {
  return settings.parameters[parameter.id] ?? parameter.defaultValue;
}

function numericValue(value: unknown, fallback: number) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function getColorAt(background: BackgroundSpec, index: number) {
  return background.colors[index] ?? background.colors[0] ?? "#101820";
}

function previewExportFilename(
  generator: GeneratorMetadata | undefined,
  settings: GeneratorSettings | null,
) {
  if (!generator || !settings) {
    return "wallpaper.png";
  }

  const seedPart = settings.seed ? `_${settings.seed}` : "_auto-seed";
  const safeSeed = seedPart
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 48);

  return `${generator.id}_${settings.width}x${settings.height}${safeSeed}_timestamp.png`;
}

function seedLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function formatHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

function historySourceLabel(source: WallpaperHistoryItem["source"]) {
  if (source === "export") {
    return "Export";
  }

  if (source === "manual") {
    return "Manual";
  }

  return "Preview";
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportUrlsRef = useRef<string[]>([]);
  const lastHistoryCaptureRef = useRef({ capturedAt: 0, signature: "" });
  const [generators, setGenerators] = useState<GeneratorMetadata[]>([]);
  const [settings, setSettings] = useState<GeneratorSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<GeneratorSettings | null>(
    null,
  );
  const [historyItems, setHistoryItems] = useState<WallpaperHistoryItem[]>([]);
  const [projectReady, setProjectReady] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("loading");
  const [apiMessage, setApiMessage] = useState("Connecting");
  const [autoPreview, setAutoPreview] = useState(true);
  const [forceServerPreview, setForceServerPreview] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(true);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportMessage, setExportMessage] = useState("Ready to export PNG");
  const [batchSeeds, setBatchSeeds] = useState("");
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [presetQuery, setPresetQuery] = useState("");
  const [settingsJson, setSettingsJson] = useState("");
  const [workflowMessage, setWorkflowMessage] = useState("Settings ready");
  const [workflowTone, setWorkflowTone] = useState<WorkflowTone>("neutral");

  useEffect(
    () => () => {
      for (const url of exportUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      exportUrlsRef.current = [];
    },
    [],
  );

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

        const firstGenerator = nextGenerators[0];
        setGenerators(nextGenerators);
        const storedProject = localStorage.getItem(PROJECT_STORAGE_KEY);
        const restoredProject = storedProject
          ? parseProjectState(storedProject, nextGenerators)
          : { state: null, errors: [] };
        const restoredSettings = restoredProject.state?.settings;

        setSettings(
          restoredSettings ??
            (firstGenerator
              ? createDefaultGeneratorSettings(firstGenerator)
              : null),
        );
        setSavedSettings(restoredProject.state?.savedSettings ?? null);
        setHistoryItems(restoredProject.state?.history ?? []);
        setWorkflowTone(restoredProject.state ? "success" : "neutral");
        setWorkflowMessage(
          restoredProject.state
            ? "Last local session restored"
            : "Settings ready",
        );
        setApiStatus("ready");
        setApiMessage(`${nextGenerators.length} generators`);
        setProjectReady(true);
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setApiStatus("error");
        setApiMessage(
          error instanceof Error ? error.message : "API unavailable",
        );
        setProjectReady(true);
      }
    }

    loadGenerators();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!projectReady || generators.length === 0) {
      return;
    }

    localStorage.setItem(
      PROJECT_STORAGE_KEY,
      serializeProjectState({
        history: historyItems,
        savedSettings,
        settings,
      }),
    );
  }, [generators.length, historyItems, projectReady, savedSettings, settings]);

  const selectedGenerator = useMemo(() => {
    if (!settings) {
      return generators[0];
    }

    return (
      generators.find((generator) => generator.id === settings.generatorId) ??
      generators[0]
    );
  }, [generators, settings]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(generators.map((generator) => generator.category)),
      ).sort(),
    [generators],
  );

  const groupedParameters = useMemo(() => {
    const groups: Record<ParameterGroupName, GeneratorParameter[]> = {
      generator: [],
      style: [],
      seed: [],
      advanced: [],
    };

    for (const parameter of selectedGenerator?.parameters ?? []) {
      if (
        parameter.advanced ||
        parameter.group === "advanced" ||
        parameter.kind === "group"
      ) {
        groups.advanced.push(parameter);
        continue;
      }

      if (
        parameter.group === "generator" ||
        parameter.group === "style" ||
        parameter.group === "seed"
      ) {
        groups[parameter.group].push(parameter);
      }
    }

    return groups;
  }, [selectedGenerator]);

  const validationMessages = useMemo(() => {
    if (!settings || !selectedGenerator) {
      return [];
    }

    return validateGeneratorSettings(settings, selectedGenerator);
  }, [selectedGenerator, settings]);

  const filteredPresets = useMemo(() => {
    const query = presetQuery.trim().toLowerCase();

    if (!query) {
      return builtInPresets;
    }

    return builtInPresets.filter((preset) => {
      const searchText = [
        preset.name,
        preset.generatorId,
        preset.palette,
        ...preset.tags,
      ]
        .join(" ")
        .toLowerCase();
      return searchText.includes(query);
    });
  }, [presetQuery]);

  const previewRequest = useMemo<GenerationRequest | null>(() => {
    if (!settings || !selectedGenerator || validationMessages.length > 0) {
      return null;
    }

    return createGenerationRequest(settings, selectedGenerator, {
      previewSize: { width: 960, height: 540 },
      seedFallback: `preview-${selectedGenerator.id}`,
    });
  }, [selectedGenerator, settings, validationMessages.length]);

  const exportRequest = useMemo(() => {
    if (!settings || !selectedGenerator || validationMessages.length > 0) {
      return null;
    }

    return createExportRequest(settings, selectedGenerator, {
      format: "png",
    });
  }, [selectedGenerator, settings, validationMessages.length]);

  const filenamePreview = useMemo(
    () => previewExportFilename(selectedGenerator, settings),
    [selectedGenerator, settings],
  );

  const {
    activeMode,
    capabilities,
    imageUrl: serverPreviewUrl,
    message: previewMessage,
    metrics: previewMetrics,
    pendingManualRender,
    refreshPreview,
    status: previewStatus,
  } = useWallpaperPreview({
    autoPreview,
    canvasRef,
    forceServer: forceServerPreview,
    generator: selectedGenerator,
    request: previewRequest,
  });

  useEffect(() => {
    if (
      !projectReady ||
      !settings ||
      !selectedGenerator ||
      (previewStatus !== "ready" && previewStatus !== "fallback")
    ) {
      return;
    }

    const resolvedSeed =
      previewMetrics.seed || previewRequest?.seed || settings.seed;
    if (!resolvedSeed) {
      return;
    }

    const item = createHistoryItem({
      generatorId: selectedGenerator.id,
      paletteColors: getPreviewPalette(settings.palette),
      rendererMode: activeMode,
      resolvedSeed,
      settings,
      source: "preview",
    });
    const now = Date.now();
    const lastCapture = lastHistoryCaptureRef.current;

    if (
      item.signature === lastCapture.signature ||
      now - lastCapture.capturedAt < HISTORY_CAPTURE_COOLDOWN_MS
    ) {
      return;
    }

    lastHistoryCaptureRef.current = {
      capturedAt: now,
      signature: item.signature,
    };
    setHistoryItems((currentHistory) => upsertHistoryItem(currentHistory, item));
  }, [
    activeMode,
    previewMetrics.seed,
    previewRequest,
    previewStatus,
    projectReady,
    selectedGenerator,
    settings,
  ]);

  function mutateSettings(
    updater: (
      currentSettings: GeneratorSettings,
      currentGenerator: GeneratorMetadata,
    ) => GeneratorSettings,
  ) {
    setSettings((currentSettings) => {
      if (!currentSettings) {
        return currentSettings;
      }

      const currentGenerator = generators.find(
        (generator) => generator.id === currentSettings.generatorId,
      );

      return currentGenerator
        ? updater(currentSettings, currentGenerator)
        : currentSettings;
    });
  }

  function handleGeneratorChange(generatorId: string) {
    const nextGenerator = generators.find(
      (generator) => generator.id === generatorId,
    );

    if (!nextGenerator) {
      return;
    }

    setAdvancedOpen(false);
    setSettings((currentSettings) =>
      currentSettings
        ? switchGeneratorSettings(currentSettings, nextGenerator)
        : createDefaultGeneratorSettings(nextGenerator),
    );
  }

  function handlePresetChange(value: string) {
    const preset = resolutionPresets.find((entry) => entry.value === value);

    if (!preset) {
      return;
    }

    mutateSettings((currentSettings, currentGenerator) =>
      updateGeneratorSize(currentSettings, currentGenerator, {
        width: preset.width,
        height: preset.height,
      }),
    );
  }

  function handleApplyWallpaperPreset(preset: WallpaperPreset) {
    const result = applyWallpaperPreset(preset, generators);

    if (!result.settings) {
      setWorkflowTone("danger");
      setWorkflowMessage(result.errors[0] ?? "Preset could not be applied.");
      return;
    }

    setSettings(result.settings);
    setAdvancedOpen(false);
    setWorkflowTone("success");
    setWorkflowMessage(`Applied ${preset.name}`);
  }

  function handleSizeChange(dimension: "width" | "height", value: string) {
    mutateSettings((currentSettings, currentGenerator) =>
      updateGeneratorSize(currentSettings, currentGenerator, {
        width: dimension === "width" ? value : currentSettings.width,
        height: dimension === "height" ? value : currentSettings.height,
      }),
    );
  }

  function handleParameterChange(parameterId: string, value: unknown) {
    mutateSettings((currentSettings, currentGenerator) =>
      updateGeneratorParameter(
        currentSettings,
        currentGenerator,
        parameterId,
        value,
      ),
    );
  }

  function handleRandomPalette() {
    handleParameterChange("colorPalette", randomPaletteId());
  }

  function handleShuffleSeed() {
    if (!settings?.seedLocked) {
      handleParameterChange("seed", createSeed());
    }
  }

  async function handleCopySeed() {
    const seedValue = settings?.seed || previewRequest?.seed || "";

    if (!seedValue || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(seedValue);
    setCopiedSeed(true);
    window.setTimeout(() => setCopiedSeed(false), 1200);
  }

  async function handleCopySettings() {
    if (!settings) {
      return;
    }

    const nextJson = serializeGeneratorSettings(settings);
    setSettingsJson(nextJson);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(nextJson);
    }

    setWorkflowTone("success");
    setWorkflowMessage("Settings JSON copied");
  }

  function handleApplySettingsJson() {
    const result = parseGeneratorSettingsJson(settingsJson, generators);

    if (!result.settings) {
      setWorkflowTone("danger");
      setWorkflowMessage(result.errors[0] ?? "Settings JSON is invalid.");
      return;
    }

    setSettings(result.settings);
    setWorkflowTone("success");
    setWorkflowMessage("Settings JSON applied");
  }

  function captureHistoryItem(
    source: WallpaperHistoryItem["source"],
    resolvedSeed: string,
    rendererMode = activeMode,
    snapshot = settings,
  ) {
    if (!snapshot || !selectedGenerator) {
      return null;
    }

    const item = createHistoryItem({
      generatorId: selectedGenerator.id,
      paletteColors: getPreviewPalette(snapshot.palette),
      rendererMode,
      resolvedSeed: resolvedSeed || snapshot.seed || "auto",
      settings: snapshot,
      source,
    });

    setHistoryItems((currentHistory) => upsertHistoryItem(currentHistory, item));
    return item;
  }

  function handleSaveSession() {
    if (!settings) {
      return;
    }

    setSavedSettings(settings);
    localStorage.setItem(
      PROJECT_STORAGE_KEY,
      serializeProjectState({
        history: historyItems,
        savedSettings: settings,
        settings,
      }),
    );
    setWorkflowTone("success");
    setWorkflowMessage("Current settings saved locally");
  }

  function handleRestoreSession() {
    const storedProject = localStorage.getItem(PROJECT_STORAGE_KEY);

    if (!storedProject) {
      setWorkflowTone("warning");
      setWorkflowMessage("No local session found");
      return;
    }

    const result = parseProjectState(storedProject, generators);

    if (!result.state) {
      setWorkflowTone("danger");
      setWorkflowMessage(result.errors[0] ?? "Local session is invalid");
      return;
    }

    setSettings(result.state.savedSettings ?? result.state.settings);
    setSavedSettings(result.state.savedSettings);
    setHistoryItems(result.state.history);
    setWorkflowTone(result.errors.length > 0 ? "warning" : "success");
    setWorkflowMessage(
      result.errors[0] ?? "Local session restored",
    );
  }

  function handleNewSession() {
    if (!window.confirm("Start a new local session and clear history?")) {
      return;
    }

    localStorage.removeItem(PROJECT_STORAGE_KEY);
    setHistoryItems([]);
    setSavedSettings(null);
    setSettings(
      generators[0] ? createDefaultGeneratorSettings(generators[0]) : null,
    );
    setWorkflowTone("success");
    setWorkflowMessage("New local session started");
  }

  function handleRestoreHistory(item: WallpaperHistoryItem) {
    const result = restoreHistorySettings(item, generators);

    if (!result.settings) {
      setWorkflowTone("danger");
      setWorkflowMessage(result.errors[0] ?? "History item could not restore");
      return;
    }

    setSettings(result.settings);
    setWorkflowTone("success");
    setWorkflowMessage(`Restored ${item.generatorId} / ${item.resolvedSeed}`);
  }

  function handleClearHistory() {
    if (!window.confirm("Clear local generation history?")) {
      return;
    }

    setHistoryItems([]);
    setWorkflowTone("success");
    setWorkflowMessage("History cleared");
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    exportUrlsRef.current.push(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      exportUrlsRef.current = exportUrlsRef.current.filter(
        (currentUrl) => currentUrl !== url,
      );
    }, 30_000);
  }

  async function handleExport() {
    if (!exportRequest || !selectedGenerator || !settings) {
      setExportStatus("error");
      setExportMessage("Export settings are invalid.");
      return;
    }

    const seeds = seedLines(batchSeeds);
    const exportSeeds = seeds.length > 0 ? seeds : [settings.seed || ""];

    setExportStatus("exporting");
    setExportMessage(
      exportSeeds.length === 1
        ? "Exporting PNG"
        : `Exporting ${exportSeeds.length} PNG files`,
    );

    try {
      for (let index = 0; index < exportSeeds.length; index += 1) {
        const seed = exportSeeds[index] || settings.seed;
        const request = {
          ...exportRequest,
          seed,
        };
        const result = await exportWallpaper(request);
        downloadBlob(
          result.blob,
          result.metadata.filename || previewExportFilename(selectedGenerator, {
            ...settings,
            seed: result.metadata.seed,
          }),
        );
        captureHistoryItem(
          "export",
          result.metadata.seed,
          result.metadata.renderer,
          {
            ...settings,
            seed: result.metadata.seed,
          },
        );
        setExportMessage(
          exportSeeds.length === 1
            ? `Downloaded ${result.metadata.filename || "wallpaper.png"}`
            : `Downloaded ${index + 1} of ${exportSeeds.length}`,
        );
      }

      setExportStatus("ready");
    } catch (error) {
      setExportStatus("error");
      setExportMessage(error instanceof Error ? error.message : "Export failed");
    }
  }

  function renderBackgroundControl(parameter: GeneratorParameter) {
    if (!settings || parameter.kind !== "background") {
      return null;
    }

    const background = normalizeBackground(getParameterValue(settings, parameter));
    const colorCount = background.type === "solid" ? 1 : 2;

    function updateBackground(nextBackground: Partial<BackgroundSpec>) {
      handleParameterChange(
        parameter.id,
        normalizeBackground({
          ...background,
          ...nextBackground,
        }),
      );
    }

    return (
      <div className="parameter-control" key={parameter.id}>
        <SelectField
          label={parameter.label}
          onChange={(value) =>
            updateBackground({
              type: value as BackgroundSpec["type"],
            })
          }
          options={BACKGROUND_TYPES.map((type) => ({
            label: formatCategory(type),
            value: type,
          }))}
          value={background.type}
        />
        {background.type !== "solid" ? (
          <SelectField
            label="Direction"
            onChange={(value) =>
              updateBackground({
                direction: value as BackgroundSpec["direction"],
              })
            }
            options={BACKGROUND_DIRECTIONS.map((direction) => ({
              label: formatCategory(direction),
              value: direction,
            }))}
            value={background.direction}
          />
        ) : null}
        <div className="background-color-row">
          {Array.from({ length: colorCount }, (_, index) => (
            <InputField
              className="control--color"
              key={`${parameter.id}-${index}`}
              label={colorCount === 1 ? "Color" : `Color ${index + 1}`}
              onChange={(value) => {
                const colors = [...background.colors];
                colors[index] = value;
                updateBackground({ colors });
              }}
              type="color"
              value={getColorAt(background, index)}
            />
          ))}
        </div>
      </div>
    );
  }

  function renderParameterControl(parameter: GeneratorParameter) {
    if (!settings) {
      return null;
    }

    if (parameter.kind === "group") {
      return (
        <div className="parameter-control" key={parameter.id}>
          <h3 className="section-caption">{parameter.label}</h3>
          {parameter.children.map(renderParameterControl)}
        </div>
      );
    }

    const value = getParameterValue(settings, parameter);

    if (parameter.kind === "number") {
      const nextValue = numericValue(value, parameter.defaultValue);

      return (
        <div className="parameter-control" key={parameter.id}>
          <SliderField
            label={parameter.label}
            max={parameter.max}
            min={parameter.min}
            onChange={(nextValue) =>
              handleParameterChange(parameter.id, nextValue)
            }
            step={parameter.step}
            value={nextValue}
          />
          <InputField
            hint={`${parameter.min}-${parameter.max}`}
            label={`${parameter.label} value`}
            max={parameter.max}
            min={parameter.min}
            onChange={(nextInput) =>
              handleParameterChange(parameter.id, nextInput)
            }
            step={parameter.step}
            type="number"
            value={nextValue}
          />
        </div>
      );
    }

    if (parameter.kind === "boolean") {
      return (
        <Toggle
          checked={Boolean(value)}
          key={parameter.id}
          label={parameter.label}
          onChange={(checked) => handleParameterChange(parameter.id, checked)}
        />
      );
    }

    if (parameter.kind === "select") {
      if (parameter.multiple) {
        const selectedValues = new Set(
          Array.isArray(value) ? value.map(String) : [],
        );

        return (
          <fieldset className="multi-option" key={parameter.id}>
            <legend>{parameter.label}</legend>
            <div className="multi-option__grid">
              {parameter.options.map((option) => {
                const selected = selectedValues.has(option.value);
                return (
                  <button
                    aria-pressed={selected}
                    className="chip-button"
                    key={option.value}
                    onClick={() => {
                      const nextValues = selected
                        ? Array.from(selectedValues).filter(
                            (entry) => entry !== option.value,
                          )
                        : [...Array.from(selectedValues), option.value];
                      handleParameterChange(parameter.id, nextValues);
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      }

      if (parameter.options.length <= 4) {
        return (
          <SegmentedControl
            key={parameter.id}
            label={parameter.label}
            onChange={(nextValue) =>
              handleParameterChange(parameter.id, nextValue)
            }
            options={parameter.options}
            value={String(value)}
          />
        );
      }

      return (
        <SelectField
          key={parameter.id}
          label={parameter.label}
          onChange={(nextValue) =>
            handleParameterChange(parameter.id, nextValue)
          }
          options={parameter.options}
          value={String(value)}
        />
      );
    }

    if (parameter.kind === "palette") {
      const paletteName = String(value);
      const previewPalette = getPreviewPalette(paletteName);

      return (
        <div className="parameter-control" key={parameter.id}>
          <div className="field-with-action">
            <SelectField
              label={parameter.label}
              onChange={(nextValue) =>
                handleParameterChange(parameter.id, nextValue)
              }
              options={parameter.options}
              value={paletteName}
            />
            <IconButton
              icon={Wand2}
              label="Random palette"
              onClick={handleRandomPalette}
              variant="secondary"
            />
          </div>
          <div className="swatch-row" aria-label="Selected palette swatches">
            {previewPalette.map((color) => (
              <ColorSwatch color={color} key={color} label={color} />
            ))}
          </div>
          <div className="palette-grid" aria-label="Palette choices">
            {listPaletteEntries().map((palette) => (
              <button
                aria-pressed={palette.id === paletteName}
                className="palette-choice"
                key={palette.id}
                onClick={() => handleParameterChange(parameter.id, palette.id)}
                type="button"
              >
                <span className="palette-choice__label">
                  <Palette aria-hidden="true" size={14} />
                  <span>{palette.name}</span>
                  <small>{palette.category}</small>
                </span>
                <span className="palette-choice__swatches" aria-hidden="true">
                  {palette.colors.map((color) => (
                    <span
                      key={`${palette.id}-${color}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (parameter.kind === "background") {
      return renderBackgroundControl(parameter);
    }

    if (parameter.kind === "color") {
      return (
        <InputField
          className="control--color"
          key={parameter.id}
          label={parameter.label}
          onChange={(nextValue) =>
            handleParameterChange(parameter.id, nextValue)
          }
          type="color"
          value={String(value)}
        />
      );
    }

    if (parameter.kind === "color-array") {
      const colors = Array.isArray(value) ? value.map(String) : [];

      return (
        <div className="parameter-control" key={parameter.id}>
          <h3 className="section-caption">{parameter.label}</h3>
          <div className="background-color-row">
            {colors.map((color, index) => (
              <InputField
                className="control--color"
                key={`${parameter.id}-${index}`}
                label={`Color ${index + 1}`}
                onChange={(nextValue) => {
                  const nextColors = [...colors];
                  nextColors[index] = nextValue;
                  handleParameterChange(parameter.id, nextColors);
                }}
                type="color"
                value={color}
              />
            ))}
          </div>
        </div>
      );
    }

    if (parameter.id === "seed") {
      return (
        <div className="parameter-control" key={parameter.id}>
          <div className="seed-control-row">
            <InputField
              hint="Max 128 characters"
              label={parameter.label}
              onChange={(nextValue) =>
                handleParameterChange(parameter.id, nextValue)
              }
              placeholder="Auto"
              value={settings.seed}
            />
            <IconButton
              disabled={settings.seedLocked}
              icon={Shuffle}
              label="Randomize seed"
              onClick={handleShuffleSeed}
              variant="secondary"
            />
            <IconButton
              disabled={!settings.seed && !previewRequest?.seed}
              icon={Copy}
              label={copiedSeed ? "Seed copied" : "Copy seed"}
              onClick={() => void handleCopySeed()}
              variant="secondary"
            />
          </div>
          <Toggle
            checked={settings.seedLocked}
            label="Lock seed"
            onChange={(checked) =>
              setSettings((currentSettings) =>
                currentSettings
                  ? { ...currentSettings, seedLocked: checked }
                  : currentSettings,
              )
            }
          />
        </div>
      );
    }

    return (
      <InputField
        key={parameter.id}
        label={parameter.label}
        maxLength={parameter.maxLength}
        onChange={(nextValue) => handleParameterChange(parameter.id, nextValue)}
        value={String(value)}
      />
    );
  }

  const rendererTone =
    previewStatus === "fallback"
      ? "warning"
      : activeMode === "webgl2"
        ? "success"
        : "warning";
  const selectedGeneratorId = settings?.generatorId ?? "";
  const selectedCategory = selectedGenerator
    ? formatCategory(selectedGenerator.category)
    : "None";
  const selectedParameterCount = selectedGenerator?.parameters.length ?? 0;
  const presetValue = settings
    ? presetValueForSize(settings.width, settings.height)
    : "custom";

  return (
    <main className="app-frame" aria-labelledby="app-title">
      <header className="top-toolbar">
        <div className="project-heading">
          <ImageIcon aria-hidden="true" size={20} strokeWidth={2.2} />
          <div>
            <p className="eyebrow">Wallpaper Studio</p>
            <h1 id="app-title">Abstract Generator</h1>
          </div>
        </div>
        <div className="toolbar-cluster" aria-label="Project actions">
          <StatusBadge tone={statusTone(apiStatus)}>{apiMessage}</StatusBadge>
          <IconButton
            icon={Save}
            label="Copy settings JSON"
            onClick={() => void handleCopySettings()}
          />
          <Button
            disabled={!exportRequest || exportStatus === "exporting"}
            icon={Download}
            onClick={() => setExportOpen((open) => !open)}
            variant="primary"
          >
            Export
          </Button>
        </div>
      </header>

      <section
        className="studio-layout"
        aria-label="Wallpaper creator workspace"
      >
        <aside
          className="studio-panel studio-panel--settings"
          aria-label="Generator settings"
        >
          <PanelHeader eyebrow="Setup" title="Generator" />
          <div className="panel-section">
            <SelectField
              disabled={generators.length === 0}
              label="Algorithm"
              onChange={handleGeneratorChange}
              options={
                generators.length
                  ? generators.map((generator) => ({
                      label: `${generator.name} (${formatCategory(
                        generator.category,
                      )})`,
                      value: generator.id,
                    }))
                  : [{ label: "Loading", value: "" }]
              }
              value={selectedGeneratorId}
            />
            <p className="field-note">
              {selectedGenerator?.description ?? "Loading metadata"}
            </p>
            <div className="generator-tags">
              <StatusBadge>{selectedCategory}</StatusBadge>
              <StatusBadge>{selectedParameterCount} controls</StatusBadge>
              <StatusBadge>{categories.length} categories</StatusBadge>
            </div>
          </div>

          <div className="panel-section">
            <PanelHeader eyebrow="Presets" title="Starting Points" />
            <InputField
              label="Search presets"
              onChange={setPresetQuery}
              placeholder="Generator, palette, tag"
              value={presetQuery}
            />
            <div className="preset-list">
              {filteredPresets.map((preset) => (
                <button
                  className="preset-card"
                  key={preset.id}
                  onClick={() => handleApplyWallpaperPreset(preset)}
                  type="button"
                >
                  <span className="preset-card__header">
                    <strong>{preset.name}</strong>
                    <span>
                      {preset.size.width} x {preset.size.height}
                    </span>
                  </span>
                  <span className="preset-card__meta">
                    {formatCategory(preset.generatorId)} / {preset.palette}
                  </span>
                  <span className="preset-card__swatches" aria-hidden="true">
                    {getPreviewPalette(preset.palette).map((color) => (
                      <span
                        key={`${preset.id}-${color}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <PanelHeader eyebrow="Canvas" title="Output" />
            <SegmentedControl
              label="Preset"
              onChange={handlePresetChange}
              options={resolutionPresets.map((preset) => ({
                label: preset.label,
                value: preset.value,
              }))}
              value={presetValue}
            />
            <div className="field-grid field-grid--two">
              <InputField
                hint="128-7680"
                label="Width"
                max={7680}
                min={128}
                onChange={(value) => handleSizeChange("width", value)}
                type="number"
                value={settings?.width ?? 1920}
              />
              <InputField
                hint="128-4320"
                label="Height"
                max={4320}
                min={128}
                onChange={(value) => handleSizeChange("height", value)}
                type="number"
                value={settings?.height ?? 1080}
              />
            </div>
            {validationMessages.length > 0 ? (
              <ul className="validation-list" aria-label="Validation messages">
                {validationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : (
              <StatusBadge tone="success">Request ready</StatusBadge>
            )}
          </div>

          {(["generator", "style"] as const).map((groupName) =>
            groupedParameters[groupName].length > 0 ? (
              <div className="panel-section" key={groupName}>
                <PanelHeader
                  eyebrow={groupLabels[groupName].eyebrow}
                  title={groupLabels[groupName].title}
                />
                {groupedParameters[groupName].map(renderParameterControl)}
              </div>
            ) : null,
          )}

          {groupedParameters.advanced.length > 0 ? (
            <div className="panel-section">
              <Button
                className="advanced-toggle"
                icon={advancedOpen ? ChevronUp : ChevronDown}
                onClick={() => setAdvancedOpen((open) => !open)}
                variant="ghost"
              >
                {advancedOpen ? "Hide advanced" : "Show advanced"}
              </Button>
              {advancedOpen ? (
                <div className="advanced-controls">
                  {groupedParameters.advanced.map(renderParameterControl)}
                </div>
              ) : null}
            </div>
          ) : null}

          {groupedParameters.seed.length > 0 ? (
            <div className="panel-section">
              <PanelHeader
                eyebrow={groupLabels.seed.eyebrow}
                title={groupLabels.seed.title}
              />
              {groupedParameters.seed.map(renderParameterControl)}
            </div>
          ) : null}
        </aside>

        <section className="preview-region" aria-label="Wallpaper preview">
          <div className="preview-header-bar">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>{selectedGenerator?.name ?? "No generator"}</h2>
            </div>
            <div className="preview-actions">
              <Toggle
                checked={autoPreview}
                label="Auto"
                onChange={setAutoPreview}
              />
              <Toggle
                checked={forceServerPreview}
                label="Server"
                onChange={setForceServerPreview}
              />
              <StatusBadge tone={rendererTone}>
                {rendererModeLabel(activeMode)}
              </StatusBadge>
              <Button
                icon={RefreshCcw}
                onClick={refreshPreview}
                variant={pendingManualRender ? "primary" : "secondary"}
              >
                {autoPreview ? "Refresh" : "Render preview"}
              </Button>
              <IconButton
                icon={Shuffle}
                label="Randomize seed"
                onClick={handleShuffleSeed}
              />
            </div>
          </div>

          <div className="preview-stage">
            <canvas
              ref={canvasRef}
              className="preview-render-canvas"
              aria-label="Wallpaper preview canvas"
            />
            {serverPreviewUrl ? (
              <img
                className="preview-render-image"
                src={serverPreviewUrl}
                alt="Server-rendered abstract wallpaper preview"
              />
            ) : null}
            <div className="preview-overlay">
              <StatusBadge tone={statusTone(previewStatus)}>
                {previewMessage}
              </StatusBadge>
            </div>
          </div>

          <footer className="status-bar">
            <span>{previewMetrics.resolution || "960 x 540"}</span>
            <span>{activeMode === "webgl2" ? "GPU" : "server"}</span>
            <span>
              {previewMetrics.elapsedMs === null
                ? "pending"
                : `${previewMetrics.elapsedMs}ms`}
            </span>
            <span>{previewMetrics.seed || settings?.seed || "auto seed"}</span>
          </footer>

          <section className="history-panel" aria-label="Generation history">
            <div className="history-panel__header">
              <div>
                <p className="eyebrow">History</p>
                <h2>Recent Looks</h2>
              </div>
              <div className="history-panel__actions">
                <StatusBadge>{historyItems.length} saved</StatusBadge>
                <IconButton
                  disabled={historyItems.length === 0}
                  icon={Trash2}
                  label="Clear history"
                  onClick={handleClearHistory}
                  variant="secondary"
                />
              </div>
            </div>
            {historyItems.length > 0 ? (
              <div className="history-strip">
                {historyItems.map((item) => (
                  <article className="history-item" key={item.id}>
                    <button
                      className="history-thumbnail"
                      onClick={() => handleRestoreHistory(item)}
                      style={{
                        background: `linear-gradient(135deg, ${item.thumbnail.colors.join(", ")})`,
                      }}
                      type="button"
                    >
                      <span>Restore</span>
                    </button>
                    <div className="history-item__body">
                      <div className="history-item__title">
                        <strong>{formatCategory(item.generatorId)}</strong>
                        <span>{historySourceLabel(item.source)}</span>
                      </div>
                      <div className="history-item__meta">
                        <span>{item.resolvedSeed || "auto seed"}</span>
                        <span>{formatHistoryTime(item.timestamp)}</span>
                      </div>
                      <div className="history-item__actions">
                        <Button
                          onClick={() => handleRestoreHistory(item)}
                          variant="secondary"
                        >
                          Restore
                        </Button>
                        <IconButton
                          aria-pressed={item.favorite}
                          className={item.favorite ? "is-active" : ""}
                          icon={Star}
                          label={
                            item.favorite
                              ? "Remove favorite"
                              : "Mark favorite"
                          }
                          onClick={() =>
                            setHistoryItems((currentHistory) =>
                              toggleHistoryFavorite(currentHistory, item.id),
                            )
                          }
                          variant="secondary"
                        />
                        <IconButton
                          icon={Trash2}
                          label="Remove history item"
                          onClick={() =>
                            setHistoryItems((currentHistory) =>
                              removeHistoryItem(currentHistory, item.id),
                            )
                          }
                          variant="secondary"
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="history-empty">
                <History aria-hidden="true" size={18} />
                <span>Rendered previews and exports appear here.</span>
              </div>
            )}
          </section>
        </section>

        <aside
          className="studio-panel studio-panel--inspector"
          aria-label="Inspector"
        >
          <PanelHeader
            actions={<IconButton icon={PanelRight} label="Inspector" />}
            eyebrow="Inspector"
            title="Details"
          />

          <div className="panel-section">
            <h3 className="section-caption">Renderer</h3>
            <div className="metric-list">
              <div>
                <span>Mode</span>
                <strong>
                  {activeMode === "webgl2" ? "WebGL2" : "Server CPU"}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{previewStatus}</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>
                  {previewMetrics.elapsedMs === null
                    ? "Pending"
                    : `${previewMetrics.elapsedMs}ms`}
                </strong>
              </div>
              <div>
                <span>Resolution</span>
                <strong>{previewMetrics.resolution || "960 x 540"}</strong>
              </div>
              <div>
                <span>Seed</span>
                <strong>{previewMetrics.seed || "Auto"}</strong>
              </div>
              <div>
                <span>Auto</span>
                <strong>{autoPreview ? "On" : "Off"}</strong>
              </div>
            </div>
            <dl className="diagnostics-list" aria-label="Renderer diagnostics">
              {(capabilities?.diagnostics ?? ["Detecting renderer"]).map(
                (detail) => (
                  <div key={detail}>
                    <dt>{detail}</dt>
                  </div>
                ),
              )}
            </dl>
          </div>

          <div className="panel-section">
            <h3 className="section-caption">Parameters</h3>
            <div className="parameter-list">
              {(selectedGenerator?.parameters ?? []).map((parameter) => (
                <div className="parameter-row" key={parameter.id}>
                  <span>{parameter.label}</span>
                  <strong>
                    {settings
                      ? describeValue(
                          parameter,
                          getParameterValue(settings, parameter),
                        )
                      : parameter.kind}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <PanelHeader
              actions={
                <IconButton
                  icon={exportOpen ? ChevronUp : ChevronDown}
                  label={exportOpen ? "Hide export settings" : "Show export settings"}
                  onClick={() => setExportOpen((open) => !open)}
                />
              }
              eyebrow="Export"
              title="Final Output"
            />
            {exportOpen ? (
              <div className="export-panel">
                <div className="metric-list">
                  <div>
                    <span>Format</span>
                    <strong>PNG</strong>
                  </div>
                  <div>
                    <span>Renderer</span>
                    <strong>Server CPU</strong>
                  </div>
                  <div>
                    <span>Resolution</span>
                    <strong>
                      {settings?.width ?? 1920} x {settings?.height ?? 1080}
                    </strong>
                  </div>
                  <div>
                    <span>Filename</span>
                    <strong>{filenamePreview}</strong>
                  </div>
                </div>
                <label className="field">
                  <span className="field__label">Batch seeds</span>
                  <textarea
                    aria-label="Batch export seeds"
                    className="control settings-json"
                    onChange={(event) => setBatchSeeds(event.target.value)}
                    placeholder="Optional: one seed per line"
                    value={batchSeeds}
                  />
                  <span className="field__hint">
                    Blank exports the current seed. Up to 12 seeds run one at a time.
                  </span>
                </label>
                <Button
                  disabled={!exportRequest || exportStatus === "exporting"}
                  icon={Download}
                  onClick={() => void handleExport()}
                  variant="primary"
                >
                  {seedLines(batchSeeds).length > 0
                    ? `Export ${seedLines(batchSeeds).length} PNGs`
                    : "Export PNG"}
                </Button>
                <StatusBadge tone={statusTone(exportStatus)}>
                  {exportMessage}
                </StatusBadge>
              </div>
            ) : null}
          </div>

          <div className="panel-section">
            <PanelHeader eyebrow="Workflow" title="Share" />
            <div className="workflow-actions workflow-actions--project">
              <Button icon={Plus} onClick={handleNewSession} variant="secondary">
                New
              </Button>
              <Button icon={Save} onClick={handleSaveSession} variant="secondary">
                Save
              </Button>
              <Button
                icon={RefreshCcw}
                onClick={handleRestoreSession}
                variant="secondary"
              >
                Restore
              </Button>
            </div>
            <div className="workflow-actions">
              <Button
                icon={Copy}
                onClick={() => void handleCopySettings()}
                variant="secondary"
              >
                Copy JSON
              </Button>
              <Button
                icon={ClipboardPaste}
                onClick={handleApplySettingsJson}
                variant="secondary"
              >
                Apply JSON
              </Button>
            </div>
            <textarea
              aria-label="Settings JSON"
              className="control settings-json"
              onChange={(event) => setSettingsJson(event.target.value)}
              placeholder="Paste settings JSON"
              value={settingsJson}
            />
            <StatusBadge tone={workflowTone}>{workflowMessage}</StatusBadge>
          </div>

          <div className="panel-section">
            <h3 className="section-caption">Render Path</h3>
            <div className="render-path">
              <div>
                <Zap aria-hidden="true" size={16} />
                <span>
                  {activeMode === "webgl2" ? "GPU preview" : "GPU bypassed"}
                </span>
              </div>
              <div>
                <Cpu aria-hidden="true" size={16} />
                <span>Server export</span>
              </div>
              <div>
                <Sparkles aria-hidden="true" size={16} />
                <span>{selectedGenerator?.category ?? "generator"}</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
