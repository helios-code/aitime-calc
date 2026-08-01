import { describe, expect, it } from "vitest";
import { buildServer, buildOgSvg, fitFontSize } from "../src/server.js";
import { TOOLS } from "../src/dataset.js";

const OG_CONTENT_MAX_WIDTH = 1080; // OG_CARD_WIDTH(1200) - 2*OG_CONTENT_X(60)
const AVG_CHAR_WIDTH_RATIO = 0.6; // must match server.ts OG_AVG_CHAR_WIDTH_RATIO
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("buildOgSvg (SVG string, pre-rasterization)", () => {
  it("escapes special XML chars in tool text (real dataset entry with '&')", () => {
    const svg = buildOgSvg({ tool: "llama-4", date: "2026-07-30" });
    expect(svg).toContain("Scout &amp; Maverick");
    expect(svg).not.toContain("Scout & Maverick");
  });

  it("400s (throws) on a date before the tool's release date", () => {
    expect(() => buildOgSvg({ tool: "cursor-yolo-mode", date: "1999-01-01" })).toThrow();
  });

  it("shrinks font-size so even the longest dataset tool name fits the card width", () => {
    const longest = TOOLS.reduce((a, b) => (b.name.length > a.name.length ? b : a));
    const fitted = fitFontSize(longest.name, 48);
    expect(fitted * longest.name.length * AVG_CHAR_WIDTH_RATIO).toBeLessThanOrEqual(
      OG_CONTENT_MAX_WIDTH + 0.01,
    );
  });

  it("renders a fitted (non-clipped) name for the longest dataset tool", () => {
    const longest = TOOLS.reduce((a, b) => (b.name.length > a.name.length ? b : a));
    const svg = buildOgSvg({ tool: longest.id, date: "2026-07-30" });
    expect(svg).toContain(longest.name);
  });
});

describe("GET /api/og", () => {
  it("returns a PNG card for a known tool", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/og?tool=cursor-yolo-mode&date=2026-07-30",
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
    expect(res.rawPayload.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
    expect(res.rawPayload.length).toBeGreaterThan(500);
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

  it("400s on a date before the tool's release date", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/og?tool=cursor-yolo-mode&date=1999-01-01",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBeTruthy();
  });
});
