import { describe, expect, it } from "vitest";
import { TOOLS } from "../src/dataset.js";
import { FALLBACK_TOOLS } from "../../web/src/data/tools.js";

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
});
