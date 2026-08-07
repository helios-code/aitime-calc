import { describe, expect, it } from "vitest";
import { buildServer, buildOgSvg, fitFontSize, renderOgPixels } from "../src/server.js";
import { TOOLS } from "../src/dataset.js";

const OG_CONTENT_MAX_WIDTH = 1080; // OG_CARD_WIDTH(1200) - 2*OG_CONTENT_X(60)
const AVG_CHAR_WIDTH_RATIO = 0.6; // must match server.ts OG_AVG_CHAR_WIDTH_RATIO
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("buildOgSvg", () => {
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

  it("honors d_ai_months/d_classic_months: the card changes when a doubling param does", () => {
    const base = buildOgSvg({ tool: "cursor-yolo-mode", date: "2026-07-30" });
    // A smaller AI-doubling period compounds faster, so the human-equivalent hero differs.
    const fasterAi = buildOgSvg({ tool: "cursor-yolo-mode", date: "2026-07-30", d_ai_months: 1 });
    expect(fasterAi).not.toBe(base);
    const widerClassic = buildOgSvg({ tool: "cursor-yolo-mode", date: "2026-07-30", d_classic_months: 144 });
    expect(widerClassic).not.toBe(base);
  });

  it("400s (throws) on d_ai_months=0", () => {
    expect(() => buildOgSvg({ tool: "cursor-yolo-mode", date: "2026-07-30", d_ai_months: 0 })).toThrow();
  });
});

describe("buildOgSvg date-mode (no tool)", () => {
  it("renders a card from a bare release date, no tool_id", () => {
    const svg = buildOgSvg({ date: "2022-11-30" });
    expect(svg).toContain("By Nov 2022");
    expect(svg).toContain("base model");
  });

  it("respects the model param in date-mode", () => {
    const svg = buildOgSvg({ date: "2022-11-30", model: "accelerating" });
    expect(svg).toContain("accelerating model");
  });

  it("400s on unknown model in date-mode", () => {
    expect(() => buildOgSvg({ date: "2022-11-30", model: "nope" })).toThrow();
  });

  it("400s on an invalid date in date-mode", () => {
    expect(() => buildOgSvg({ date: "not-a-date" })).toThrow();
  });

  it("400s on a future release date (asOf is always today)", () => {
    expect(() => buildOgSvg({ date: "2999-01-01" })).toThrow();
  });

  it("400s when neither tool nor date is given", () => {
    expect(() => buildOgSvg({})).toThrow();
  });
});

describe("buildOgSvg localization (lang param)", () => {
  it("renders French labels for the tool-mode card when lang=fr", () => {
    const fr = buildOgSvg({ tool: "cursor-yolo-mode", date: "2026-07-30", lang: "fr" });
    expect(fr).toContain("modèle base"); // model label, FR
    expect(fr).toContain(" ans"); // human-equiv hero unit, FR ("N ans …")
    expect(fr).not.toContain("model</text>"); // no English "… model" label
  });

  it("renders French labels + accented month for the date-mode card", () => {
    // August → "août" in fr-FR: exercises an accented glyph (û) end to end.
    const fr = buildOgSvg({ date: "2022-08-15", lang: "fr" });
    expect(fr).toContain("date de sortie"); // eyebrow, FR
    expect(fr).toContain("août"); // localized month with accent
    expect(fr).toContain("Le "); // hero prefix, FR
  });

  it("localizes the accelerating model label", () => {
    const fr = buildOgSvg({ date: "2022-11-30", model: "accelerating", lang: "fr" });
    expect(fr).toContain("modèle accéléré");
  });

  it("falls back to English for an invalid/unknown lang", () => {
    const bogus = buildOgSvg({ date: "2022-11-30", lang: "de" });
    const en = buildOgSvg({ date: "2022-11-30" });
    expect(bogus).toBe(en);
    expect(bogus).toContain("release date");
    expect(bogus).toContain("base model");
  });

  it("leaves the English card byte-for-byte unchanged when lang is absent (no regression)", () => {
    // Guards the EN default path: omitting lang must produce exactly the prior output.
    const svg = buildOgSvg({ tool: "cursor-yolo-mode", date: "2026-07-30" });
    expect(svg).toContain("base model");
    expect(svg).toContain("model</text>");
    expect(svg).not.toContain("modèle");
    expect(svg).toBe(buildOgSvg({ tool: "cursor-yolo-mode", date: "2026-07-30", lang: "en" }));
  });
});

describe("renderOgPixels", () => {
  it("paints non-background pixels using the embedded font (catches a blank-text regression)", () => {
    // A missing/broken embedded font still yields a valid, background-colored PNG —
    // asPng()'s magic bytes alone can't catch that, only the actual pixel content can.
    const img = renderOgPixels({ tool: "cursor-yolo-mode", date: "2026-07-30" });
    // `.pixels` is a wasm-bindgen getter that copies the whole RGBA buffer out of wasm
    // memory on every access — read it once, or a per-index loop turns into O(n) full
    // 3MB buffer copies (this cost 158s in CI before being cached here).
    const pixels = img.pixels;
    const bg = { r: 0x0b, g: 0x0f, b: 0x19 };
    let nonBackgroundPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (r !== bg.r || g !== bg.g || b !== bg.b) nonBackgroundPixels++;
    }
    expect(nonBackgroundPixels).toBeGreaterThan(500);
  });

  // The 2026 dataset entries introduced names with '&', '/' and parentheses; a glyph
  // outside the committed DejaVu subset renders blank on a perfectly valid PNG.
  it("paints glyphs for current-generation tool names (subset coverage)", () => {
    for (const id of ["gpt-5-6", "deepseek-v4", "claude-opus-5"]) {
      const img = renderOgPixels({ tool: id, date: "2026-08-01" });
      const pixels = img.pixels;
      const bg = { r: 0x0b, g: 0x0f, b: 0x19 };
      let nonBackgroundPixels = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
        if (r !== bg.r || g !== bg.g || b !== bg.b) nonBackgroundPixels++;
      }
      img.free();
      expect(nonBackgroundPixels, `${id} rendered blank`).toBeGreaterThan(500);
    }
  });

  // The committed subset was Basic-Latin only; a FR card ("date de sortie",
  // "modèle base", accented months like "août") would render blank glyphs if the
  // subset wasn't extended. Assert the FR card paints AND differs from its EN
  // twin — proving the accented/localized text actually reached the canvas.
  function countNonBg(img: { pixels: Uint8Array; free: () => void }): number {
    const pixels = img.pixels;
    const bg = { r: 0x0b, g: 0x0f, b: 0x19 };
    let n = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] !== bg.r || pixels[i + 1] !== bg.g || pixels[i + 2] !== bg.b) n++;
    }
    img.free();
    return n;
  }

  it("paints accented French glyphs from the extended subset (regression on FR OG cards)", () => {
    const frPixels = countNonBg(renderOgPixels({ date: "2022-08-15", lang: "fr" }));
    const enPixels = countNonBg(renderOgPixels({ date: "2022-08-15" }));
    expect(frPixels, "FR card rendered blank — subset missing accents?").toBeGreaterThan(500);
    // Different copy (and accented glyphs) → a materially different render, not a
    // silent fallback to the English card.
    expect(frPixels).not.toBe(enPixels);
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

  it("returns a PNG card for date-mode (no tool_id)", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/og?date=2022-11-30&model=base",
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
    expect(res.rawPayload.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
    expect(res.rawPayload.length).toBeGreaterThan(500);
  });
});
