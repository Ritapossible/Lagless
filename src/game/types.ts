// Core game types

export type LaneState = 'fast' | 'congested' | 'collapsing' | 'relay';

export interface Lane {
  state: LaneState;
  timer: number; // for collapsing lanes
}

export interface Obstacle {
  lane: number; // 0, 1, 2
  z: number; // distance from player
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
}

export interface GameState {
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  currentLane: number; // 0, 1, 2
  targetLane: number;
  playerY: number; // for jumping
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
  laneChangeProgress: number; // 0-1 interpolation
  frameCount: number;
  streakTimer: number;
  levelUpDisplay: number; // countdown timer for level-up banner (seconds)
  levelUpName: string; // world name to display
}

export const WORLDS: WorldConfig[] = [
  { name: 'Congestion Zone', baseSpeed: 4, obstacleDensity: 0.04, laneDisableChance: 0, relayFrequency: 0.01, stabilityZones: false, bgHue: 200 },
  { name: 'Fragmented Grid', baseSpeed: 5, obstacleDensity: 0.03, laneDisableChance: 0.005, relayFrequency: 0.015, stabilityZones: false, bgHue: 270 },
  { name: 'Mesh Awakening', baseSpeed: 5.5, obstacleDensity: 0.025, laneDisableChance: 0.002, relayFrequency: 0.04, stabilityZones: false, bgHue: 180 },
  { name: 'FlexNode Dominion', baseSpeed: 6, obstacleDensity: 0.03, laneDisableChance: 0.001, relayFrequency: 0.02, stabilityZones: true, bgHue: 160 },
  { name: 'Optimum Layer', baseSpeed: 8, obstacleDensity: 0.015, laneDisableChance: 0, relayFrequency: 0.01, stabilityZones: false, bgHue: 220 },
];

export const CHARACTERS: Character[] = [
  { name: 'Warp Runner', ability: 'speed_warp', abilityDuration: 3000, abilityCooldown: 10000 },
  { name: 'Relay Master', ability: 'relay_chain', abilityDuration: 2000, abilityCooldown: 12000 },
  { name: 'Node Engineer', ability: 'node_deploy', abilityDuration: 4000, abilityCooldown: 15000 },
];
