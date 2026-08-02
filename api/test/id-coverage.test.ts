import { describe, expect, it } from "vitest";
import { TOOLS } from "../src/dataset.js";
import { FALLBACK_TOOLS } from "../../web/src/data/tools.js";

describe("web fallback dataset stays in sync with the api canonical id space", () => {
  it("every FALLBACK_TOOLS id exists in api TOOLS (web is a strict subset)", () => {
    const apiIds = new Set(TOOLS.map((t) => t.id));
    const missing = FALLBACK_TOOLS.filter((t) => !apiIds.has(t.id)).map((t) => t.id);
    expect(missing, `ids missing from api/src/dataset.ts: ${missing.join(", ")}`).toEqual([]);
  });
});
