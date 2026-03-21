import { GameState, Obstacle, Pickup, WORLDS, CHARACTERS, LaneState } from './types';

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
    audioEvents: { hit: false, pickup: false, levelUp: false, gameOver: false },
  };
}

export function updateGame(state: GameState, dt: number): GameState {
  if (!state.running || state.paused || state.gameOver) return state;

  const s = { ...state };
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

  // Latency drain
  const currentLaneState = s.lanes[s.currentLane].state;
  let drainRate = 3;
  if (currentLaneState === 'congested') drainRate = 8;
  if (currentLaneState === 'fast') {
    s.streakTimer += dt;
    if (s.streakTimer > 2) drainRate = 1.5; // optimized streak
  } else {
    s.streakTimer = 0;
  }
  s.latencyBudget = Math.max(0, s.latencyBudget - drainRate * dt);

  // Relay boost refill
  if (currentLaneState === 'relay') {
    s.latencyBudget = Math.min(s.maxLatency, s.latencyBudget + 15 * dt);
    s.comboCount++;
    s.comboMultiplier = 1 + Math.min(s.comboCount * 0.1, 3);
  }

  // Spawn obstacles
  if (Math.random() < s.worldConfig.obstacleDensity) {
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
  if (Math.random() < s.worldConfig.relayFrequency) {
    const lane = Math.floor(Math.random() * 3);
    s.pickups = [...s.pickups, {
      lane,
      z: 800,
      type: ['relay', 'health', 'score'][Math.floor(Math.random() * 3)] as Pickup['type'],
      collected: false,
    }];
  }

  // Update lane states
  s.lanes = s.lanes.map((lane, i) => {
    const l = { ...lane };
    if (Math.random() < 0.002) {
      const states: LaneState[] = ['fast', 'congested', 'relay'];
      if (s.worldConfig.laneDisableChance > 0 && Math.random() < s.worldConfig.laneDisableChance * 10) {
        states.push('collapsing');
      }
      l.state = states[Math.floor(Math.random() * states.length)];
      l.timer = l.state === 'collapsing' ? 3 : 0;
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

  // Collision detection
  const playerZ = 50;
  s.obstacles = s.obstacles.map(o => {
    if (!o.hit && o.lane === s.currentLane && Math.abs(o.z - playerZ) < 40 && s.playerY < 2) {
      if (!s.abilityActive || s.character.ability !== 'speed_warp') {
        s.health = Math.max(0, s.health - 10);
        s.comboCount = 0;
        s.comboMultiplier = 1;
        s.latencyBudget = Math.max(0, s.latencyBudget - 5);
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
        s.speed = s.worldConfig.baseSpeed;
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
    const newWorld = Math.min(Math.floor((s.level - 1) / 3), WORLDS.length - 1);
    if (newWorld !== s.world) {
      s.world = newWorld;
      s.worldConfig = WORLDS[newWorld];
      s.speed = s.worldConfig.baseSpeed;
    }
    s.speed += 0.3;
    s.levelUpDisplay = 2.5;
    s.levelUpName = s.worldConfig.name;
    s.audioEvents.levelUp = true;
  }

  // Game over conditions
  if (s.health <= 0 || s.latencyBudget <= 0) {
    s.gameOver = true;
    s.running = false;
    s.audioEvents.gameOver = true;
  }

  s.comboMultiplier = 1 + Math.min(s.comboCount * 0.1, 3);

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
