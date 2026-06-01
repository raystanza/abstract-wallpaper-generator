import type { GenerationRequest } from "../../shared/contracts";
import { hexToUnitRgb, paletteUniform } from "./palettes";
import type {
  PreviewRenderResult,
  PreviewRenderer,
  PreviewRendererOptions,
} from "./types";

const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_seed;
uniform float u_detail;
uniform int u_effect;
uniform float u_optionA;
uniform float u_optionB;
uniform float u_optionC;
uniform vec3 u_palette[5];
uniform vec3 u_background;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32 + u_seed);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.52;
  }
  return value;
}

vec3 paletteRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = mix(u_palette[0], u_palette[1], smoothstep(0.0, 0.28, t));
  vec3 c1 = mix(u_palette[2], u_palette[3], smoothstep(0.28, 0.72, t));
  vec3 c2 = mix(c0, c1, smoothstep(0.18, 0.82, t));
  return mix(c2, u_palette[4], smoothstep(0.76, 1.0, t));
}

float domainWarpField(vec2 p) {
  float frequency = mix(0.5, 7.0, clamp(u_optionA, 0.0, 1.0));
  float warp = mix(0.0, 2.0, clamp(u_optionB, 0.0, 1.0));
  float contrast = mix(0.1, 1.0, clamp(u_optionC, 0.0, 1.0));
  vec2 q = p * frequency;
  vec2 w = vec2(
    fbm(q + vec2(7.3 + u_seed, -2.1)),
    fbm(q + vec2(-3.4, 5.8 + u_seed))
  );
  float ridged = abs(fbm(q + w * warp * 2.9));
  float band = sin((q.x + q.y * 0.66 + w.y * warp) * 6.28318);
  return clamp(0.5 + ridged * (0.72 + contrast) + band * (0.08 + contrast * 0.15) - 0.22, 0.0, 1.0);
}

float moireField(vec2 p) {
  float frequency = mix(8.0, 96.0, clamp(u_optionA, 0.0, 1.0));
  float interference = mix(0.1, 1.0, clamp(u_optionB, 0.0, 1.0));
  float centers = floor(mix(2.0, 5.0, clamp(u_optionC, 0.0, 1.0)) + 0.5);
  float sum = 0.0;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= centers) {
      break;
    }
    float fi = float(i);
    vec2 center = vec2(
      hash(vec2(fi + u_seed, 1.7)) - 0.5,
      hash(vec2(5.2, fi - u_seed)) - 0.5
    ) * 1.35;
    float d = length(p - center);
    sum += sin(d * frequency + u_seed * 4.0 + fi * 1.7);
  }
  sum /= max(1.0, centers);
  float cross = sin((p.x - p.y) * frequency * 0.42 + u_seed * 7.0);
  return clamp(0.5 + sum * 0.36 * interference + cross * 0.14 * interference, 0.0, 1.0);
}

float gradientField(vec2 p) {
  float nodes = floor(mix(3.0, 14.0, clamp(u_optionA, 0.0, 1.0)) + 0.5);
  float softness = mix(0.2, 1.0, clamp(u_optionB, 0.0, 1.0));
  float turbulence = clamp(u_optionC, 0.0, 1.0);
  float field = 0.0;
  float weight = 0.0;
  for (int i = 0; i < 14; i++) {
    if (float(i) >= nodes) {
      break;
    }
    float fi = float(i);
    vec2 center = vec2(
      hash(vec2(fi + 2.3, u_seed + 3.1)) - 0.5,
      hash(vec2(u_seed + 9.4, fi + 4.8)) - 0.5
    ) * 1.75;
    center += vec2(
      fbm(center + fi * 0.13),
      fbm(center.yx - fi * 0.17)
    ) * turbulence * 0.22;
    float d = length(p - center);
    float influence = smoothstep(softness * 0.76, 0.0, d);
    field += influence * (fi / max(1.0, nodes - 1.0));
    weight += influence;
  }
  float base = weight > 0.0 ? field / weight : 0.5;
  float contour = fbm(p * (2.0 + turbulence * 4.0) + u_seed);
  return clamp(base + contour * turbulence * 0.18, 0.0, 1.0);
}

