import { PlayerProgress } from "@/game/playerProgress";
import { Check, Lock } from "lucide-react";

const ALL_ACHIEVEMENTS: { id: string; name: string; description: string; check: (p: PlayerProgress) => boolean }[] = [
  { id: "reach_10", name: "Signal Found", description: "Reach level 10", check: (p) => (p.highestLevel || 0) >= 10 },
  { id: "reach_25", name: "Grid Breaker", description: "Reach level 25", check: (p) => (p.highestLevel || 0) >= 25 },
  { id: "reach_40", name: "Clear Channel", description: "Reach level 40", check: (p) => (p.highestLevel || 0) >= 40 },
  { id: "first_clear", name: "First Sync", description: "Finish all 50 levels", check: (p) => (p.timesCompleted || 0) >= 1 },
  { id: "five_clears", name: "Network Veteran", description: "Finish the game 5 times", check: (p) => (p.timesCompleted || 0) >= 5 },
  { id: "ten_clears", name: "Core Architect", description: "Finish the game 10 times", check: (p) => (p.timesCompleted || 0) >= 10 },
  { id: "score_10k", name: "Data Surge", description: "Score 10,000 points", check: (p) => (p.highScore || 0) >= 10_000 },
  { id: "score_50k", name: "Bandwidth King", description: "Score 50,000 points", check: (p) => (p.highScore || 0) >= 50_000 },
  { id: "score_100k", name: "Latency Legend", description: "Score 100,000 points", check: (p) => (p.highScore || 0) >= 100_000 },
  { id: "combo_3", name: "Combo Starter", description: "Reach a x3.0 combo", check: (p) => (p.bestCombo || 0) >= 3 },
  { id: "combo_5", name: "Combo Master", description: "Reach a x5.0 combo", check: (p) => (p.bestCombo || 0) >= 5 },
  { id: "runs_10", name: "Persistent", description: "Fly 10 runs", check: (p) => (p.totalRuns || 0) >= 10 },
  { id: "runs_50", name: "Dedicated Router", description: "Fly 50 runs", check: (p) => (p.totalRuns || 0) >= 50 },
];

const AchievementBadges = ({ progress }: { progress: PlayerProgress }) => {
  const achievements = ALL_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.check(progress) }));
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm text-muted-foreground">Achievements</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{unlocked} of {achievements.length}</span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => (
          <li key={a.id} className="flex h-16 items-center gap-3 rounded-xl border border-border bg-card px-4">
            {a.unlocked
              ? <Check className="h-4 w-4 shrink-0 text-positive" strokeWidth={1.5} />
              : <Lock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />}
            <div className="min-w-0">
              <p className={`truncate text-sm ${a.unlocked ? "text-foreground" : "text-subtle"}`}>{a.name}</p>
              <p className="truncate text-xs text-muted-foreground">{a.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AchievementBadges;
