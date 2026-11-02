// Persistent player progress stored in localStorage
import { isDailyRewardAvailable, claimDailyReward } from './dailyMissions';

/** A trial is a short preview of Clear Channel, the final world, to show players where they are heading */
export const TRIAL_SECONDS = 120;

export interface PlayerProgress {
  username: string;
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
  finalWorldUnlocked: boolean;
  lastResumeNodeLevel: number;
  timesCompleted: number;
  /** Set when the daily-mission trial is claimed, cleared when that trial starts: one claim, one trial */
  pendingTrial: boolean;
}

const STORAGE_KEY = 'latency-escape-progress';

const DEFAULT_PROGRESS: PlayerProgress = {
  username: '',
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
  finalWorldUnlocked: false,
  lastResumeNodeLevel: 0,
  timesCompleted: 0,
  pendingTrial: false,
};

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const saved = JSON.parse(raw);
    // Saves from before the rename used optimumLayerUnlocked
    if (saved.finalWorldUnlocked === undefined && saved.optimumLayerUnlocked !== undefined) {
      saved.finalWorldUnlocked = saved.optimumLayerUnlocked;
    }
    delete saved.optimumLayerUnlocked;
    // ...and discordUsername before names stopped being tied to Discord
    if (saved.username === undefined && typeof saved.discordUsername === 'string') {
      saved.username = saved.discordUsername;
    }
    delete saved.discordUsername;
    return { ...DEFAULT_PROGRESS, ...saved };
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
  if (level >= 40) p.finalWorldUnlocked = true;
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

export function setUsername(username: string): void {
  const p = loadProgress();
  p.username = username;
  saveProgress(p);
}

export function checkTrialEligibility(progress: PlayerProgress): boolean {
  return countEligibleTrials(progress) > 0;
}

export function countEligibleTrials(progress: PlayerProgress): number {
  if (progress.finalWorldUnlocked) return 0;
  const used = progress.trialConditionUsed || { failed5: false, reachedLv10: false, dailyMission: false };
  let count = 0;
  if (progress.totalRuns >= 5 && !used.failed5) count++;
  if (progress.highestLevel >= 10 && !used.reachedLv10) count++;
  // Condition 3: daily mission completed and reward claimed
  if (isDailyRewardAvailable() && !used.dailyMission) count++;
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
  } else if (isDailyRewardAvailable() && !used.dailyMission) {
    used.dailyMission = true;
    claimDailyReward();
  }
  p.trialConditionUsed = used;
  p.trialsUsed = (p.trialsUsed || 0) + 1;
  saveProgress(p);
}

// Called when player reaches Level 50 (victory) — resets progress for a fresh run
export function completeGame(score: number, combo: number): PlayerProgress {
  const p = loadProgress();
  p.timesCompleted = (p.timesCompleted || 0) + 1;
  p.totalRuns++;
  p.highScore = Math.max(p.highScore, score);
  p.bestCombo = Math.max(p.bestCombo, combo);
  // Reset resume node and trial conditions for fresh playthrough
  p.lastResumeNodeLevel = 0;
  p.trialConditionUsed = { failed5: false, reachedLv10: false, dailyMission: false };
  p.trialsUsed = 0;
  p.trialUsed = false;
  // Keep the final world unlocked since they've beaten the game
  saveProgress(p);
  return p;
}

// Resume Node calculation
// Daily missions reward: spend today's reward on one trial. Returns false if there is nothing to claim.
export function claimDailyTrial(): boolean {
  if (!isDailyRewardAvailable()) return false;
  claimDailyReward();
  const p = loadProgress();
  p.trialConditionUsed = { ...p.trialConditionUsed, dailyMission: true };
  p.trialsUsed = (p.trialsUsed || 0) + 1;
  p.pendingTrial = true;
  saveProgress(p);
  return true;
}

export function clearPendingTrial(): void {
  const p = loadProgress();
  p.pendingTrial = false;
  saveProgress(p);
}

// Where Retry starts: the checkpoint this run passed, if any, otherwise where the run began.
// From level 10 a run never sends the player back to level 1.
export function retryLevel(levelReached: number, startLevel: number): number {
  return Math.min(Math.max(startLevel, calculateResumeNode(levelReached)), 49);
}

export function calculateResumeNode(level: number): number {
  if (level >= 50) return 49; // Game ends at 50, max resume is 49
  if (level >= 40) return level; // Clear Channel: retry from failed level
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
