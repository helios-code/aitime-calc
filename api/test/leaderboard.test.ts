import { describe, expect, it } from "vitest";
import { buildServer, buildLeaderboardResponse } from "../src/server.js";
import { TOOLS } from "../src/dataset.js";

describe("buildLeaderboardResponse", () => {
  it("ranks every tool in the dataset, descending by human_equiv_years", () => {
    const board = buildLeaderboardResponse({});
    expect(board.length).toBe(TOOLS.length);
    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].human_equiv_years).toBeGreaterThanOrEqual(board[i].human_equiv_years);
    }
  });

  it("assigns sequential ranks starting at 1", () => {
    const board = buildLeaderboardResponse({});
    board.forEach((entry, i) => expect(entry.rank).toBe(i + 1));
  });

  it("older tools (earlier release_date) rank ahead of newer ones by default", () => {
    const board = buildLeaderboardResponse({});
    const oldest = TOOLS.reduce((a, b) => (b.release_date < a.release_date ? b : a));
    const newest = TOOLS.reduce((a, b) => (b.release_date > a.release_date ? b : a));
    const oldestEntry = board.find((e) => e.tool_id === oldest.id)!;
    const newestEntry = board.find((e) => e.tool_id === newest.id)!;
    expect(oldestEntry.rank).toBeLessThan(newestEntry.rank);
  });

  it("accepts model=accelerating and re-ranks", () => {
    const board = buildLeaderboardResponse({ model: "accelerating" });
    expect(board.length).toBe(TOOLS.length);
  });

  it("400s on an unknown model", () => {
    expect(() => buildLeaderboardResponse({ model: "nope" })).toThrow();
  });
});

describe("GET /api/leaderboard", () => {
  it("returns the full ranked dataset as JSON", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/leaderboard" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
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
});
