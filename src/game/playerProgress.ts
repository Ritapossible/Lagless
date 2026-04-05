// Persistent player progress stored in localStorage
import { isDailyRewardAvailable } from './dailyMissions';

export interface PlayerProgress {
  discordUsername: string;
  totalRuns: number;
  highestLevel: number;
  highScore: number;
  bestCombo: number;
  trialUsed: boolean;
  trialsUsed: number;
  trialConditionUsed: {
    failed5: boolean;
    reachedLv10: boolean;
    dailyMission: boolean;
  };
  optimumLayerUnlocked: boolean;
  lastResumeNodeLevel: number;
}

const STORAGE_KEY = 'latency-escape-progress';

const DEFAULT_PROGRESS: PlayerProgress = {
  discordUsername: '',
  totalRuns: 0,
  highestLevel: 0,
  highScore: 0,
  bestCombo: 0,
  trialUsed: false,
  trialsUsed: 0,
  trialConditionUsed: {
    failed5: false,
    reachedLv10: false,
    dailyMission: false,
  },
  optimumLayerUnlocked: false,
  lastResumeNodeLevel: 0,
};

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: PlayerProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function updateAfterRun(level: number, score?: number, combo?: number): PlayerProgress {
  const p = loadProgress();
  p.totalRuns++;
  const cappedLevel = Math.min(level, 50);
  p.highestLevel = Math.max(p.highestLevel, cappedLevel);
  if (score !== undefined) p.highScore = Math.max(p.highScore, score);
  if (combo !== undefined) p.bestCombo = Math.max(p.bestCombo, combo);
  if (level >= 40) p.optimumLayerUnlocked = true;
  // Also update resume node
  const resumeNode = calculateResumeNode(level);
  if (resumeNode > p.lastResumeNodeLevel) {
    p.lastResumeNodeLevel = resumeNode;
  }
  saveProgress(p);
  return p;
}

export function markTrialUsed(): void {
  const p = loadProgress();
  p.trialUsed = true;
  p.trialsUsed = (p.trialsUsed || 0) + 1;
  saveProgress(p);
}

export function setDiscordUsername(username: string): void {
  const p = loadProgress();
  p.discordUsername = username;
  saveProgress(p);
}

export function checkOptimumTrialEligibility(progress: PlayerProgress): boolean {
  return countEligibleTrials(progress) > 0;
}

export function countEligibleTrials(progress: PlayerProgress): number {
  if (progress.optimumLayerUnlocked) return 0;
  const used = progress.trialConditionUsed || { failed5: false, reachedLv10: false, dailyMission: false };
  let count = 0;
  if (progress.totalRuns >= 5 && !used.failed5) count++;
  if (progress.highestLevel >= 10 && !used.reachedLv10) count++;
  // Condition 3: daily mission (not yet implemented)
  return count;
}

export function markTrialConditionUsed(): void {
  const p = loadProgress();
  const used = p.trialConditionUsed || { failed5: false, reachedLv10: false, dailyMission: false };
  // Mark the first eligible condition as used
  if (p.totalRuns >= 5 && !used.failed5) {
    used.failed5 = true;
  } else if (p.highestLevel >= 10 && !used.reachedLv10) {
    used.reachedLv10 = true;
  }
  p.trialConditionUsed = used;
  p.trialsUsed = (p.trialsUsed || 0) + 1;
  saveProgress(p);
}

// Resume Node calculation
export function calculateResumeNode(level: number): number {
  if (level >= 50) return 49; // Game ends at 50, max resume is 49
  if (level >= 40) return level; // Optimum Layer: retry from failed level
  if (level >= 20) {
    // Every 2 levels: 20, 22, 24, ...
    return Math.floor(level / 2) * 2;
  }
  if (level >= 10) {
    // Resume nodes at 12, 15, 18
    const resumeNodes = [10, 12, 15, 18];
    let best = 0;
    for (const node of resumeNodes) {
      if (level >= node) best = node;
    }
    return best;
  }
  return 0; // Levels 1-9: no resume
}

export function updateResumeNode(level: number): PlayerProgress {
  const p = loadProgress();
  p.highestLevel = Math.max(p.highestLevel, level);
  const resumeNode = calculateResumeNode(level);
  if (resumeNode > p.lastResumeNodeLevel) {
    p.lastResumeNodeLevel = resumeNode;
  }
  saveProgress(p);
  return p;
}
