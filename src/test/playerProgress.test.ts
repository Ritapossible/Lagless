import { describe, it, expect, beforeEach } from "vitest";
import { loadProgress, setUsername, retryLevel, claimDailyTrial, clearPendingTrial } from "@/game/playerProgress";
import { isDailyRewardAvailable } from "@/game/dailyMissions";

describe("loadProgress", () => {
  beforeEach(() => localStorage.clear());

  it("carries the final-world unlock over from saves made before the rename", () => {
    localStorage.setItem("latency-escape-progress", JSON.stringify({ highestLevel: 42, optimumLayerUnlocked: true }));
    const p = loadProgress();
    expect(p.finalWorldUnlocked).toBe(true);
    expect(p.highestLevel).toBe(42);
    expect("optimumLayerUnlocked" in p).toBe(false);
  });

  it("defaults to locked for a new player", () => {
    expect(loadProgress().finalWorldUnlocked).toBe(false);
  });
});

describe("username", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the name saved under the old discordUsername field", () => {
    localStorage.setItem("latency-escape-progress", JSON.stringify({ discordUsername: "rita" }));
    const p = loadProgress();
    expect(p.username).toBe("rita");
    expect("discordUsername" in p).toBe(false);
  });

  it("saves any username, and Guest for guests", () => {
    setUsername("skyrunner");
    expect(loadProgress().username).toBe("skyrunner");
    setUsername("Guest");
    expect(loadProgress().username).toBe("Guest");
  });
});

describe("retryLevel", () => {
  it("restarts at the run's start before the first checkpoint", () => {
    expect(retryLevel(9, 1)).toBe(1);
  });

  it("never drops back to level 1 once level 10 is reached in a run", () => {
    expect(retryLevel(10, 1)).toBe(10);
    expect(retryLevel(13, 1)).toBe(12);
    expect(retryLevel(23, 1)).toBe(22);
    expect(retryLevel(44, 1)).toBe(44);
  });

  it("keeps a later start level when the run never passed a higher checkpoint", () => {
    expect(retryLevel(13, 12)).toBe(12);
  });
});

describe("daily trial", () => {
  beforeEach(() => localStorage.clear());

  const finishAllMissions = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("latency-escape-daily-missions", JSON.stringify({
      date: today,
      missions: {
        latency_above_60: { current: 20, completed: true },
        correct_routing: { current: 10, completed: true },
        use_relays: { current: 5, completed: true },
        deploy_flexnodes: { current: 3, completed: true },
      },
      allCompleted: true,
      rewardClaimed: false,
    }));
  };

  it("cannot be claimed before the missions are done", () => {
    expect(claimDailyTrial()).toBe(false);
    expect(loadProgress().pendingTrial).toBe(false);
  });

  it("gives exactly one trial per day of missions", () => {
    finishAllMissions();
    expect(claimDailyTrial()).toBe(true);
    expect(loadProgress().pendingTrial).toBe(true);
    clearPendingTrial();
    expect(loadProgress().pendingTrial).toBe(false);
    expect(claimDailyTrial()).toBe(false);
    expect(isDailyRewardAvailable()).toBe(false);
  });
});
