import { describe, it, expect } from "vitest";
import { createInitialState, updateGame, jump, activateAbility } from "@/game/engine";
import { CHARACTERS, LIFT_OFF_HEIGHT, GameState, LEVEL_DISTANCE, OVERDRIVE_REFILL, TIME_PICKUP_REFILL, REPAIR_PICKUP_HULL, SCORE_BOOST_SECONDS } from "@/game/types";

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

describe("balance", () => {
  // Deterministic random so spawn counts compare like for like
  const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  function spawnsPerMinute(fps: number) {
    const real = Math.random;
    Math.random = seeded(42);
    try {
      let s: GameState = { ...running("Dart"), latencyBudget: 1e9, maxLatency: 1e9, health: 1e9, maxHealth: 1e9 };
      let pickups = 0, obstacles = 0;
      for (let i = 0; i < 3 * 60 * fps; i++) {
        const before = { p: s.pickups.length, o: s.obstacles.length };
        s = updateGame(s, 1 / fps);
        pickups += Math.max(0, s.pickups.length - before.p);
        obstacles += Math.max(0, s.obstacles.length - before.o);
      }
      return { pickups: pickups / 3, obstacles: obstacles / 3 };
    } finally {
      Math.random = real;
    }
  }

  it("spawns about the same per second at 30 fps as at 60 fps", () => {
    const at60 = spawnsPerMinute(60);
    const at30 = spawnsPerMinute(30);
    expect(at30.pickups / at60.pickups).toBeGreaterThan(0.75);
    expect(at30.pickups / at60.pickups).toBeLessThan(1.25);
    expect(at30.obstacles / at60.obstacles).toBeGreaterThan(0.8);
    expect(at30.obstacles / at60.obstacles).toBeLessThan(1.2);
  });

  it("refills 25 ms when Overdrive fires", () => {
    const s = { ...running("Dart"), latencyBudget: 40 };
    expect(activateAbility(s).latencyBudget).toBe(40 + OVERDRIVE_REFILL);
  });

  const collect = (type: "time" | "repair") => {
    const s: GameState = { ...running("Dart"), latencyBudget: 40, health: 30 };
    return updateGame({ ...s, pickups: [{ lane: s.currentLane, z: 52, type, collected: false }] }, 1 / 60);
  };

  it("a green cross refills 30 ms of time and leaves the hull alone", () => {
    const s = collect("time");
    expect(s.latencyBudget).toBeGreaterThan(40 + TIME_PICKUP_REFILL - 1);
    expect(s.health).toBe(30);
  });

  it("a white repair cell repairs the hull and leaves the time alone", () => {
    const s = collect("repair");
    expect(s.health).toBe(30 + REPAIR_PICKUP_HULL);
    expect(s.latencyBudget).toBeLessThan(40);
  });

  it("a teal diamond doubles score for 8 s and refills nothing", () => {
    const base: GameState = { ...running("Dart"), latencyBudget: 40, health: 30 };
    const s = updateGame({ ...base, pickups: [{ lane: base.currentLane, z: 52, type: "relay", collected: false }] }, 1 / 60);
    expect(s.scoreBoostTimer).toBeCloseTo(SCORE_BOOST_SECONDS, 1);
    expect(s.latencyBudget).toBeLessThan(40);
    expect(s.health).toBe(30);
    // Survival score accrues twice as fast while boosted
    const plain = updateGame({ ...base }, 0.5).score - base.score;
    const boosted = updateGame({ ...base, scoreBoostTimer: 5 }, 0.5).score - base.score;
    expect(boosted / plain).toBeCloseTo(2, 1);
  });

  it("never repairs the hull past full", () => {
    const s: GameState = { ...running("Dart"), health: 45 };
    const after = updateGame({ ...s, pickups: [{ lane: s.currentLane, z: 52, type: "repair", collected: false }] }, 1 / 60);
    expect(after.health).toBe(after.maxHealth);
  });

  it("goes back to cruising speed after Overdrive, not the world's starting speed", () => {
    const start = createInitialState(byName("Dart"), 26);
    let s: GameState = { ...start, running: true, latencyBudget: 1e9, maxLatency: 1e9, health: 1e9, maxHealth: 1e9 };
    const cruising = s.speed;
    s = step(activateAbility(s), 0.5);
    const during = s.distance;
    s = step(s, 3);
    expect(s.abilityActive).toBe(false);
    expect(s.speed).toBeGreaterThanOrEqual(cruising);
    // While active the run covered ground at double pace
    expect(during - start.distance).toBeGreaterThan(cruising * 0.5 * 1.9);
  });

  it("levels up every LEVEL_DISTANCE", () => {
    expect(createInitialState(byName("Dart"), 5).distance).toBe(4 * LEVEL_DISTANCE);
  });
});
