import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { TOOLS } from "./dataset.js";
import {
  computeAtem,
  DEFAULT_PARAMS,
  monthsToHuman,
  yearsToHuman,
  type CalcModel,
} from "./atem.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_VERSION: string = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
).version;

const ATEM_SOURCES = [
  "METR — Measuring AI Ability to Complete Long Tasks (2025-03)",
  "AI Model Law — capability doubling ~3mo",
  "Moore's-law-style classic tech-generation cadence",
];

interface CalcQuery {
  release?: string;
  release_date?: string;
  as_of?: string;
  tool_id?: string;
  model?: string;
  d_classic_months?: string | number;
  d_ai_months?: string | number;
}

interface OgQuery {
  tool?: string;
  model?: string;
  date?: string;
}

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Embedded font, subset to Basic Latin + common punctuation (~45KB/42KB). The share-card
// endpoint must render identically wherever it deploys — ambient system fonts aren't
// guaranteed there, so resvg must not depend on them. Loaded as buffers (not fontFiles
// paths) since the wasm build has no reliable filesystem access of its own.
const OG_FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../assets/fonts");
const OG_FONT_FAMILY = "DejaVu Sans";
const OG_FONT_BUFFERS = [
  readFileSync(join(OG_FONT_DIR, "DejaVuSans-subset.ttf")),
  readFileSync(join(OG_FONT_DIR, "DejaVuSans-Bold-subset.ttf")),
];

// resvg-wasm requires the wasm module to be initialized once before any Resvg call.
// Read from disk (not fetched) so it works identically in Node without a bundler.
const require = createRequire(import.meta.url);
await initWasm(readFileSync(require.resolve("@resvg/resvg-wasm/index_bg.wasm")));

const OG_CARD_WIDTH = 1200;
const OG_CONTENT_X = 60;
const OG_CONTENT_MAX_WIDTH = OG_CARD_WIDTH - OG_CONTENT_X * 2;
// Conservative average glyph-width/font-size ratio for a bold sans-serif — used to
// pre-shrink text server-side since SVG has no server-side text-measurement API.
const OG_AVG_CHAR_WIDTH_RATIO = 0.6;
const OG_MIN_FONT_SIZE = 22;

// Shrinks fontSize so `text` fits within maxWidthPx, never below minFontSize.
export function fitFontSize(
  text: string,
  baseFontSize: number,
  maxWidthPx: number = OG_CONTENT_MAX_WIDTH,
  minFontSize: number = OG_MIN_FONT_SIZE,
): number {
  const estWidthAtBase = text.length * baseFontSize * OG_AVG_CHAR_WIDTH_RATIO;
  if (estWidthAtBase <= maxWidthPx) return baseFontSize;
  const fitted = maxWidthPx / (text.length * OG_AVG_CHAR_WIDTH_RATIO);
  return Math.max(minFontSize, fitted);
}

export function buildOgSvg(q: OgQuery): string {
  const toolId = q.tool;
  if (!toolId) {
    throw { status: 400, error: "tool is required" };
  }
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    throw { status: 400, error: `unknown tool: ${toolId}` };
  }

  if (q.model !== undefined && q.model !== "base" && q.model !== "accelerating") {
    throw { status: 400, error: `unknown model: ${q.model}` };
  }
  const model: CalcModel = q.model === "accelerating" ? "accelerating" : "base";

  const release = new Date(`${tool.release_date}T00:00:00Z`);
  const asOfStr = q.date ?? new Date().toISOString().slice(0, 10);
  const asOf = new Date(`${asOfStr}T00:00:00Z`);
  if (!isValidDate(asOf)) {
    throw { status: 400, error: `invalid date: ${asOfStr}` };
  }
  if (asOf.getTime() < release.getTime()) {
    throw { status: 400, error: `date ${asOfStr} is before ${tool.name}'s release date` };
  }

  const result = computeAtem(release, asOf, model, DEFAULT_PARAMS);
  const heroLine = `${tool.name} = ~${yearsToHuman(result.humanEquivYears)}`;

  const name = escapeXml(tool.name);
  const vendor = escapeXml(tool.vendor);
  const hero = escapeXml(heroLine);
  const modelLabel = escapeXml(`${model} model`);

  const nameFontSize = fitFontSize(tool.name, 48);
  const heroFontSize = fitFontSize(heroLine, 56);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD_WIDTH}" height="630" viewBox="0 0 ${OG_CARD_WIDTH} 630">
  <rect width="${OG_CARD_WIDTH}" height="630" fill="#0b0f19"/>
  <text x="${OG_CONTENT_X}" y="120" font-family="${OG_FONT_FAMILY}" font-size="32" fill="#8b93a7">${vendor}</text>
  <text x="${OG_CONTENT_X}" y="180" font-family="${OG_FONT_FAMILY}" font-size="${nameFontSize}" font-weight="bold" fill="#ffffff">${name}</text>
  <text x="${OG_CONTENT_X}" y="320" font-family="${OG_FONT_FAMILY}" font-size="${heroFontSize}" font-weight="bold" fill="#7cf5c4">${hero}</text>
  <text x="${OG_CONTENT_X}" y="380" font-family="${OG_FONT_FAMILY}" font-size="28" fill="#8b93a7">${modelLabel}</text>
  <text x="${OG_CONTENT_X}" y="580" font-family="${OG_FONT_FAMILY}" font-size="24" fill="#5b6377">aitime-calc</text>
