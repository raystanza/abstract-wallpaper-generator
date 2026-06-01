import type {
  ApiErrorBody,
  ExportRequest,
  ExportResultMetadata,
  GenerationRequest,
  GenerationResultMetadata,
  GenerateWallpaperResponse,
  GeneratorResponse,
  HealthResponse,
} from "../../shared/contracts";

export class ApiClientError extends Error {
  code: string;
  details?: string[];
  status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error);
    this.name = "ApiClientError";
    this.code = body.code;
    this.details = body.details;
    this.status = status;
  }
}

async function parseApiError(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    let body: ApiErrorBody;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = {
        error: `Request failed with status ${response.status}.`,
        code: "INVALID_ERROR_RESPONSE",
      };
    }
    if (!body || typeof body.error !== "string" || typeof body.code !== "string") {
      body = {
        error: `Request failed with status ${response.status}.`,
        code: "INVALID_ERROR_RESPONSE",
      };
    }
    throw new ApiClientError(response.status, body);
  }

  const text = await response.text();
  throw new Error(text || `Request failed with status ${response.status}.`);
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    await parseApiError(response);
  }

  return (await response.json()) as T;
}

function metadataFromHeaders(response: Response): GenerationResultMetadata {
  const metadataHeader = response.headers.get("x-wallpaper-metadata");

  if (metadataHeader) {
    try {
      return JSON.parse(metadataHeader) as GenerationResultMetadata;
    } catch {
      // Fall through to individual headers when a proxy or extension corrupts
      // the compact metadata header.
    }
  }

  const [width = "0", height = "0"] = (
    response.headers.get("x-wallpaper-resolution") || "0x0"
  ).split("x");

  return {
    generationType: response.headers.get("x-wallpaper-generator") || "",
    width: Number(width),
    height: Number(height),
    colorPalette: response.headers.get("x-wallpaper-palette") || "",
    background: parseBackgroundHeader(response),
    seed: response.headers.get("x-wallpaper-seed") || "",
    filename: response.headers.get("x-wallpaper-filename") || undefined,
    elapsedMs: Number(response.headers.get("x-generation-time-ms") || 0),
  };
}

function parseBackgroundHeader(response: Response): GenerationResultMetadata["background"] {
  try {
    return JSON.parse(
      response.headers.get("x-wallpaper-background") ||
        '{"type":"solid","colors":["#101820"],"direction":"diagonal"}',
    ) as GenerationResultMetadata["background"];
  } catch {
    return {
      type: "solid",
      colors: ["#101820"],
      direction: "diagonal",
    };
  }
}

function exportMetadataFromHeaders(response: Response): ExportResultMetadata {
  return {
    ...metadataFromHeaders(response),
    format:
      (response.headers.get("x-wallpaper-export-format") as ExportResultMetadata["format"]) ||
      "png",
    renderer:
      (response.headers.get("x-wallpaper-renderer") as ExportResultMetadata["renderer"]) ||
      "server-cpu",
  };
}

export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/api/health");
}

export async function getGenerators(): Promise<GeneratorResponse> {
  return getJson<GeneratorResponse>("/api/generators");
}

export async function generateWallpaper(
  request: GenerationRequest,
  options: { signal?: AbortSignal } = {},
): Promise<GenerateWallpaperResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal: options.signal,
  });

  if (!response.ok) {
    await parseApiError(response);
  }

  return {
    blob: await response.blob(),
    metadata: metadataFromHeaders(response),
  };
}

export async function exportWallpaper(
  request: ExportRequest,
): Promise<{ blob: Blob; metadata: ExportResultMetadata }> {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await parseApiError(response);
  }

  return {
    blob: await response.blob(),
    metadata: exportMetadataFromHeaders(response),
  };
}
