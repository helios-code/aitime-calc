import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

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
