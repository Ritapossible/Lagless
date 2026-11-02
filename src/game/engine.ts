import { GameState, Obstacle, Pickup, WORLDS, CHARACTERS, LaneState, DEFAULT_JUMP_VELOCITY, DEFAULT_GRAVITY, LIFT_OFF_HEIGHT, LEVEL_DISTANCE, OVERDRIVE_REFILL, TIME_PICKUP_REFILL, REPAIR_PICKUP_HULL } from './types';

// Spawn and lane-change odds are tuned per frame at 60 fps. Scaling them by frame time keeps
// the same rate per second on any device; a phone at 30 fps used to get half the pickups.
// Pickup mix: relay 30%, time 25%, repair 20%, score 25%
function pickPickupType(roll: number): Pickup['type'] {
  if (roll < 0.3) return 'relay';
  if (roll < 0.55) return 'time';
  if (roll < 0.75) return 'repair';
  return 'score';
}

const SPAWN_Z = 800;
// Hazards closer together than this much travel time count as one stretch of track
const FAIR_GAP_SECONDS = 0.7;

const chance = (perFrameAt60: number, dt: number) =>
  Math.random() < 1 - Math.pow(1 - Math.min(perFrameAt60, 1), dt * 60);

const BOSS_LEVELS = [25, 39];

export function createInitialState(character?: import('./types').Character, startLevel?: number): GameState {
  const level = startLevel || 1;
  // Determine world from level
  let worldIdx = 0;
  if (level >= 40) worldIdx = 4;
  else if (level >= 33) worldIdx = 3;
  else if (level >= 26) worldIdx = 2;
  else if (level >= 13) worldIdx = 1;
  const worldConfig = WORLDS[worldIdx];
  
  return {
    running: false,
    paused: false,
    gameOver: false,
    currentLane: 1,
    targetLane: 1,
    playerY: 0,
    playerVelocityY: 0,
    isJumping: false,
    speed: worldConfig.baseSpeed + (level - 1) * 0.3,
    distance: (level - 1) * LEVEL_DISTANCE,
    score: 0,
    health: 50,
    maxHealth: 50,
    latencyBudget: 100,
    maxLatency: 100,
    comboCount: 0,
    comboMultiplier: 1,
    level,
    world: worldIdx,
    obstacles: [],
    pickups: [],
    lanes: [
      { state: 'fast', timer: 0 },
      { state: 'fast', timer: 0 },
      { state: 'fast', timer: 0 },
    ],
    abilityActive: false,
    abilityCooldownTimer: 0,
    abilityDurationTimer: 0,
    character: character || CHARACTERS[0],
    worldConfig,
    laneChangeProgress: 1,
    frameCount: 0,
    streakTimer: 0,
    levelUpDisplay: 0,
    levelUpName: '',
    isBossLevel: false,
    relaysUsed: 0,
    platformsDeployed: 0,
    routingMistakes: 0,
    bestCombo: 0,
    failureCause: '',
    floatingTexts: [],
    pickupsCollected: 0,
    latencyAbove60Time: 0,
    audioEvents: { hit: false, pickup: false, levelUp: false, gameOver: false },
  };
}

