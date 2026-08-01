import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("GET /api/og", () => {
  it("returns an SVG card for a known tool", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/og?tool=cursor-yolo-mode&as_of=2026-07-30&date=2026-07-30",
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("image/svg+xml");
    expect(res.body).toContain("<svg");
    expect(res.body).toMatch(/~\d/);
  });

  it("400s on unknown tool", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/og?tool=nope" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBeTruthy();
  });

  it("400s on missing tool", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/og" });
    expect(res.statusCode).toBe(400);
  });

  it("400s on unknown model", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/og?tool=cursor-yolo-mode&model=nope",
    });
    expect(res.statusCode).toBe(400);
  });

  it("escapes tool text to avoid raw SVG/XSS injection", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/og?tool=cursor-yolo-mode" });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain("<script");
  });
});
