const assert = require("node:assert/strict");
const test = require("node:test");

const { createApp } = require("../index");

async function startTestServer() {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function assertPngBuffer(buffer) {
  assert.ok(buffer.length > 100);
  assert.deepEqual(
    Array.from(buffer.subarray(0, 8)),
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
}

test("GET /api/health returns server health metadata", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      status: "ok",
      contractVersion: 1,
      renderer: "server-cpu",
    });
  } finally {
    await server.close();
  }
});

test("GET /api/generators returns public generator metadata", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/generators`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("content-type").includes("application/json"),
      true,
    );
    assert.ok(Array.isArray(body.generators));
    assert.ok(body.generators.length >= 19);
    assert.ok(
      body.generators.some((generator) => generator.id === "flow-field"),
    );

    for (const generator of body.generators) {
      assert.equal(typeof generator.id, "string");
      assert.equal(typeof generator.name, "string");
      assert.equal(typeof generator.description, "string");
      assert.equal(typeof generator.category, "string");
      assert.equal(generator.version, 1);
      assert.equal(Array.isArray(generator.parameters), true);
      assert.equal(typeof generator.defaults, "object");
      assert.equal(generator.defaults.generationType, generator.id);
      assert.equal(generator.defaults.size.width, 1920);
      assert.equal(generator.defaults.size.height, 1080);
      assert.deepEqual(generator.rendering, {
        modes: ["server-cpu"],
        preferredPreviewMode: "server-cpu",
        exportMode: "server-cpu",
        gpuPreview: false,
      });
      assert.equal(
        Object.prototype.hasOwnProperty.call(generator, "render"),
        false,
      );
    }

    const shapes = body.generators.find(
      (generator) => generator.id === "shapes",
    );
    const density = shapes.parameters.find(
      (parameter) => parameter.id === "shapes",
    );
    const shapeTypes = shapes.parameters.find(
      (parameter) => parameter.id === "shapeTypes",
    );

    assert.equal(density.kind, "number");
    assert.equal(density.min, 1);
    assert.equal(density.max, 5000);
    assert.equal(density.defaultValue, 50);
    assert.equal(shapeTypes.kind, "select");
    assert.equal(shapeTypes.multiple, true);
    assert.ok(
      shapeTypes.options.some((option) => option.value === "rectangle"),
    );
  } finally {
    await server.close();
  }
});

test("POST /api/generate returns png bytes with response metadata", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        width: 180,
        height: 128,
        shapes: 8,
        colorPalette: "ocean",
        background: {
          type: "solid",
          colors: ["#101820"],
        },
        generationType: "shapes",
        seed: "api-test",
        shapeTypes: ["circle", "rectangle"],
      }),
    });
    const buffer = Buffer.from(await response.arrayBuffer());

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-wallpaper-generator"), "shapes");
    assert.equal(response.headers.get("x-wallpaper-palette"), "ocean");
    assert.equal(
      response.headers.get("x-wallpaper-background"),
      '{"type":"solid","colors":["#101820"],"direction":"diagonal"}',
    );
    assert.equal(response.headers.get("x-wallpaper-resolution"), "180x128");
    assert.equal(response.headers.get("x-wallpaper-seed"), "api-test");
    assert.match(
      response.headers.get("x-wallpaper-filename"),
      /^shapes_180x128_api-test_.*\.png$/,
    );
    assert.ok(
      Number.parseFloat(response.headers.get("x-generation-time-ms")) >= 0,
    );
    assert.deepEqual(JSON.parse(response.headers.get("x-wallpaper-metadata")), {
      generationType: "shapes",
      width: 180,
      height: 128,
      colorPalette: "ocean",
      background: {
        type: "solid",
        colors: ["#101820"],
        direction: "diagonal",
      },
      seed: "api-test",
      filename: response.headers.get("x-wallpaper-filename"),
      elapsedMs: Number(response.headers.get("x-generation-time-ms")),
    });
    assertPngBuffer(buffer);
  } finally {
    await server.close();
  }
});

test("POST /api/generate returns structured validation errors", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        width: 12,
        height: 128,
        generationType: "missing-generator",
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "Invalid wallpaper generation request.");
    assert.equal(body.code, "INVALID_GENERATION_REQUEST");
    assert.equal(Array.isArray(body.details), true);
    assert.ok(body.details.some((detail) => detail.includes("width must be")));
    assert.ok(
      body.details.some((detail) => detail.includes("generationType must be")),
    );
  } finally {
    await server.close();
  }
});

test("POST /api/export returns downloadable png bytes with export metadata", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        format: "png",
        size: {
          width: 180,
          height: 128,
        },
        shapes: 8,
        colorPalette: "ocean",
        background: {
          type: "solid",
          colors: ["#101820"],
        },
        generationType: "shapes",
        seed: "export-test",
        shapeTypes: ["circle", "rectangle"],
      }),
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const metadata = JSON.parse(response.headers.get("x-wallpaper-metadata"));

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.match(
      response.headers.get("content-disposition"),
      /^attachment; filename="shapes_180x128_export-test_.*\.png"$/,
    );
    assert.equal(response.headers.get("x-wallpaper-export-format"), "png");
    assert.equal(response.headers.get("x-wallpaper-renderer"), "server-cpu");
    assert.equal(metadata.format, "png");
    assert.equal(metadata.renderer, "server-cpu");
    assert.equal(metadata.width, 180);
    assert.equal(metadata.height, 128);
    assert.equal(metadata.seed, "export-test");
    assertPngBuffer(buffer);
  } finally {
    await server.close();
  }
});

test("POST /api/export returns structured export validation errors", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        format: "webp",
        size: {
          width: 180,
          height: 128,
        },
        generationType: "shapes",
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "Invalid wallpaper export request.");
    assert.equal(body.code, "INVALID_GENERATION_REQUEST");
    assert.ok(body.details.some((detail) => detail.includes("format")));
  } finally {
    await server.close();
  }
});

test("POST /api/generate returns structured JSON parse errors", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "Invalid JSON request body.");
    assert.equal(body.code, "INVALID_JSON");
  } finally {
    await server.close();
  }
});

test("unknown API routes return structured not found errors", async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/api/missing`, {
      method: "POST",
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.code, "NOT_FOUND");
    assert.match(body.error, /API route POST \/api\/missing was not found/);
  } finally {
    await server.close();
  }
});
