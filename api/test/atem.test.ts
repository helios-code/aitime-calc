import { describe, expect, it } from "vitest";
import { computeAtem, DEFAULT_PARAMS } from "../src/atem.js";
import { TOOLS } from "../src/dataset.js";
// Dataset field/shape assertions moved to dataset.test.ts.

describe("ATEM base model", () => {
  it("anchors Cursor YOLO (~2024-11) at ~27 human-years as of 2026-07-30", () => {
    const tool = TOOLS.find((t) => t.id === "cursor-yolo-mode");
    expect(tool).toBeDefined();

    const release = new Date(`${tool!.release_date}T00:00:00Z`);
    const asOf = new Date("2026-07-30T00:00:00Z");

    const result = computeAtem(release, asOf, "base", DEFAULT_PARAMS);

    expect(result.humanEquivYears).toBeGreaterThan(24);
    expect(result.humanEquivYears).toBeLessThan(31);
  });

  it("returns zero elapsed/doublings when release == as_of", () => {
    const d = new Date("2025-01-01T00:00:00Z");
    const result = computeAtem(d, d, "base", DEFAULT_PARAMS);
    expect(result.elapsedMonths).toBeCloseTo(0, 5);
    expect(result.aiDoublings).toBeCloseTo(0, 5);
    expect(result.humanEquivYears).toBeCloseTo(0, 5);
  });

  it("multiplier reflects D_classic / D_ai", () => {
    const result = computeAtem(
      new Date("2024-01-01T00:00:00Z"),
      new Date("2025-01-01T00:00:00Z"),
      "base",
      { dClassicMonths: 72, dAiMonths: 4.5 },
    );
    expect(result.params.multiplier).toBeCloseTo(16, 5);
  });
});

describe("ATEM accelerating model", () => {
  it("produces a positive, finite result and stays in the same ballpark as base for a recent release", () => {
    const release = new Date("2024-11-01T00:00:00Z");
    const asOf = new Date("2026-07-30T00:00:00Z");

    const base = computeAtem(release, asOf, "base", DEFAULT_PARAMS);
    const accel = computeAtem(release, asOf, "accelerating", DEFAULT_PARAMS);

    expect(accel.humanEquivYears).toBeGreaterThan(0);
    expect(Number.isFinite(accel.humanEquivYears)).toBe(true);
    expect(accel.humanEquivYears).toBeGreaterThan(base.humanEquivYears * 0.5);
    expect(accel.humanEquivYears).toBeLessThan(base.humanEquivYears * 2);
  });

  it("weighs older releases more (super-linear vs base)", () => {
    const asOf = new Date("2026-07-30T00:00:00Z");
    const oldRelease = new Date("2020-01-01T00:00:00Z");

    const base = computeAtem(oldRelease, asOf, "base", DEFAULT_PARAMS);
    const accel = computeAtem(oldRelease, asOf, "accelerating", DEFAULT_PARAMS);

    // Accelerating model spends more time at the slower (7mo) doubling rate for old
    // releases, so fewer doublings accrue per elapsed month than the flat base rate.
    expect(accel.aiDoublings).toBeLessThan(base.aiDoublings);
  });
});
