// Persistent player progress stored in localStorage

export interface PlayerProgress {
  discordUsername: string;
  totalRuns: number;
  highestLevel: number;
  highScore: number;
  bestCombo: number;
  trialUsed: boolean;
  trialsUsed: number;
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
  p.highestLevel = Math.max(p.highestLevel, level);
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
  saveProgress(p);
}

export function setDiscordUsername(username: string): void {
  const p = loadProgress();
  p.discordUsername = username;
  saveProgress(p);
}

export function checkOptimumTrialEligibility(progress: PlayerProgress): boolean {
  if (progress.optimumLayerUnlocked) return false;
  // Count how many conditions the player has met
  let conditionsMet = 0;
  // Condition 1: reached level 10
  if (progress.highestLevel >= 10) conditionsMet++;
  // Condition 2: failed 5 total runs
  if (progress.totalRuns >= 5) conditionsMet++;
  // Allow one trial per condition met
  return conditionsMet > progress.trialsUsed;
}

// Resume Node calculation
export function calculateResumeNode(level: number): number {
  if (level >= 40) return level; // Optimum Layer: retry from failed level
  if (level >= 20) {
    // Every 2 levels: 20, 22, 24, ...
    return Math.floor(level / 2) * 2;
  }
  if (level >= 10) {
    // Resume nodes at 12, 15, 18
    const resumeNodes = [12, 15, 18];
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
