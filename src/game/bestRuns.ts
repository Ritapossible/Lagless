// Best runs: the top scores on this device, stored in localStorage

export interface RunRecord {
  score: number;
  level: number;
  world: string;
  character: string;
  bestCombo: number;
  victory: boolean;
  date: string; // ISO timestamp
}

// Key kept from when this was called the leaderboard, so saved runs survive
const STORAGE_KEY = 'lagless-leaderboard';
export const BEST_RUNS_SIZE = 10;

export function loadTopRuns(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Adds a run and keeps the top runs by score. Returns its rank (1-based), or 0 if it didn't place.
export function recordRun(run: RunRecord): number {
  const entry = { ...run, score: Math.floor(run.score) };
  const runs = [...loadTopRuns(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, BEST_RUNS_SIZE);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    return 0;
  }
  return runs.indexOf(entry) + 1;
}
