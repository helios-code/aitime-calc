import { describe, expect, it } from "vitest";
import { TOOLS } from "../src/dataset.js";

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
});
