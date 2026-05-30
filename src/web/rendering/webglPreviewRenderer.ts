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

void main() {
  vec2 uv = v_uv;
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float detail = mix(1.5, 8.0, clamp(u_detail, 0.0, 1.0));
  float waveA = sin((p.x * detail + u_seed * 0.017) * 6.28318);
  float waveB = cos((p.y * (detail * 0.72) - u_seed * 0.011) * 6.28318);
  float field = fbm(p * detail + vec2(u_seed * 0.013, -u_seed * 0.009));
  float t = clamp(0.5 + 0.22 * waveA + 0.18 * waveB + 0.45 * field, 0.0, 1.0);

  vec3 c0 = mix(u_palette[0], u_palette[1], smoothstep(0.0, 0.28, t));
  vec3 c1 = mix(u_palette[2], u_palette[3], smoothstep(0.28, 0.72, t));
  vec3 c2 = mix(c0, c1, smoothstep(0.18, 0.82, t));
  vec3 color = mix(c2, u_palette[4], smoothstep(0.76, 1.0, t));
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
    const paletteLocation = gl.getUniformLocation(this.program, "u_palette");
    const backgroundLocation = gl.getUniformLocation(
      this.program,
      "u_background",
    );

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
