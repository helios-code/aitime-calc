import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("GET /api/health", () => {
  it("reports ok + version", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.version).toBe("string");
  });
});

describe("GET /api/tools", () => {
  it("returns the curated dataset", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/tools" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.tools)).toBe(true);
    expect(body.tools.length).toBeGreaterThan(0);
  });
});

describe("GET /api/calc", () => {
  it("computes via tool_id", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/calc?tool_id=cursor-yolo-mode&as_of=2026-07-30",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.human_equiv_years).toBeGreaterThan(0);
    expect(body.model).toBe("base");
    expect(body.params.multiplier).toBeCloseTo(16, 3);
  });

  it("computes via explicit release date", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/calc?release=2023-03-14&as_of=2026-07-30",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.input.release_date).toBe("2023-03-14");
  });

  it("400s on missing release/tool_id", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/calc" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBeTruthy();
  });

  it("400s on invalid date", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/calc?release=not-a-date" });
    expect(res.statusCode).toBe(400);
  });

  it("400s on unknown tool_id", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/calc?tool_id=nope" });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/calc", () => {
  it("accepts a JSON body", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/calc",
      payload: { release_date: "2024-06-20", as_of: "2026-07-30", model: "accelerating" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.model).toBe("accelerating");
  });
});

describe("CORS", () => {
  const ORIGINAL_WEB_ORIGIN = process.env.WEB_ORIGIN;

  afterEach(() => {
    if (ORIGINAL_WEB_ORIGIN === undefined) delete process.env.WEB_ORIGIN;
    else process.env.WEB_ORIGIN = ORIGINAL_WEB_ORIGIN;
  });

  it("without WEB_ORIGIN set, allows localhost but not an arbitrary origin", async () => {
    delete process.env.WEB_ORIGIN;
    const app = buildServer();

    const local = await app.inject({
      method: "GET",
      url: "/api/tools",
      headers: { origin: "http://localhost:5173" },
    });
    expect(local.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const stranger = await app.inject({
      method: "GET",
      url: "/api/tools",
      headers: { origin: "https://evil.example.com" },
    });
    expect(stranger.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("with WEB_ORIGIN set, allows it plus localhost, not other origins", async () => {
    process.env.WEB_ORIGIN = "https://aitime-calc.example.com";
    const app = buildServer();

    const prod = await app.inject({
      method: "GET",
      url: "/api/tools",
      headers: { origin: "https://aitime-calc.example.com" },
    });
    expect(prod.headers["access-control-allow-origin"]).toBe("https://aitime-calc.example.com");

    const local = await app.inject({
      method: "GET",
      url: "/api/tools",
      headers: { origin: "http://localhost:5173" },
    });
    expect(local.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const stranger = await app.inject({
      method: "GET",
      url: "/api/tools",
      headers: { origin: "https://evil.example.com" },
    });
    expect(stranger.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