export function updateGame(state: GameState, dt: number): GameState {
  if (!state.running || state.paused || state.gameOver) return state;

  const s = { ...state };
  const wc = s.worldConfig;
  s.audioEvents = { hit: false, pickup: false, levelUp: false, gameOver: false };
  s.frameCount++;
  // Overdrive doubles the pace while it runs; s.speed itself stays the cruising speed
  const pace = s.abilityActive && s.character.ability === 'speed_warp' ? s.speed * 2 : s.speed;
  s.distance += pace * dt;

  // Update floating texts
  s.floatingTexts = s.floatingTexts
    .map(ft => ({ ...ft, life: ft.life - dt, y: ft.y - dt * 0.08 }))
    .filter(ft => ft.life > 0);
  
  // Score from survival
  s.score += pace * dt * s.comboMultiplier * 0.5;

  // Lane interpolation
  if (s.currentLane !== s.targetLane) {
    s.laneChangeProgress += dt * 8;
    if (s.laneChangeProgress >= 1) {
      s.currentLane = s.targetLane;
      s.laneChangeProgress = 1;
    }
  }

  // Jump physics
  if (s.abilityActive && s.character.ability === 'lift_off') {
    // Lift-off: climb to cruising height and hold it; when the ability ends the car falls as from a jump
    s.playerY += (LIFT_OFF_HEIGHT - s.playerY) * Math.min(1, dt * 6);
    s.playerVelocityY = 0;
    s.isJumping = true;
  } else if (s.isJumping) {
    s.playerY += s.playerVelocityY * dt;
    s.playerVelocityY -= (s.character.gravity ?? DEFAULT_GRAVITY) * dt;
    if (s.playerY <= 0) {
      s.playerY = 0;
      s.playerVelocityY = 0;
      s.isJumping = false;
    }
  }

  // Boss level multiplier for pressure
  const bossMulti = s.isBossLevel ? 1.6 : 1;

  // Latency drain — uses stage-specific rates
  const currentLaneState = s.lanes[s.currentLane].state;
  let drainRate = 3 * wc.latencyDrainRate * bossMulti;
  if (currentLaneState === 'congested') drainRate = wc.latencyDrainCongested * bossMulti;
  if (currentLaneState === 'fast') {
    s.streakTimer += dt;
    if (s.streakTimer > 2) drainRate = 1.5 * wc.latencyDrainRate;
  } else {
    s.streakTimer = 0;
  }
  // Stability zones (Anchor Yards) — count as platform deployments
  if (wc.stabilityZones && currentLaneState === 'fast') {
    drainRate *= 0.5;
    // Count once every ~2 seconds while in stability zone
    if (chance(1 / 120, dt)) {
      s.platformsDeployed++;
      s.floatingTexts = [...s.floatingTexts, {
        text: 'Lane stable +1', x: 0.5, y: 0.6, life: 1.2, color: '#4cc38a',
      }];
    }
  }
  s.latencyBudget = Math.max(0, s.latencyBudget - drainRate * dt);

  // Track latency above 60% for daily missions
  if ((s.latencyBudget / s.maxLatency) > 0.6) {
    s.latencyAbove60Time += dt;
  }

  // Relay boost refill — stage-specific rate
  if (currentLaneState === 'relay') {
    s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + wc.relayRefillRate * dt);
    s.comboCount++;
    s.bestCombo = Math.max(s.bestCombo, s.comboMultiplier);
    s.comboMultiplier = 1 + Math.min(s.comboCount * 0.1, wc.comboMultiplierCap);
  }

  // Spawn obstacles — boss levels spike density
  const obsDensity = wc.obstacleDensity * bossMulti;
  if (chance(obsDensity, dt)) {
    const lane = Math.floor(Math.random() * 3);
    // Fairness: never close the last open lane in a stretch, and never stack two hazards in one lane
    const fairGap = Math.max(160, s.speed * 60 * FAIR_GAP_SECONDS);
    const nearSpawn = s.obstacles.filter(o => o.z > SPAWN_Z - fairGap);
    const blocked = new Set(nearSpawn.map(o => o.lane)).add(lane);
    const stacked = nearSpawn.some(o => o.lane === lane && o.z > SPAWN_Z - fairGap / 2);
    if (blocked.size < 3 && !stacked) s.obstacles = [...s.obstacles, {
      lane,
      z: SPAWN_Z,
      type: ['spam', 'storm', 'failure'][Math.floor(Math.random() * 3)] as Obstacle['type'],
      width: 40,
      height: 40,
      hit: false,
    }];
  }

  // Spawn pickups
  if (chance(wc.relayFrequency, dt)) {
    const lane = Math.floor(Math.random() * 3);
    s.pickups = [...s.pickups, {
      lane,
      z: 800,
      type: pickPickupType(Math.random()),
      collected: false,
    }];
  }

  // Update lane states — stage-specific congestion/disable chance
  s.lanes = s.lanes.map((lane, laneIdx) => {
    const l = { ...lane };
    const prevState = l.state;
    if (chance(wc.congestedLaneChance * bossMulti, dt)) {
      const roll = Math.random();
      if (wc.laneDisableChance > 0 && Math.random() < wc.laneDisableChance * 10) {
        l.state = 'collapsing';
        l.timer = 3;
      } else if (roll < 0.4) {
        l.state = 'congested';
      } else if (roll < 0.4 + Math.min(0.3, wc.relayFrequency * 12)) {
        l.state = 'relay';
      } else {
        l.state = 'fast';
      }
    }
    if (l.state === 'collapsing') {
      l.timer -= dt;
      if (l.timer <= 0) {
        l.state = 'fast';
        // Lane recovered from collapse = platform stabilisation
        if (prevState === 'collapsing') {
          s.platformsDeployed++;
          s.floatingTexts = [...s.floatingTexts, {
            text: 'Lane stable +1', x: 0.2 + laneIdx * 0.3, y: 0.55, life: 1.2, color: '#4cc38a',
          }];
        }
      }
    }
    // Congested lane auto-stabilised to fast = platform event
    if (prevState === 'congested' && l.state === 'fast') {
      s.platformsDeployed++;
      s.floatingTexts = [...s.floatingTexts, {
        text: 'Lane stable +1', x: 0.2 + laneIdx * 0.3, y: 0.55, life: 1.2, color: '#4cc38a',
      }];
    }
    return l;
  }) as [typeof s.lanes[0], typeof s.lanes[0], typeof s.lanes[0]];

  // Move obstacles and pickups
  s.obstacles = s.obstacles
    .map(o => ({ ...o, z: o.z - pace * 60 * dt }))
    .filter(o => o.z > -100);

  s.pickups = s.pickups
    .map(p => ({ ...p, z: p.z - pace * 60 * dt }))
    .filter(p => p.z > -100);

  // Collision detection — stage-specific damage
  const playerZ = 50;
  s.obstacles = s.obstacles.map(o => {
    if (!o.hit && o.lane === s.currentLane && Math.abs(o.z - playerZ) < 40 && s.playerY < 2) {
      if (!s.abilityActive || s.character.ability !== 'speed_warp') {
        const dmg = Math.min(10, Math.round(10 * wc.mistakePenalty));
        s.health = Math.max(0, s.health - dmg);
        s.comboCount = 0;
        s.comboMultiplier = 1;
        s.latencyBudget = Math.max(0, s.latencyBudget - 5 * wc.mistakePenalty);
        s.routingMistakes++;
        s.audioEvents.hit = true;
        return { ...o, hit: true };
      }
    }
    return o;
  });

  // Pickup collection
  s.pickups = s.pickups.map(p => {
    if (!p.collected && p.lane === s.currentLane && Math.abs(p.z - playerZ) < 40) {
      s.audioEvents.pickup = true;
      s.pickupsCollected++;
      if (p.type === 'relay') {
        s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + 20);
        s.comboCount++;
        s.relaysUsed++;
        s.score += 50 * s.comboMultiplier;
      } else if (p.type === 'time') {
        s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + TIME_PICKUP_REFILL);
      } else if (p.type === 'repair') {
        s.health = Math.min(s.maxHealth, s.health + REPAIR_PICKUP_HULL);
      } else {
        s.score += 100 * s.comboMultiplier;
      }
      return { ...p, collected: true };
    }
    return p;
  });

  // Ability management
  if (s.abilityActive) {
    s.abilityDurationTimer -= dt * 1000;
    if (s.abilityDurationTimer <= 0) {
      s.abilityActive = false;
    }
  }
  if (s.abilityCooldownTimer > 0) {
    s.abilityCooldownTimer -= dt * 1000;
  }

  // Level-up display countdown
  if (s.levelUpDisplay > 0) {
    s.levelUpDisplay = Math.max(0, s.levelUpDisplay - dt);
  }

  // Level progression
  const newLevel = Math.floor(s.distance / LEVEL_DISTANCE) + 1;
  if (newLevel > s.level) {
    s.level = newLevel;

    // Victory at level 50
    if (s.level >= 50) {
      s.gameOver = true;
      s.running = false;
      s.bestCombo = Math.max(s.bestCombo, s.comboMultiplier);
      s.failureCause = '__VICTORY__';
      s.levelUpDisplay = 0;
      s.audioEvents.levelUp = true;
      return s;
    }

    // World mapping: 1-12=W0, 13-25=W1, 26-32=W2, 33-39=W3, 40+=W4
    let newWorld = 0;
    if (s.level >= 40) newWorld = 4;
    else if (s.level >= 33) newWorld = 3;
    else if (s.level >= 26) newWorld = 2;
    else if (s.level >= 13) newWorld = 1;

    // Boss level detection
    s.isBossLevel = BOSS_LEVELS.includes(s.level);

    if (newWorld !== s.world) {
      s.world = newWorld;
      s.worldConfig = WORLDS[newWorld];
      s.speed = WORLDS[newWorld].baseSpeed;
    }
    s.speed += 0.3;
    s.levelUpDisplay = 2.5;
    s.levelUpName = s.isBossLevel ? 'Boss wave' : s.worldConfig.name;
    s.audioEvents.levelUp = true;
  }

  // Game over conditions
  if (s.health <= 0 || s.latencyBudget <= 0) {
    s.gameOver = true;
    s.running = false;
    s.bestCombo = Math.max(s.bestCombo, s.comboMultiplier);
    // Dynamic failure cause
    const worldNames = WORLDS.map(w => w.name);
    const stageCauses: Record<string, string[]> = {
      'Congestion Zone': ['Network Saturation', 'Congestion Overload'],
      'Fragmented Grid': ['Grid Collapse', 'Fragmentation Storm'],
      'Mesh Awakening': ['Relay Chain Break', 'Mesh Link Failure'],
      'Anchor Yards': ['Stability Field Lost', 'Platform Misplaced'],
      'Clear Channel': ['Over-Acceleration Fault', 'Precision Routing Failure'],
    };
    if (s.health <= 0) {
      const causes = ['Packet Integrity Compromised', 'Congestion Collision', 'Signal Fragmentation Impact'];
      s.failureCause = causes[Math.floor(Math.random() * causes.length)];
    } else {
      const causes = ['Latency Budget Exhausted', 'Latency Spike Detected', 'Relay Missed Window'];
      s.failureCause = causes[Math.floor(Math.random() * causes.length)];
    }
    // Override with stage-specific cause sometimes
    const wName = worldNames[s.world] || 'Congestion Zone';
    if (Math.random() < 0.4 && stageCauses[wName]) {
      const sc = stageCauses[wName];
      s.failureCause = sc[Math.floor(Math.random() * sc.length)];
    }
    s.audioEvents.gameOver = true;
  }

  s.comboMultiplier = 1 + Math.min(s.comboCount * 0.1, wc.comboMultiplierCap);

  return s;
}

