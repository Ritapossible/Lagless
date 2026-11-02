import { describe, it, expect } from "vitest";
import { createInitialState, updateGame, jump, activateAbility } from "@/game/engine";
import { CHARACTERS, LIFT_OFF_HEIGHT, GameState } from "@/game/types";

const byName = (name: string) => CHARACTERS.find(c => c.name === name)!;

function running(name: string): GameState {
  const s = createInitialState(byName(name), 1);
  return { ...s, running: true };
}

// Steps the engine with fixed frames; spawning is random, so tests only look at the player
function step(s: GameState, seconds: number, dt = 1 / 60) {
  for (let t = 0; t < seconds; t += dt) s = updateGame(s, dt);
  return s;
}

function airtime(name: string) {
  let s = jump(running(name));
  let peak = 0, t = 0;
  while (s.isJumping && t < 5) {
    s = updateGame(s, 1 / 60);
    peak = Math.max(peak, s.playerY);
    t += 1 / 60;
  }
  return { peak, t };
}

describe("runner jumps", () => {
  it("leaves the original three runners' jumps unchanged", () => {
    for (const name of ["Dart", "Hopper", "Anchor"]) {
      const { peak, t } = airtime(name);
      expect(peak).toBeCloseTo((12 * 12) / (2 * 25), 0);
      expect(t).toBeCloseTo((2 * 12) / 25, 1);
    }
  });

  it("gives Volt a higher, longer flight", () => {
    const volt = airtime("Volt");
    const dart = airtime("Dart");
    expect(volt.peak).toBeGreaterThan(dart.peak * 1.5);
    expect(volt.t).toBeGreaterThan(dart.t * 1.4);
  });
});

describe("Lift-off", () => {
  it("climbs above obstacle height and holds it while active", () => {
    let s = activateAbility(running("Volt"));
    s = step(s, 1.5);
    expect(s.abilityActive).toBe(true);
    expect(s.playerY).toBeGreaterThan(2);
    expect(s.playerY).toBeCloseTo(LIFT_OFF_HEIGHT, 1);
  });

  it("is not hit by an obstacle in its lane while flying", () => {
    let s = step(activateAbility(running("Volt")), 0.8);
    s = { ...s, obstacles: [{ lane: s.currentLane, z: 60, type: "spam", width: 40, height: 40, hit: false }] };
    const before = s.health;
    s = updateGame(s, 1 / 60);
    expect(s.health).toBe(before);
  });

  it("falls back to the track when it ends", () => {
    let s = step(activateAbility(running("Volt")), 3.2);
    expect(s.abilityActive).toBe(false);
    s = step(s, 2);
    expect(s.playerY).toBe(0);
    expect(s.isJumping).toBe(false);
  });
});
