// Daily Missions system — resets every 24 hours

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
}

export interface MissionProgress {
  current: number;
  completed: boolean;
}

export interface DailyMissionsState {
  date: string; // YYYY-MM-DD
  missions: Record<string, MissionProgress>;
  allCompleted: boolean;
  rewardClaimed: boolean;
}

// The 4 fixed daily missions
export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: 'latency_above_60',
    title: 'Signal Stability',
    description: 'Maintain latency above 60% for 20 seconds total',
    icon: '📡',
    target: 20, // 20 seconds
  },
  {
    id: 'correct_routing',
    title: 'Precision Router',
    description: 'Make 10 correct routing decisions (collect pickups)',
    icon: '🎯',
    target: 10,
  },
  {
    id: 'use_relays',
    title: 'Relay Operator',
    description: 'Use 5 relay nodes in a single run',
    icon: '⚡',
    target: 5,
  },
  {
    id: 'deploy_flexnodes',
    title: 'Node Engineer',
    description: 'Deploy 3 FlexNodes in a single run',
    icon: '🛠',
    target: 3,
  },
];

const STORAGE_KEY = 'latency-escape-daily-missions';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(): DailyMissionsState {
  const missions: Record<string, MissionProgress> = {};
  for (const m of DAILY_MISSIONS) {
    missions[m.id] = { current: 0, completed: false };
  }
  return {
    date: getTodayKey(),
    missions,
    allCompleted: false,
    rewardClaimed: false,
  };
}

export function loadDailyMissions(): DailyMissionsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw) as DailyMissionsState;
    // Reset if it's a new day
    if (saved.date !== getTodayKey()) {
      return defaultState();
    }
    // Ensure all mission keys exist
    for (const m of DAILY_MISSIONS) {
      if (!saved.missions[m.id]) {
        saved.missions[m.id] = { current: 0, completed: false };
      }
    }
    return saved;
  } catch {
    return defaultState();
  }
}

export function saveDailyMissions(state: DailyMissionsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Per-run tracking stats (accumulated during a single run)
export interface RunMissionStats {
  latencyAbove60Seconds: number; // seconds spent above 60% latency
  pickupsCollected: number;      // correct routing decisions
  relaysUsed: number;
  flexNodesDeployed: number;
}

export function createRunMissionStats(): RunMissionStats {
  return {
    latencyAbove60Seconds: 0,
    pickupsCollected: 0,
    relaysUsed: 0,
    flexNodesDeployed: 0,
  };
}

// Called at end of run to update daily mission progress
export function updateDailyMissionsAfterRun(stats: RunMissionStats): DailyMissionsState {
  const state = loadDailyMissions();

  // Mission 1: latency above 60% for 20s total (cumulative across runs in a day)
  if (!state.missions.latency_above_60.completed) {
    state.missions.latency_above_60.current += stats.latencyAbove60Seconds;
    if (state.missions.latency_above_60.current >= 20) {
      state.missions.latency_above_60.completed = true;
      state.missions.latency_above_60.current = 20;
    }
  }

  // Mission 2: 10 correct routing decisions (cumulative across runs)
  if (!state.missions.correct_routing.completed) {
    state.missions.correct_routing.current += stats.pickupsCollected;
    if (state.missions.correct_routing.current >= 10) {
      state.missions.correct_routing.completed = true;
      state.missions.correct_routing.current = 10;
    }
  }

  // Mission 3: Use 5 relay nodes (best single run)
  if (!state.missions.use_relays.completed) {
    state.missions.use_relays.current = Math.max(state.missions.use_relays.current, stats.relaysUsed);
    if (state.missions.use_relays.current >= 5) {
      state.missions.use_relays.completed = true;
      state.missions.use_relays.current = 5;
    }
  }

  // Mission 4: Deploy 3 FlexNodes (best single run)
  if (!state.missions.deploy_flexnodes.completed) {
    state.missions.deploy_flexnodes.current = Math.max(state.missions.deploy_flexnodes.current, stats.flexNodesDeployed);
    if (state.missions.deploy_flexnodes.current >= 3) {
      state.missions.deploy_flexnodes.completed = true;
      state.missions.deploy_flexnodes.current = 3;
    }
  }

  // Check if all completed
  state.allCompleted = DAILY_MISSIONS.every(m => state.missions[m.id].completed);

  saveDailyMissions(state);
  return state;
}

// Claim the daily reward (Optimum Layer trial)
export function claimDailyReward(): DailyMissionsState {
  const state = loadDailyMissions();
  state.rewardClaimed = true;
  saveDailyMissions(state);
  return state;
}

// Check if daily mission reward is available (all complete, not yet claimed)
export function isDailyRewardAvailable(): boolean {
  const state = loadDailyMissions();
  return state.allCompleted && !state.rewardClaimed;
}
