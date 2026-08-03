import { describe, expect, it } from "vitest";
import { findTool, TOOLS } from "../src/dataset.js";

describe("dataset integrity", () => {
  it("has unique ids", () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every release_date parses to a valid Date", () => {
    for (const t of TOOLS) {
      const d = new Date(`${t.release_date}T00:00:00Z`);
      expect(Number.isNaN(d.getTime()), `${t.id} has invalid release_date "${t.release_date}"`).toBe(false);
    }
  });

  it("every entry has non-empty name, vendor, and note", () => {
    for (const t of TOOLS) {
      expect(t.name.trim(), `${t.id} missing name`).not.toBe("");
      expect(t.vendor.trim(), `${t.id} missing vendor`).not.toBe("");
      expect(t.note.trim(), `${t.id} missing note`).not.toBe("");
    }
  });

  // Fixed cutoff, never `new Date()` — a freshness assertion that reads the ambient
  // clock would start failing on its own without the dataset changing.
  it("covers the current generation of releases (entries past 2026-01-01)", () => {
    const recent = TOOLS.filter((t) => t.release_date >= "2026-01-01");
    expect(recent.length, "dataset has no 2026 releases").toBeGreaterThan(0);
  });

  it("resolves current-generation ids", () => {
    for (const id of ["claude-opus-5", "claude-sonnet-5", "gpt-5-6", "gemini-3-6-flash"]) {
      expect(findTool(id), `${id} not resolvable`).toBeDefined();
    }
  });
});