void main() {
  vec2 uv = v_uv;
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float t;

  if (u_effect == 1) {
    t = domainWarpField(p);
  } else if (u_effect == 2) {
    t = moireField(p);
  } else if (u_effect == 3) {
    t = gradientField(p);
  } else {
    float detail = mix(1.5, 8.0, clamp(u_detail, 0.0, 1.0));
    float waveA = sin((p.x * detail + u_seed * 0.017) * 6.28318);
    float waveB = cos((p.y * (detail * 0.72) - u_seed * 0.011) * 6.28318);
    float field = fbm(p * detail + vec2(u_seed * 0.013, -u_seed * 0.009));
    t = clamp(0.5 + 0.22 * waveA + 0.18 * waveB + 0.45 * field, 0.0, 1.0);
  }

  vec3 color = paletteRamp(t);
  float vignette = smoothstep(0.95, 0.15, length(p));
  color = mix(u_background, color, 0.62 + 0.38 * vignette);

  outColor = vec4(color, 1.0);
}
`;

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 65535;
}

function generatorEffect(generationType: string): number {
  if (generationType === "domain-warp-noise") {
    return 1;
  }

  if (generationType === "moire-interference") {
    return 2;
  }

  if (generationType === "gradient-field") {
    return 3;
  }

  return 0;
}

function numericOption(
  options: Record<string, unknown> | undefined,
  key: string,
  fallback: number,
) {
  const value = Number(options?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function normalizeOption(value: number, min: number, max: number) {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Unable to create shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Shader linking failed.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export class WebGLPreviewRenderer implements PreviewRenderer {
  mode = "webgl2" as const;

  private buffer: WebGLBuffer | null = null;
  private disposed = false;
  private gl: WebGL2RenderingContext;
  private onContextLost: (event: Event) => void;
  private program: WebGLProgram;

  constructor(
    private canvas: HTMLCanvasElement,
    private options: PreviewRendererOptions,
  ) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
      stencil: false,
    });

    if (!gl) {
      throw new Error("WebGL2 context is unavailable.");
    }

    this.gl = gl;
    this.program = createProgram(gl);
    this.buffer = gl.createBuffer();

    if (!this.buffer) {
      throw new Error("Unable to create preview vertex buffer.");
    }

    this.onContextLost = (event) => {
      event.preventDefault();
      this.disposed = true;
    };
    this.canvas.addEventListener("webglcontextlost", this.onContextLost);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
  }

  async renderPreview(
    request: GenerationRequest,
  ): Promise<PreviewRenderResult> {
    if (this.disposed) {
      throw new Error("Preview renderer has been disposed.");
    }

    const gl = this.gl;
    const pixelRatio = this.options.capabilities.clampedDevicePixelRatio;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * pixelRatio));
    const height = Math.max(1, Math.floor(rect.height * pixelRatio));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const background = hexToUnitRgb(request.background?.colors[0] ?? "#101820");
    const positionLocation = gl.getAttribLocation(this.program, "a_position");
    const resolutionLocation = gl.getUniformLocation(
      this.program,
      "u_resolution",
    );
    const seedLocation = gl.getUniformLocation(this.program, "u_seed");
    const detailLocation = gl.getUniformLocation(this.program, "u_detail");
    const effectLocation = gl.getUniformLocation(this.program, "u_effect");
    const optionALocation = gl.getUniformLocation(this.program, "u_optionA");
    const optionBLocation = gl.getUniformLocation(this.program, "u_optionB");
    const optionCLocation = gl.getUniformLocation(this.program, "u_optionC");
    const paletteLocation = gl.getUniformLocation(this.program, "u_palette");
    const backgroundLocation = gl.getUniformLocation(
      this.program,
      "u_background",
    );
    const effect = generatorEffect(request.generationType);
    const optionA =
      effect === 1
        ? normalizeOption(numericOption(request.options, "frequency", 2.7), 0.5, 7)
        : effect === 2
          ? normalizeOption(
              numericOption(request.options, "ringFrequency", 34),
              8,
              96,
            )
          : effect === 3
            ? normalizeOption(numericOption(request.options, "nodes", 7), 3, 14)
            : 0;
    const optionB =
      effect === 1
        ? normalizeOption(
            numericOption(request.options, "warpStrength", 0.82),
            0,
            2,
          )
        : effect === 2
          ? normalizeOption(
              numericOption(request.options, "interference", 0.72),
              0.1,
              1,
            )
          : effect === 3
            ? normalizeOption(
                numericOption(request.options, "softness", 0.68),
                0.2,
                1,
              )
            : 0;
    const optionC =
      effect === 1
        ? normalizeOption(numericOption(request.options, "contrast", 0.62), 0.1, 1)
        : effect === 2
          ? normalizeOption(
              numericOption(request.options, "centerCount", 3),
              2,
              5,
            )
          : effect === 3
            ? normalizeOption(
                numericOption(request.options, "turbulence", 0.42),
                0,
                1,
              )
            : 0;

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolutionLocation, width, height);
    gl.uniform1f(seedLocation, hashSeed(request.seed || ""));
    gl.uniform1f(
      detailLocation,
      Math.min(1, Math.max(0, request.shapes / 500)),
    );
    gl.uniform1i(effectLocation, effect);
    gl.uniform1f(optionALocation, optionA);
    gl.uniform1f(optionBLocation, optionB);
    gl.uniform1f(optionCLocation, optionC);
    gl.uniform3fv(paletteLocation, paletteUniform(request.colorPalette));
    gl.uniform3f(
      backgroundLocation,
      background[0],
      background[1],
      background[2],
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    return {
      mode: this.mode,
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);

    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }

    this.gl.deleteProgram(this.program);
  }
}

export function createWebGLPreviewRenderer(
  canvas: HTMLCanvasElement,
  options: PreviewRendererOptions,
) {
  return new WebGLPreviewRenderer(canvas, options);
}