</svg>`;
}

// Renders the RGBA pixel buffer (not just the PNG bytes) so tests can assert glyphs
// actually painted, since a missing/broken embedded font still produces a valid,
// blank PNG.
export function renderOgPixels(q: OgQuery) {
  const svg = buildOgSvg(q);
  return new Resvg(svg, {
    font: {
      fontBuffers: OG_FONT_BUFFERS,
      defaultFontFamily: OG_FONT_FAMILY,
    },
  }).render();
}

function buildCalcResponse(q: CalcQuery) {
  const toolId = q.tool_id;
  let releaseStr = q.release ?? q.release_date;

  if (toolId) {
    const tool = TOOLS.find((t) => t.id === toolId);
    if (!tool) {
      throw { status: 400, error: `unknown tool_id: ${toolId}` };
    }
    releaseStr = tool.release_date;
  }

  if (!releaseStr) {
    throw { status: 400, error: "release (or tool_id) is required" };
  }

  const release = new Date(`${releaseStr}T00:00:00Z`);
  if (!isValidDate(release)) {
    throw { status: 400, error: `invalid release date: ${releaseStr}` };
  }

  const asOfStr = q.as_of ?? new Date().toISOString().slice(0, 10);
  const asOf = new Date(`${asOfStr}T00:00:00Z`);
  if (!isValidDate(asOf)) {
    throw { status: 400, error: `invalid as_of date: ${asOfStr}` };
  }

  const model: CalcModel = q.model === "accelerating" ? "accelerating" : "base";

  const dClassicMonths = q.d_classic_months !== undefined ? Number(q.d_classic_months) : DEFAULT_PARAMS.dClassicMonths;
  const dAiMonths = q.d_ai_months !== undefined ? Number(q.d_ai_months) : DEFAULT_PARAMS.dAiMonths;
  if (!Number.isFinite(dClassicMonths) || dClassicMonths <= 0) {
    throw { status: 400, error: "d_classic_months must be a positive number" };
  }
  if (!Number.isFinite(dAiMonths) || dAiMonths <= 0) {
    throw { status: 400, error: "d_ai_months must be a positive number" };
  }

  const result = computeAtem(release, asOf, model, { dClassicMonths, dAiMonths });

  return {
    input: { release_date: releaseStr, as_of: asOfStr, ...(toolId ? { tool_id: toolId } : {}) },
    elapsed: {
      days: Math.round(result.elapsedDays),
      months: Number(result.elapsedMonths.toFixed(2)),
      human: monthsToHuman(result.elapsedMonths),
    },
    model: result.model,
    params: {
      d_classic_months: result.params.dClassicMonths,
      d_ai_months: result.params.dAiMonths,
      multiplier: Number(result.params.multiplier.toFixed(3)),
    },
    ai_doublings: Number(result.aiDoublings.toFixed(3)),
    human_equiv_years: Number(result.humanEquivYears.toFixed(2)),
    human_equiv_human: yearsToHuman(result.humanEquivYears),
    comparison_line: `≈ ${result.aiDoublings.toFixed(1)} classic software generations`,
    methodology_note: `ATEM ${result.model} model: ${result.elapsedMonths.toFixed(1)} elapsed AI-months / D_ai=${result.params.dAiMonths}mo, scaled by D_classic=${result.params.dClassicMonths}mo (${result.params.multiplier.toFixed(1)}x multiplier).`,
    sources: ATEM_SOURCES,
  };
}

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function buildServer() {
  const app = Fastify({ logger: false });

  const webOrigin = process.env.WEB_ORIGIN;
  app.register(cors, {
    origin: webOrigin
      ? [webOrigin, LOCALHOST_ORIGIN_RE]
      : LOCALHOST_ORIGIN_RE,
  });

  app.get("/api/health", async () => ({ ok: true, version: PKG_VERSION }));

  app.get("/api/tools", async () => ({ tools: TOOLS }));

  app.get<{ Querystring: OgQuery }>("/api/og", async (req, reply) => {
    try {
      const png = renderOgPixels(req.query).asPng();
      reply.header("Content-Type", "image/png");
      return png;
    } catch (err: any) {
      if (err?.status && err?.error) {
        reply.code(err.status);
        return { error: err.error };
      }
      throw err;
    }
  });

  app.get<{ Querystring: CalcQuery }>("/api/calc", async (req, reply) => {
    try {
      return buildCalcResponse(req.query);
    } catch (err: any) {
      if (err?.status && err?.error) {
        reply.code(err.status);
        return { error: err.error };
      }
      throw err;
    }
  });

  app.post<{ Body: CalcQuery }>("/api/calc", async (req, reply) => {
    try {
      return buildCalcResponse(req.body ?? {});
    } catch (err: any) {
      if (err?.status && err?.error) {
        reply.code(err.status);
        return { error: err.error };
      }
      throw err;
    }
  });

  return app;
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3001);
  app.listen({ port, host: "0.0.0.0" }).then(() => {
    console.log(`aitime-calc api listening on :${port}`);
  });
}
