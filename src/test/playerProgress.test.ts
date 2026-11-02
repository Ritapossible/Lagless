import { describe, it, expect, beforeEach } from "vitest";
import { loadProgress, setUsername } from "@/game/playerProgress";

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
