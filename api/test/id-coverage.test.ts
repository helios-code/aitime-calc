import { describe, expect, it } from "vitest";
import { findTool, resolveToolId, TOOL_ID_ALIASES, TOOLS } from "../src/dataset.js";
import { FALLBACK_TOOLS, TOOL_ID_ALIASES as WEB_TOOL_ID_ALIASES } from "../../web/src/data/tools.js";
import { buildServer } from "../src/server.js";

describe("web fallback dataset stays in sync with the api canonical id space", () => {
  it("every FALLBACK_TOOLS id exists in api TOOLS (web is a strict subset)", () => {
    const apiIds = new Set(TOOLS.map((t) => t.id));
    const missing = FALLBACK_TOOLS.filter((t) => !apiIds.has(t.id)).map((t) => t.id);
    expect(missing, `ids missing from api/src/dataset.ts: ${missing.join(", ")}`).toEqual([]);
  });

  // The subset is curated for older entries, but current-generation tools are the ones
  // an offline visitor actually looks for — and letting them drift is exactly how the
  // web list ended up ~10 months stale. Fixed cutoff, never the ambient clock.
  const CURRENT_GEN_CUTOFF = "2025-10-01";

  it(`every api tool released on/after ${CURRENT_GEN_CUTOFF} is mirrored in FALLBACK_TOOLS`, () => {
    const webIds = new Set(FALLBACK_TOOLS.map((t) => t.id));
    const missing = TOOLS.filter((t) => t.release_date >= CURRENT_GEN_CUTOFF)
      .filter((t) => !webIds.has(t.id))
      .map((t) => t.id);
    expect(missing, `ids missing from web/src/data/tools.ts: ${missing.join(", ")}`).toEqual([]);
  });

  it("api and web alias maps stay identical", () => {
    expect(TOOL_ID_ALIASES).toEqual(WEB_TOOL_ID_ALIASES);
  });
});

describe("resolveToolId / findTool", () => {
  it("does not leak Object.prototype members for inherited-key ids", () => {
    for (const id of ["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__"]) {
      expect(resolveToolId(id)).toBe(id);
      expect(findTool(id)).toBeUndefined();
    }
  });
});

describe("GET /api/calc resolves old aliased tool_id values", () => {
  it("accepts a pre-reconciliation id and computes the same as its canonical id", async () => {
    const app = buildServer();
    const aliased = await app.inject({ method: "GET", url: "/api/calc?tool_id=claude-4.5-sonnet&as_of=2026-07-30" });
    const canonical = await app.inject({ method: "GET", url: "/api/calc?tool_id=claude-sonnet-4-5&as_of=2026-07-30" });
    expect(aliased.statusCode).toBe(200);
    const { input: aliasedInput, ...aliasedRest } = aliased.json();
    const { input: canonicalInput, ...canonicalRest } = canonical.json();
    expect(aliasedRest).toEqual(canonicalRest);
    expect(aliasedInput.release_date).toBe(canonicalInput.release_date);
  });

  it("rejects an inherited-object-property id as unknown, not a crash", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/calc?tool_id=constructor&as_of=2026-07-30" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("unknown tool_id: constructor");
  });
});

describe("GET /api/og resolves old aliased tool values", () => {
  it("accepts a pre-reconciliation id", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/og?tool=claude-4.5-sonnet&date=2026-07-30" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
  });
});
