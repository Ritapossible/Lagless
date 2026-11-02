import { describe, it, expect, beforeEach } from "vitest";
import { loadTopRuns, recordRun, LEADERBOARD_SIZE, RunRecord } from "@/game/leaderboard";

const run = (score: number): RunRecord => ({
  score,
  level: 3,
  world: "Congestion Zone",
  character: "Dart",
  bestCombo: 1.5,
  victory: false,
  date: "2026-11-02T10:00:00.000Z",
});

describe("leaderboard", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(loadTopRuns()).toEqual([]);
  });

  it("keeps runs sorted by score and returns the new run's rank", () => {
    expect(recordRun(run(100))).toBe(1);
    expect(recordRun(run(300))).toBe(1);
    expect(recordRun(run(200))).toBe(2);
    expect(loadTopRuns().map(r => r.score)).toEqual([300, 200, 100]);
  });

  it("floors fractional scores", () => {
    recordRun(run(123.9));
    expect(loadTopRuns()[0].score).toBe(123);
  });

  it("keeps only the top runs and returns 0 for a run that does not place", () => {
    for (let i = 1; i <= LEADERBOARD_SIZE; i++) recordRun(run(i * 10));
    expect(recordRun(run(1))).toBe(0);
    expect(loadTopRuns()).toHaveLength(LEADERBOARD_SIZE);
    expect(loadTopRuns().at(-1)?.score).toBe(10);
  });

  it("ignores corrupt storage", () => {
    localStorage.setItem("lagless-leaderboard", "{not json");
    expect(loadTopRuns()).toEqual([]);
    localStorage.setItem("lagless-leaderboard", '{"a":1}');
    expect(loadTopRuns()).toEqual([]);
  });
});
