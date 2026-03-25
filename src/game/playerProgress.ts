// Persistent player progress stored in localStorage

export interface PlayerProgress {
  discordUsername: string;
  totalRuns: number;
  highestLevel: number;
  highScore: number;
  bestCombo: number;
  trialUsed: boolean;
  optimumLayerUnlocked: boolean;
}

const STORAGE_KEY = 'latency-escape-progress';

const DEFAULT_PROGRESS: PlayerProgress = {
  discordUsername: '',
  totalRuns: 0,
  highestLevel: 0,
  highScore: 0,
  bestCombo: 0,
  trialUsed: false,
  optimumLayerUnlocked: false,
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
  p.highestLevel = Math.max(p.highestLevel, level);
  if (score !== undefined) p.highScore = Math.max(p.highScore, score);
  if (combo !== undefined) p.bestCombo = Math.max(p.bestCombo, combo);
  if (level >= 40) p.optimumLayerUnlocked = true;
  saveProgress(p);
  return p;
}

export function markTrialUsed(): void {
  const p = loadProgress();
  p.trialUsed = true;
  saveProgress(p);
}

export function setDiscordUsername(username: string): void {
  const p = loadProgress();
  p.discordUsername = username;
  saveProgress(p);
}

export function checkOptimumTrialEligibility(progress: PlayerProgress): boolean {
  if (progress.trialUsed) return false;
  if (progress.optimumLayerUnlocked) return false;
  // Condition 1: reached level 10
  if (progress.highestLevel >= 10) return true;
  // Condition 2: failed 5 total runs
  if (progress.totalRuns >= 5) return true;
  return false;
}
