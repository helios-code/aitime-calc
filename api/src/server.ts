import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { findTool, TOOLS, type AiTool } from "./dataset.js";
import {
  computeAtem,
  DEFAULT_PARAMS,
  monthsToHuman,
  yearsToHuman,
  type CalcModel,
  type AtemParams,
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
  d_classic_months?: string | number;
  d_ai_months?: string | number;
}

// Shared by /api/timeline and /api/compare: the /api/calc knobs that still make
// sense when the release date comes from the dataset rather than the query.
interface AtemQuery {
  as_of?: string;
  model?: string;
  d_classic_months?: string | number;
  d_ai_months?: string | number;
}

interface CompareQuery extends AtemQuery {
  tool?: string;
  vs?: string;
}

interface LeaderboardQuery {
  model?: string;
  as_of?: string;
}

interface LeaderboardEntry {
  rank: number;
  tool_id: string;
  name: string;
  human_equiv_years: number;
  release_date: string;
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

function formatDateLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

// Date-mode card: no tool_id, `date` is the release_date input (same semantics as
// /api/calc's date mode — release_date=date, as_of=today). Mirrors the tool-mode
// card layout but without a vendor/tool-name line, since there is no tool.
function buildDateModeOgSvg(dateStr: string, modelParam: string | undefined, atemParams: AtemParams): string {
  if (modelParam !== undefined && modelParam !== "base" && modelParam !== "accelerating") {
    throw { status: 400, error: `unknown model: ${modelParam}` };
  }
  const model: CalcModel = modelParam === "accelerating" ? "accelerating" : "base";

  const release = new Date(`${dateStr}T00:00:00Z`);
  if (!isValidDate(release)) {
    throw { status: 400, error: `invalid date: ${dateStr}` };
  }

  const asOfStr = new Date().toISOString().slice(0, 10);
  const asOf = new Date(`${asOfStr}T00:00:00Z`);
  if (asOf.getTime() < release.getTime()) {
    throw { status: 400, error: `date ${dateStr} is in the future` };
  }

  const result = computeAtem(release, asOf, model, atemParams);
  const heroLine = `By ${formatDateLabel(release)} = ~${yearsToHuman(result.humanEquivYears)}`;

  const eyebrow = escapeXml("release date");
  const hero = escapeXml(heroLine);
  const modelLabel = escapeXml(`${model} model`);
  const heroFontSize = fitFontSize(heroLine, 56);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD_WIDTH}" height="630" viewBox="0 0 ${OG_CARD_WIDTH} 630">
  <rect width="${OG_CARD_WIDTH}" height="630" fill="#0b0f19"/>
  <text x="${OG_CONTENT_X}" y="120" font-family="${OG_FONT_FAMILY}" font-size="32" fill="#8b93a7">${eyebrow}</text>
  <text x="${OG_CONTENT_X}" y="320" font-family="${OG_FONT_FAMILY}" font-size="${heroFontSize}" font-weight="bold" fill="#7cf5c4">${hero}</text>
  <text x="${OG_CONTENT_X}" y="380" font-family="${OG_FONT_FAMILY}" font-size="28" fill="#8b93a7">${modelLabel}</text>
  <text x="${OG_CONTENT_X}" y="580" font-family="${OG_FONT_FAMILY}" font-size="24" fill="#5b6377">aitime-calc</text>
</svg>`;
}

export function buildOgSvg(q: OgQuery): string {
  const atemParams = resolveDoublingParams(q);
  const toolId = q.tool;
  if (!toolId) {
    if (!q.date) {
      throw { status: 400, error: "tool or date is required" };
    }
    return buildDateModeOgSvg(q.date, q.model, atemParams);
  }
  const tool = findTool(toolId);
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

  const result = computeAtem(release, asOf, model, atemParams);
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
  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: OG_FONT_BUFFERS,
      defaultFontFamily: OG_FONT_FAMILY,
    },
  });
  try {
    return resvg.render();
  } finally {
    // The Resvg tree is no longer needed once rendered; the returned RenderedImage
    // owns its own wasm memory and is freed by the caller after reading it.
    resvg.free();
  }
}

function resolveAsOf(raw: string | undefined): { asOfStr: string; asOf: Date } {
  const asOfStr = raw ?? new Date().toISOString().slice(0, 10);
  const asOf = new Date(`${asOfStr}T00:00:00Z`);
  if (!isValidDate(asOf)) {
    throw { status: 400, error: `invalid as_of date: ${asOfStr}` };
  }
  return { asOfStr, asOf };
}

function resolveDoublingParams(q: AtemQuery | CalcQuery | OgQuery) {
  const dClassicMonths = q.d_classic_months !== undefined ? Number(q.d_classic_months) : DEFAULT_PARAMS.dClassicMonths;
  const dAiMonths = q.d_ai_months !== undefined ? Number(q.d_ai_months) : DEFAULT_PARAMS.dAiMonths;
  if (!Number.isFinite(dClassicMonths) || dClassicMonths <= 0) {
    throw { status: 400, error: "d_classic_months must be a positive number" };
  }
  if (!Number.isFinite(dAiMonths) || dAiMonths <= 0) {
    throw { status: 400, error: "d_ai_months must be a positive number" };
  }
  return { dClassicMonths, dAiMonths };
}

// Rejects an unrecognized model instead of silently defaulting to "base" the
// way /api/calc does: these endpoints echo `model` back in the payload, so a
// typo'd value would otherwise be reported as a deliberate base-model answer.
function resolveModel(raw: string | undefined): CalcModel {
  if (raw !== undefined && raw !== "base" && raw !== "accelerating") {
    throw { status: 400, error: `unknown model: ${raw}` };
  }
  return raw === "accelerating" ? "accelerating" : "base";
}

function isUnreleasedAt(tool: AiTool, asOf: Date): boolean {
  return new Date(`${tool.release_date}T00:00:00Z`).getTime() > asOf.getTime();
}

/** One dataset tool scored against as_of — the row shape /api/timeline and /api/compare share. */
function buildToolEntry(
  tool: AiTool,
  asOf: Date,
  model: CalcModel,
  params: { dClassicMonths: number; dAiMonths: number },
) {
  const release = new Date(`${tool.release_date}T00:00:00Z`);
  const result = computeAtem(release, asOf, model, params);
  return {
    tool_id: tool.id,
    name: tool.name,
    vendor: tool.vendor,
    category: tool.category,
    release_date: tool.release_date,
    elapsed: {
      days: Math.round(result.elapsedDays),
      months: Number(result.elapsedMonths.toFixed(2)),
      human: monthsToHuman(result.elapsedMonths),
    },
    ai_doublings: Number(result.aiDoublings.toFixed(3)),
    human_equiv_years: Number(result.humanEquivYears.toFixed(2)),
    human_equiv_human: yearsToHuman(result.humanEquivYears),
  };
}

function buildTimelineResponse(q: AtemQuery) {
  const { asOfStr, asOf } = resolveAsOf(q.as_of);
  const model = resolveModel(q.model);
  const params = resolveDoublingParams(q);

  // computeAtem doesn't clamp elapsed time, so a tool that ships after as_of
  // would score negative human-equivalent years. Drop those instead, matching
  // /api/leaderboard.
  const tools = TOOLS.filter((tool) => !isUnreleasedAt(tool, asOf))
    .map((tool) => buildToolEntry(tool, asOf, model, params))
    .sort((a, b) => (a.release_date < b.release_date ? -1 : a.release_date > b.release_date ? 1 : 0));

  return {
    as_of: asOfStr,
    model,
    params: {
      d_classic_months: params.dClassicMonths,
      d_ai_months: params.dAiMonths,
      multiplier: Number((params.dClassicMonths / params.dAiMonths).toFixed(3)),
    },
    count: tools.length,
    tools,
    sources: ATEM_SOURCES,
  };
}

function buildCompareResponse(q: CompareQuery) {
  if (!q.tool || !q.vs) {
    throw { status: 400, error: "tool and vs are both required" };
  }
  // findTool routes through resolveToolId, so legacy ids in shared links keep working.
  const toolA = findTool(q.tool);
  if (!toolA) {
    throw { status: 400, error: `unknown tool: ${q.tool}` };
  }
  const toolB = findTool(q.vs);
  if (!toolB) {
    throw { status: 400, error: `unknown tool: ${q.vs}` };
  }

  const { asOfStr, asOf } = resolveAsOf(q.as_of);
  const model = resolveModel(q.model);
  const params = resolveDoublingParams(q);

  // Same reason /api/timeline filters these out — a not-yet-released tool would
  // come back with negative human-equivalent years.
  for (const tool of [toolA, toolB]) {
    if (isUnreleasedAt(tool, asOf)) {
      throw { status: 400, error: `${tool.id} was released after as_of ${asOfStr}` };
    }
  }

  const a = buildToolEntry(toolA, asOf, model, params);
  const b = buildToolEntry(toolB, asOf, model, params);
  const deltaYears = Number((a.human_equiv_years - b.human_equiv_years).toFixed(2));

  return {
    as_of: asOfStr,
    model,
    params: {
      d_classic_months: params.dClassicMonths,
      d_ai_months: params.dAiMonths,
      multiplier: Number((params.dClassicMonths / params.dAiMonths).toFixed(3)),
    },
    a,
    b,
    delta: {
      // Positive means the older release (a) has compressed more human-equivalent time.
      human_equiv_years: deltaYears,
      human_equiv_human: yearsToHuman(Math.abs(deltaYears)),
      ahead: deltaYears === 0 ? null : deltaYears > 0 ? a.tool_id : b.tool_id,
    },
    sources: ATEM_SOURCES,
  };
}

function buildCalcResponse(q: CalcQuery) {
  const toolId = q.tool_id;
  let releaseStr = q.release ?? q.release_date;

  if (toolId) {
    const tool = findTool(toolId);
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

  const { asOfStr, asOf } = resolveAsOf(q.as_of);
  // computeAtem doesn't clamp elapsed time, so an as_of before the release date
  // would score negative human-equivalent years. Reject it — same guard the
  // sibling endpoints (og/timeline/compare/leaderboard) already apply to
  // not-yet-released tools, so /api/calc stops being the one endpoint that
  // returns a nonsensical negative 200.
  if (asOf.getTime() < release.getTime()) {
    throw { status: 400, error: `as_of ${asOfStr} is before release date ${releaseStr}` };
  }
  // Unchanged from before these helpers existed: /api/calc silently treats an
  // unrecognized model as "base" (resolveModel, used by the newer endpoints,
  // 400s instead) — a documented, already-shipped contract.
  const model: CalcModel = q.model === "accelerating" ? "accelerating" : "base";
  const { dClassicMonths, dAiMonths } = resolveDoublingParams(q);

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

export function buildLeaderboardResponse(q: LeaderboardQuery) {
  const model = resolveModel(q.model);
  const { asOfStr, asOf } = resolveAsOf(q.as_of);

  // Same unreleased-at-as_of filter as /api/timeline and /api/compare: computeAtem
  // doesn't clamp, so a not-yet-released tool would score negative years.
  const leaderboard: LeaderboardEntry[] = TOOLS.filter((tool) => !isUnreleasedAt(tool, asOf))
    .map((tool) => {
      const release = new Date(`${tool.release_date}T00:00:00Z`);
      const result = computeAtem(release, asOf, model, DEFAULT_PARAMS);
      return {
        tool_id: tool.id,
        name: tool.name,
        human_equiv_years: Number(result.humanEquivYears.toFixed(2)),
        release_date: tool.release_date,
      };
    })
    .sort((a, b) => b.human_equiv_years - a.human_equiv_years)
    .map((entry, i) => ({ rank: i + 1, ...entry }));

  return { as_of: asOfStr, model, leaderboard };
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

  app.get("/api/health", async () => ({
    status: "ok",
    version: PKG_VERSION,
    uptime_s: Math.floor(process.uptime()),
  }));

  app.get("/api/tools", async () => ({ tools: TOOLS }));

  app.get<{ Querystring: OgQuery }>("/api/og", async (req, reply) => {
    try {
      const img = renderOgPixels(req.query);
      let png: Uint8Array;
      try {
        png = img.asPng();
      } finally {
        img.free();
      }
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

  app.get<{ Querystring: AtemQuery }>("/api/timeline", async (req, reply) => {
    try {
      return buildTimelineResponse(req.query);
    } catch (err: any) {
      if (err?.status && err?.error) {
        reply.code(err.status);
        return { error: err.error };
      }
      throw err;
    }
  });

  app.get<{ Querystring: CompareQuery }>("/api/compare", async (req, reply) => {
    try {
      return buildCompareResponse(req.query);
    } catch (err: any) {
      if (err?.status && err?.error) {
        reply.code(err.status);
        return { error: err.error };
      }
      throw err;
    }
  });

  app.get<{ Querystring: LeaderboardQuery }>("/api/leaderboard", async (req, reply) => {
    try {
      return buildLeaderboardResponse(req.query);
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
