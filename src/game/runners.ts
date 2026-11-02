// Player-facing copy for each runner, keyed by ability
import { AbilityType } from './types';

export interface RunnerInfo {
  craft: string;
  abilityName: string;
  abilityText: string;
}

export const RUNNER_INFO: Record<AbilityType, RunnerInfo> = {
  speed_warp: {
    craft: 'Slim racer, quickest off the line',
    abilityName: 'Overdrive',
    abilityText: 'Double speed and pass straight through hazards',
  },
  relay_chain: {
    craft: 'Twin-pod relay courier',
    abilityName: 'Hop',
    abilityText: 'Jump 200 m ahead and refill 30 ms of latency',
  },
  node_deploy: {
    craft: 'Heavy hauler with a platform rig',
    abilityName: 'Clear lanes',
    abilityText: 'Turn every lane back to a fast lane',
  },
};
