import { PlayerProgress } from './playerProgress';

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

const ACHIEVEMENTS: ((p: PlayerProgress) => Achievement | null)[] = [
  (p) => (p.timesCompleted || 0) >= 1 ? { id: "first_clear", emoji: "🏆", name: "First Sync", description: "Complete the game once" } : null,
  (p) => (p.timesCompleted || 0) >= 5 ? { id: "five_clears", emoji: "👑", name: "Network Veteran", description: "Complete the game 5 times" } : null,
  (p) => (p.timesCompleted || 0) >= 10 ? { id: "ten_clears", emoji: "💎", name: "Core Architect", description: "Complete the game 10 times" } : null,
  (p) => (p.highestLevel || 0) >= 10 ? { id: "reach_10", emoji: "📡", name: "Signal Found", description: "Reach Level 10" } : null,
  (p) => (p.highestLevel || 0) >= 25 ? { id: "reach_25", emoji: "⚡", name: "Grid Breaker", description: "Reach Level 25" } : null,
  (p) => (p.highestLevel || 0) >= 40 ? { id: "reach_40", emoji: "🛰️", name: "Optimum Access", description: "Reach Level 40" } : null,
  (p) => (p.highScore || 0) >= 10_000 ? { id: "score_10k", emoji: "🔥", name: "Data Surge", description: "Score 10,000+ points" } : null,
  (p) => (p.highScore || 0) >= 50_000 ? { id: "score_50k", emoji: "💫", name: "Bandwidth King", description: "Score 50,000+ points" } : null,
  (p) => (p.highScore || 0) >= 100_000 ? { id: "score_100k", emoji: "🌟", name: "Latency Legend", description: "Score 100,000+ points" } : null,
  (p) => (p.bestCombo || 0) >= 3 ? { id: "combo_3", emoji: "🎯", name: "Combo Starter", description: "Reach x3.0 combo" } : null,
  (p) => (p.bestCombo || 0) >= 5 ? { id: "combo_5", emoji: "💥", name: "Combo Master", description: "Reach x5.0 combo" } : null,
  (p) => (p.totalRuns || 0) >= 10 ? { id: "runs_10", emoji: "🔄", name: "Persistent", description: "Play 10 runs" } : null,
  (p) => (p.totalRuns || 0) >= 50 ? { id: "runs_50", emoji: "🏅", name: "Dedicated Router", description: "Play 50 runs" } : null,
];

export function getUnlockedIds(p: PlayerProgress): Set<string> {
  const set = new Set<string>();
  for (const check of ACHIEVEMENTS) {
    const a = check(p);
    if (a) set.add(a.id);
  }
  return set;
}

export function findNewAchievements(before: PlayerProgress, after: PlayerProgress): Achievement[] {
  const oldIds = getUnlockedIds(before);
  const newOnes: Achievement[] = [];
  for (const check of ACHIEVEMENTS) {
    const a = check(after);
    if (a && !oldIds.has(a.id)) {
      newOnes.push(a);
    }
  }
  return newOnes;
}
