import { describe, expect, it } from "vitest";
import { buildServer, buildLeaderboardResponse } from "../src/server.js";
import { TOOLS } from "../src/dataset.js";

// The latest release_date in the dataset. The unreleased-at-as_of filter is
// inclusive (release <= as_of), so the newest tool still counts; pinning as_of
// here instead of ambient server-now keeps the "full dataset" assertions
// deterministic regardless of when the tests run.
const FIXED_AS_OF = TOOLS.reduce((max, t) => (t.release_date > max ? t.release_date : max), "1970-01-01");

describe("buildLeaderboardResponse", () => {
  it("ranks every tool in the dataset, descending by human_equiv_years", () => {
    const { leaderboard: board } = buildLeaderboardResponse({ as_of: FIXED_AS_OF });
    expect(board.length).toBe(TOOLS.length);
    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].human_equiv_years).toBeGreaterThanOrEqual(board[i].human_equiv_years);
    }
  });

  it("echoes the resolved as_of and model alongside the ranked rows", () => {
    const res = buildLeaderboardResponse({ as_of: FIXED_AS_OF, model: "accelerating" });
    expect(res.as_of).toBe(FIXED_AS_OF);
    expect(res.model).toBe("accelerating");
    expect(Array.isArray(res.leaderboard)).toBe(true);
  });

  it("assigns sequential ranks starting at 1", () => {
    const { leaderboard: board } = buildLeaderboardResponse({ as_of: FIXED_AS_OF });
    board.forEach((entry, i) => expect(entry.rank).toBe(i + 1));
  });

  it("older tools (earlier release_date) rank ahead of newer ones by default", () => {
    const { leaderboard: board } = buildLeaderboardResponse({ as_of: FIXED_AS_OF });
    const oldest = TOOLS.reduce((a, b) => (b.release_date < a.release_date ? b : a));
    const newest = TOOLS.reduce((a, b) => (b.release_date > a.release_date ? b : a));
    const oldestEntry = board.find((e) => e.tool_id === oldest.id)!;
    const newestEntry = board.find((e) => e.tool_id === newest.id)!;
    expect(oldestEntry.rank).toBeLessThan(newestEntry.rank);
  });

  it("accepts model=accelerating and re-ranks", () => {
    const { leaderboard: board } = buildLeaderboardResponse({ model: "accelerating", as_of: FIXED_AS_OF });
    expect(board.length).toBe(TOOLS.length);
  });

  it("400s on an unknown model", () => {
    expect(() => buildLeaderboardResponse({ model: "nope" })).toThrow();
  });

  it("accepts as_of and reproduces the same ranking deterministically", () => {
    const res = buildLeaderboardResponse({ as_of: "2025-01-01" });
    expect(buildLeaderboardResponse({ as_of: "2025-01-01" })).toEqual(res);
  });

  it("400s on an invalid as_of date", () => {
    expect(() => buildLeaderboardResponse({ as_of: "not-a-date" })).toThrow();
  });

  it("excludes tools not yet released as of as_of, never returning negative human_equiv_years", () => {
    const asOf = "2025-01-01";
    const { leaderboard: board } = buildLeaderboardResponse({ as_of: asOf });
    for (const entry of board) {
      expect(entry.release_date <= asOf).toBe(true);
      expect(entry.human_equiv_years).toBeGreaterThanOrEqual(0);
    }
    const unreleased = TOOLS.filter((t) => t.release_date > asOf);
    expect(unreleased.length).toBeGreaterThan(0);
    for (const tool of unreleased) {
      expect(board.find((e) => e.tool_id === tool.id)).toBeUndefined();
    }
  });
});

describe("GET /api/leaderboard", () => {
  it("returns the full ranked dataset as JSON", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: `/api/leaderboard?as_of=${FIXED_AS_OF}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.as_of).toBe(FIXED_AS_OF);
    expect(body.model).toBe("base");
    expect(Array.isArray(body.leaderboard)).toBe(true);
    expect(body.leaderboard.length).toBe(TOOLS.length);
    expect(body.leaderboard[0]).toHaveProperty("rank", 1);
    expect(body.leaderboard[0]).toHaveProperty("tool_id");
    expect(body.leaderboard[0]).toHaveProperty("name");
    expect(body.leaderboard[0]).toHaveProperty("human_equiv_years");
    expect(body.leaderboard[0]).toHaveProperty("release_date");
  });

  it("accepts ?model=accelerating", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/leaderboard?model=accelerating" });
    expect(res.statusCode).toBe(200);
  });

  it("400s on ?model=nope with a clear error message", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/leaderboard?model=nope" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain("nope");
  });

  it("accepts ?as_of=YYYY-MM-DD", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/leaderboard?as_of=2025-01-01" });
    expect(res.statusCode).toBe(200);
  });

  it("400s on an invalid ?as_of", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/leaderboard?as_of=nope" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain("nope");
  });
});
