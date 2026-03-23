import { GameState, Obstacle, Pickup, WORLDS, CHARACTERS, LaneState } from './types';

const BOSS_LEVELS = [25, 39];

export function createInitialState(character?: import('./types').Character): GameState {
  const worldConfig = WORLDS[0];
  return {
    running: false,
    paused: false,
    gameOver: false,
    currentLane: 1,
    targetLane: 1,
    playerY: 0,
    playerVelocityY: 0,
    isJumping: false,
    speed: worldConfig.baseSpeed,
    distance: 0,
    score: 0,
    health: 50,
    maxHealth: 50,
    latencyBudget: 100,
    maxLatency: 100,
    comboCount: 0,
    comboMultiplier: 1,
    level: 1,
    world: 0,
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
    flexNodesDeployed: 0,
    routingMistakes: 0,
    bestCombo: 0,
    failureCause: '',
    audioEvents: { hit: false, pickup: false, levelUp: false, gameOver: false },
  };
}

export function updateGame(state: GameState, dt: number): GameState {
  if (!state.running || state.paused || state.gameOver) return state;

  const s = { ...state };
  const wc = s.worldConfig;
  s.audioEvents = { hit: false, pickup: false, levelUp: false, gameOver: false };
  s.frameCount++;
  s.distance += s.speed * dt;
  
  // Score from survival
  s.score += s.speed * dt * s.comboMultiplier * 0.5;

  // Lane interpolation
  if (s.currentLane !== s.targetLane) {
    s.laneChangeProgress += dt * 8;
    if (s.laneChangeProgress >= 1) {
      s.currentLane = s.targetLane;
      s.laneChangeProgress = 1;
    }
  }

  // Jump physics
  if (s.isJumping) {
    s.playerY += s.playerVelocityY * dt;
    s.playerVelocityY -= 25 * dt;
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
  // Stability zones (FlexNode Dominion)
  if (wc.stabilityZones && currentLaneState === 'fast') {
    drainRate *= 0.5;
  }
  s.latencyBudget = Math.max(0, s.latencyBudget - drainRate * dt);

  // Relay boost refill — stage-specific rate
  if (currentLaneState === 'relay') {
    s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + wc.relayRefillRate * dt);
    s.comboCount++;
    s.comboMultiplier = 1 + Math.min(s.comboCount * 0.1, wc.comboMultiplierCap);
  }

  // Spawn obstacles — boss levels spike density
  const obsDensity = wc.obstacleDensity * bossMulti;
  if (Math.random() < obsDensity) {
    const lane = Math.floor(Math.random() * 3);
    s.obstacles = [...s.obstacles, {
      lane,
      z: 800,
      type: ['spam', 'storm', 'failure'][Math.floor(Math.random() * 3)] as Obstacle['type'],
      width: 40,
      height: 40,
      hit: false,
    }];
  }

  // Spawn pickups
  if (Math.random() < wc.relayFrequency) {
    const lane = Math.floor(Math.random() * 3);
    s.pickups = [...s.pickups, {
      lane,
      z: 800,
      type: ['relay', 'health', 'score'][Math.floor(Math.random() * 3)] as Pickup['type'],
      collected: false,
    }];
  }

  // Update lane states — stage-specific congestion/disable chance
  s.lanes = s.lanes.map((lane) => {
    const l = { ...lane };
    // Congested lane chance per stage
    if (Math.random() < (wc.congestedLaneChance * bossMulti)) {
      const states: LaneState[] = ['fast', 'congested', 'relay'];
      // Weighted: more congested in Stage 1, more relay in Stage 3
      const roll = Math.random();
      if (wc.laneDisableChance > 0 && Math.random() < wc.laneDisableChance * 10) {
        l.state = 'collapsing';
        l.timer = 3;
      } else if (roll < 0.4) {
        l.state = 'congested';
      } else if (roll < 0.4 + wc.relayFrequency * 5) {
        l.state = 'relay';
      } else {
        l.state = 'fast';
      }
    }
    if (l.state === 'collapsing') {
      l.timer -= dt;
      if (l.timer <= 0) l.state = 'fast';
    }
    return l;
  }) as [typeof s.lanes[0], typeof s.lanes[0], typeof s.lanes[0]];

  // Move obstacles and pickups
  s.obstacles = s.obstacles
    .map(o => ({ ...o, z: o.z - s.speed * 60 * dt }))
    .filter(o => o.z > -100);

  s.pickups = s.pickups
    .map(p => ({ ...p, z: p.z - s.speed * 60 * dt }))
    .filter(p => p.z > -100);

  // Collision detection — stage-specific damage
  const playerZ = 50;
  s.obstacles = s.obstacles.map(o => {
    if (!o.hit && o.lane === s.currentLane && Math.abs(o.z - playerZ) < 40 && s.playerY < 2) {
      if (!s.abilityActive || s.character.ability !== 'speed_warp') {
        const dmg = Math.round(10 * wc.mistakePenalty);
        s.health = Math.max(0, s.health - dmg);
        s.comboCount = 0;
        s.comboMultiplier = 1;
        s.latencyBudget = Math.max(0, s.latencyBudget - 5 * wc.mistakePenalty);
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
      if (p.type === 'relay') {
        s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + 20);
        s.comboCount++;
        s.score += 50 * s.comboMultiplier;
      } else if (p.type === 'health') {
        s.health = Math.min(s.maxHealth, s.health + 10);
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
      if (s.character.ability === 'speed_warp') {
        s.speed = wc.baseSpeed;
      }
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
  const newLevel = Math.floor(s.distance / 500) + 1;
  if (newLevel > s.level) {
    s.level = newLevel;
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
    s.levelUpName = s.isBossLevel ? `⚠ BOSS WAVE ⚠` : s.worldConfig.name;
    s.audioEvents.levelUp = true;
  }

  // Game over conditions
  if (s.health <= 0 || s.latencyBudget <= 0) {
    s.gameOver = true;
    s.running = false;
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
  return { ...state, isJumping: true, playerVelocityY: 12, playerY: 0.1 };
}

export function activateAbility(state: GameState): GameState {
  if (state.abilityActive || state.abilityCooldownTimer > 0) return state;
  const s = { ...state, abilityActive: true, abilityDurationTimer: state.character.abilityDuration, abilityCooldownTimer: state.character.abilityCooldown };
  
  if (s.character.ability === 'speed_warp') {
    s.speed = s.worldConfig.baseSpeed * 2;
  } else if (s.character.ability === 'relay_chain') {
    s.distance += 200;
    s.score += 200;
    s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + 30);
  } else if (s.character.ability === 'node_deploy') {
    s.lanes = s.lanes.map(() => ({ state: 'fast' as const, timer: 0 })) as GameState['lanes'];
  }
  
  return s;
}
