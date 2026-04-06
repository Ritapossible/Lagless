import { PlayerProgress } from "@/game/playerProgress";
import { Lock } from "lucide-react";

interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
}

function getAchievements(p: PlayerProgress): Achievement[] {
  const completed = p.timesCompleted || 0;
  const runs = p.totalRuns || 0;
  const score = p.highScore || 0;
  const combo = p.bestCombo || 0;
  const level = p.highestLevel || 0;

  return [
    // Completion milestones
    {
      id: "first_clear",
      emoji: "🏆",
      name: "First Sync",
      description: "Complete the game once",
      unlocked: completed >= 1,
    },
    {
      id: "five_clears",
      emoji: "👑",
      name: "Network Veteran",
      description: "Complete the game 5 times",
      unlocked: completed >= 5,
    },
    {
      id: "ten_clears",
      emoji: "💎",
      name: "Core Architect",
      description: "Complete the game 10 times",
      unlocked: completed >= 10,
    },
    // Level milestones
    {
      id: "reach_10",
      emoji: "📡",
      name: "Signal Found",
      description: "Reach Level 10",
      unlocked: level >= 10,
    },
    {
      id: "reach_25",
      emoji: "⚡",
      name: "Grid Breaker",
      description: "Reach Level 25",
      unlocked: level >= 25,
    },
    {
      id: "reach_40",
      emoji: "🛰️",
      name: "Optimum Access",
      description: "Reach Level 40",
      unlocked: level >= 40,
    },
    // Score milestones
    {
      id: "score_10k",
      emoji: "🔥",
      name: "Data Surge",
      description: "Score 10,000+ points",
      unlocked: score >= 10_000,
    },
    {
      id: "score_50k",
      emoji: "💫",
      name: "Bandwidth King",
      description: "Score 50,000+ points",
      unlocked: score >= 50_000,
    },
    {
      id: "score_100k",
      emoji: "🌟",
      name: "Latency Legend",
      description: "Score 100,000+ points",
      unlocked: score >= 100_000,
    },
    // Combo milestones
    {
      id: "combo_3",
      emoji: "🎯",
      name: "Combo Starter",
      description: "Reach x3.0 combo",
      unlocked: combo >= 3,
    },
    {
      id: "combo_5",
      emoji: "💥",
      name: "Combo Master",
      description: "Reach x5.0 combo",
      unlocked: combo >= 5,
    },
    // Run milestones
    {
      id: "runs_10",
      emoji: "🔄",
      name: "Persistent",
      description: "Play 10 runs",
      unlocked: runs >= 10,
    },
    {
      id: "runs_50",
      emoji: "🏅",
      name: "Dedicated Router",
      description: "Play 50 runs",
      unlocked: runs >= 50,
    },
  ];
}

const AchievementBadges = ({ progress }: { progress: PlayerProgress }) => {
  const achievements = getAchievements(progress);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="rounded-xl border border-primary/20 bg-secondary/30 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-xs tracking-widest uppercase text-muted-foreground">
          Achievements
        </h3>
        <span className="font-display text-xs tracking-wider text-primary">
          {unlocked}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`relative flex flex-col items-center p-2.5 rounded-lg border transition-all ${
              a.unlocked
                ? "border-primary/30 bg-primary/5"
                : "border-border/30 bg-secondary/20 opacity-40"
            }`}
          >
            <span className="text-xl mb-1">{a.unlocked ? a.emoji : ""}</span>
            {!a.unlocked && (
              <Lock className="w-4 h-4 text-muted-foreground mb-1" />
            )}
            <span className="font-display text-[9px] tracking-wider text-center leading-tight text-foreground">
              {a.name}
            </span>
            <span className="font-body text-[8px] text-muted-foreground text-center leading-tight mt-0.5">
              {a.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementBadges;
