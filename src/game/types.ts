// Core game types

export type LaneState = 'fast' | 'congested' | 'collapsing' | 'relay';

export interface Lane {
  state: LaneState;
  timer: number;
}

export interface Obstacle {
  lane: number;
  z: number;
  type: 'spam' | 'storm' | 'failure';
  width: number;
  height: number;
  hit: boolean;
}

export interface Pickup {
  lane: number;
  z: number;
  type: 'relay' | 'health' | 'score';
  collected: boolean;
}

export type AbilityType = 'speed_warp' | 'relay_chain' | 'node_deploy';

export interface FloatingText {
  text: string;
  x: number;   // 0-1 normalized screen position
  y: number;   // 0-1 normalized
  life: number; // seconds remaining
  color: string;
}

export interface Character {
  name: string;
  ability: AbilityType;
  abilityDuration: number;
  abilityCooldown: number;
}

export interface WorldConfig {
  name: string;
  baseSpeed: number;
  obstacleDensity: number;
  laneDisableChance: number;
  relayFrequency: number;
  stabilityZones: boolean;
  bgHue: number;
  // Stage-specific parameters
  latencyDrainRate: number;       // base drain multiplier (1 = normal)
  latencyDrainCongested: number;  // drain when on congested lane
  congestedLaneChance: number;    // how often lanes flip to congested
  relayRefillRate: number;        // how fast relay lanes refill latency
  comboMultiplierCap: number;     // max combo multiplier
  visualChaosLevel: number;       // 0-1, drives visual noise/glitch intensity
  mistakePenalty: number;         // damage multiplier on hits
  laneSpacing: number;            // visual lane width multiplier
}

export interface GameState {
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  currentLane: number;
  targetLane: number;
  playerY: number;
  playerVelocityY: number;
  isJumping: boolean;
  speed: number;
  distance: number;
  score: number;
  health: number;
  maxHealth: number;
  latencyBudget: number;
  maxLatency: number;
  comboCount: number;
  comboMultiplier: number;
  level: number;
  world: number;
  obstacles: Obstacle[];
  pickups: Pickup[];
  lanes: [Lane, Lane, Lane];
  abilityActive: boolean;
  abilityCooldownTimer: number;
  abilityDurationTimer: number;
  character: Character;
  worldConfig: WorldConfig;
  laneChangeProgress: number;
  frameCount: number;
  streakTimer: number;
  levelUpDisplay: number;
  levelUpName: string;
  isBossLevel: boolean;
  relaysUsed: number;
  flexNodesDeployed: number;
  routingMistakes: number;
  bestCombo: number;
  failureCause: string;
  floatingTexts: FloatingText[];
  audioEvents: {
    hit: boolean;
    pickup: boolean;
    levelUp: boolean;
    gameOver: boolean;
  };
}

export const WORLDS: WorldConfig[] = [
  // Stage 1: Congestion Zone (L1-12) — slow, dense, congested, narrow
  {
    name: 'Congestion Zone', baseSpeed: 3.5, obstacleDensity: 0.055, laneDisableChance: 0,
    relayFrequency: 0.008, stabilityZones: false, bgHue: 0,
    latencyDrainRate: 1.4, latencyDrainCongested: 10, congestedLaneChance: 0.006,
    relayRefillRate: 10, comboMultiplierCap: 2, visualChaosLevel: 0.7,
    mistakePenalty: 1, laneSpacing: 0.82,
  },
  // Stage 2: Fragmented Grid (L13-25) — glitchy, unpredictable, lanes disable
  {
    name: 'Fragmented Grid', baseSpeed: 5, obstacleDensity: 0.035, laneDisableChance: 0.008,
    relayFrequency: 0.015, stabilityZones: false, bgHue: 280,
    latencyDrainRate: 1.0, latencyDrainCongested: 8, congestedLaneChance: 0.004,
    relayRefillRate: 13, comboMultiplierCap: 2.5, visualChaosLevel: 0.85,
    mistakePenalty: 1.2, laneSpacing: 0.95,
  },
  // Stage 3: Mesh Awakening (L26-32) — relay-heavy, combo-friendly
  {
    name: 'Mesh Awakening', baseSpeed: 5.5, obstacleDensity: 0.022, laneDisableChance: 0.002,
    relayFrequency: 0.045, stabilityZones: false, bgHue: 160,
    latencyDrainRate: 0.8, latencyDrainCongested: 6, congestedLaneChance: 0.002,
    relayRefillRate: 20, comboMultiplierCap: 3.5, visualChaosLevel: 0.3,
    mistakePenalty: 1.3, laneSpacing: 1.0,
  },
  // Stage 4: FlexNode Dominion (L33-39) — stable, deployable nodes, high combo
  {
    name: 'FlexNode Dominion', baseSpeed: 6, obstacleDensity: 0.025, laneDisableChance: 0.001,
    relayFrequency: 0.02, stabilityZones: true, bgHue: 200,
    latencyDrainRate: 0.7, latencyDrainCongested: 5, congestedLaneChance: 0.001,
    relayRefillRate: 18, comboMultiplierCap: 4, visualChaosLevel: 0.15,
    mistakePenalty: 1.5, laneSpacing: 1.05,
  },
  // Stage 5: Optimum Layer (L40+) — ultra-fast, clean, skill-based
  {
    name: 'Optimum Layer', baseSpeed: 8, obstacleDensity: 0.012, laneDisableChance: 0,
    relayFrequency: 0.012, stabilityZones: false, bgHue: 190,
    latencyDrainRate: 0.5, latencyDrainCongested: 4, congestedLaneChance: 0.0005,
    relayRefillRate: 12, comboMultiplierCap: 5, visualChaosLevel: 0.0,
    mistakePenalty: 2.5, laneSpacing: 1.2,
  },
];

export const CHARACTERS: Character[] = [
  { name: 'Warp Runner', ability: 'speed_warp', abilityDuration: 3000, abilityCooldown: 10000 },
  { name: 'Relay Master', ability: 'relay_chain', abilityDuration: 2000, abilityCooldown: 12000 },
  { name: 'Node Engineer', ability: 'node_deploy', abilityDuration: 4000, abilityCooldown: 15000 },
];
