import Fastify from "fastify";
import cors from "@fastify/cors";
import { TOOLS } from "./dataset.js";
import {
  computeAtem,
  DEFAULT_PARAMS,
  monthsToHuman,
  yearsToHuman,
  type CalcModel,
} from "./atem.js";

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

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
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

export function buildServer() {
  const app = Fastify({ logger: false });

  app.register(cors, { origin: true });

  app.get("/api/tools", async () => ({ tools: TOOLS }));

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
