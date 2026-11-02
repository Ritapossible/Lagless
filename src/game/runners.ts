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
    abilityText: 'Double speed, pass through hazards and refill 25 ms of latency',
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
  lift_off: {
    craft: 'Road car that flies: its jump goes higher and lasts longer',
    abilityName: 'Lift-off',
    abilityText: 'Fly above every lane for 3 s, clear of all hazards',
  },
};
