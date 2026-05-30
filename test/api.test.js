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
      assert.equal(Array.isArray(generator.parameters), true);
      assert.equal(
        Object.prototype.hasOwnProperty.call(generator, "render"),
        false,
      );
    }
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
    assert.equal(response.headers.get("x-wallpaper-resolution"), "180x128");
    assert.equal(response.headers.get("x-wallpaper-seed"), "api-test");
    assert.match(
      response.headers.get("x-wallpaper-filename"),
      /^shapes_180x128_api-test_.*\.png$/,
    );
    assert.ok(
      Number.parseFloat(response.headers.get("x-generation-time-ms")) >= 0,
    );
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
    assert.equal(Array.isArray(body.details), true);
    assert.ok(body.details.some((detail) => detail.includes("width must be")));
    assert.ok(
      body.details.some((detail) => detail.includes("generationType must be")),
    );
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
  } finally {
    await server.close();
  }
});
