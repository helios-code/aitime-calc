import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";
import { TOOLS } from "../src/dataset.js";

// Every assertion pins as_of so the numbers can't drift with the wall clock.
const AS_OF = "2026-08-07";

describe("GET /api/timeline", () => {
  it("returns every dataset tool, oldest release first", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: `/api/timeline?as_of=${AS_OF}` });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.as_of).toBe(AS_OF);
    expect(body.model).toBe("base");
    expect(body.count).toBe(TOOLS.length);
    expect(body.tools).toHaveLength(TOOLS.length);

    const dates = body.tools.map((t: { release_date: string }) => t.release_date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("scores each tool exactly as /api/calc scores it alone", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: `/api/timeline?as_of=${AS_OF}` });
    const first = res.json().tools[0];

    expect(first.tool_id).toBe("gpt-2");
    expect(first.release_date).toBe("2019-02-14");
    expect(first.human_equiv_human).toBeTruthy();
    expect(first.elapsed.days).toBeGreaterThan(0);

    // No new math: the row must match the single-tool endpoint field for field.
    const calc = await app.inject({ method: "GET", url: `/api/calc?tool_id=gpt-2&as_of=${AS_OF}` });
    const single = calc.json();
    expect(first.human_equiv_years).toBe(single.human_equiv_years);
    expect(first.human_equiv_human).toBe(single.human_equiv_human);
    expect(first.ai_doublings).toBe(single.ai_doublings);
    expect(first.elapsed).toEqual(single.elapsed);
  });

  it("honors model + doubling params like /api/calc does", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/timeline?as_of=${AS_OF}&model=accelerating&d_classic_months=36&d_ai_months=3`,
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.model).toBe("accelerating");
    expect(body.params).toEqual({ d_classic_months: 36, d_ai_months: 3, multiplier: 12 });

    const base = await app.inject({ method: "GET", url: `/api/timeline?as_of=${AS_OF}` });
    expect(body.tools[0].human_equiv_years).not.toBe(base.json().tools[0].human_equiv_years);
  });

  it("omits tools that had not shipped yet at as_of, so no row scores negative", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/timeline?as_of=2023-01-01" });
    const body = res.json();

    expect(body.count).toBeLessThan(TOOLS.length);
    expect(body.count).toBe(TOOLS.filter((t) => t.release_date <= "2023-01-01").length);
    for (const row of body.tools) {
      expect(row.release_date <= "2023-01-01").toBe(true);
      expect(row.human_equiv_years).toBeGreaterThanOrEqual(0);
    }
  });

  it("400s on an invalid as_of, an unknown model or a non-positive doubling param", async () => {
    const app = buildServer();
    for (const query of [
      "as_of=not-a-date",
      `as_of=${AS_OF}&model=sideways`,
      `as_of=${AS_OF}&d_ai_months=0`,
      `as_of=${AS_OF}&d_classic_months=abc`,
    ]) {
      const res = await app.inject({ method: "GET", url: `/api/timeline?${query}` });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBeTruthy();
    }
  });
});

describe("GET /api/compare", () => {
  it("pairs two tools scored against the same as_of", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/compare?tool=gpt-4&vs=claude-sonnet-4-5&as_of=${AS_OF}`,
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.as_of).toBe(AS_OF);
    expect(body.a.tool_id).toBe("gpt-4");
    expect(body.b.tool_id).toBe("claude-sonnet-4-5");
    // gpt-4 shipped first, so it has compressed more human-equivalent time.
    expect(body.a.human_equiv_years).toBeGreaterThan(body.b.human_equiv_years);
    expect(body.delta.human_equiv_years).toBeCloseTo(
      Number((body.a.human_equiv_years - body.b.human_equiv_years).toFixed(2)),
      2,
    );
    expect(body.delta.ahead).toBe("gpt-4");
  });

  it("resolves legacy tool-id aliases the same way /api/calc does", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/compare?tool=cursor-yolo&vs=gpt-3&as_of=${AS_OF}`,
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.a.tool_id).toBe("cursor-yolo-mode");
    expect(body.b.tool_id).toBe("gpt-3-api");
  });

  it("reports a zero delta and no leader when a tool is compared with itself", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/compare?tool=gpt-4&vs=gpt-4&as_of=${AS_OF}`,
    });
    const body = res.json();
    expect(body.delta.human_equiv_years).toBe(0);
    expect(body.delta.ahead).toBeNull();
  });

  it("400s on a missing or unknown tool id", async () => {
    const app = buildServer();
    for (const query of ["tool=gpt-4", "vs=gpt-4", "tool=gpt-4&vs=nope", "tool=nope&vs=gpt-4"]) {
      const res = await app.inject({ method: "GET", url: `/api/compare?${query}` });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBeTruthy();
    }
  });

  it("400s rather than scoring a tool that had not shipped at as_of", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/compare?tool=gpt-2&vs=claude-sonnet-4-5&as_of=2023-01-01",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain("released after as_of");
  });
});