export function switchLane(state: GameState, direction: -1 | 1): GameState {
  const newLane = Math.max(0, Math.min(2, state.targetLane + direction));
  if (newLane === state.targetLane) return state;
  return { ...state, targetLane: newLane, laneChangeProgress: 0 };
}

export function jump(state: GameState): GameState {
  if (state.isJumping) return state;
  return { ...state, isJumping: true, playerVelocityY: state.character.jumpVelocity ?? DEFAULT_JUMP_VELOCITY, playerY: 0.1 };
}

export function activateAbility(state: GameState): GameState {
  if (state.abilityActive || state.abilityCooldownTimer > 0) return state;
  const s = { ...state, abilityActive: true, abilityDurationTimer: state.character.abilityDuration, abilityCooldownTimer: state.character.abilityCooldown };
  
  if (s.character.ability === 'speed_warp') {
    // Double pace is applied in updateGame; here it just refills the budget
    s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + OVERDRIVE_REFILL);
  } else if (s.character.ability === 'relay_chain') {
    s.distance += 200;
    s.score += 200;
    s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + 30);
  } else if (s.character.ability === 'node_deploy') {
    s.lanes = s.lanes.map(() => ({ state: 'fast' as const, timer: 0 })) as GameState['lanes'];
    s.platformsDeployed++;
    s.floatingTexts = [...s.floatingTexts, {
      text: 'Lane stable +1', x: 0.5, y: 0.5, life: 1.5, color: '#4cc38a',
    }];
  }
  
  return s;
}
