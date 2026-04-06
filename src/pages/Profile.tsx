import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Check, X, Trophy, Zap, Target, RotateCcw, Shield, Award } from "lucide-react";
import BuiltByFooter from "@/components/BuiltByFooter";
import { loadProgress, saveProgress, PlayerProgress } from "@/game/playerProgress";

const Profile = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(progress.discordUsername);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Username cannot be empty");
      return;
    }
    const updated = { ...progress, discordUsername: trimmed };
    saveProgress(updated);
    setProgress(updated);
    setEditing(false);
    setError("");
  };

  const handleCancel = () => {
    setDraft(progress.discordUsername);
    setEditing(false);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-5 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground font-display text-xs tracking-widest uppercase active:scale-95 transition-transform flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-display text-lg font-bold neon-glow tracking-wider">
            Profile
          </h1>
          <div className="w-14" />
        </div>

        {/* Avatar + Username */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 neon-box">
            <span className="text-4xl">🎮</span>
          </div>

          {editing ? (
            <div className="w-full max-w-xs">
              <input
                type="text"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError(""); }}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/60 border border-border text-foreground
                  font-body text-sm text-center placeholder:text-muted-foreground/50
                  focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
                  transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              {error && (
                <p className="mt-1 text-xs text-destructive font-body text-center">{error}</p>
              )}
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/20 border border-primary/40 font-display text-xs tracking-wider uppercase active:scale-95 transition-transform"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary/40 border border-border font-display text-xs tracking-wider uppercase text-muted-foreground active:scale-95 transition-transform"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold tracking-wider neon-glow">
                {progress.discordUsername || "Unknown Player"}
              </h2>
              <button
                onClick={() => { setDraft(progress.discordUsername); setEditing(true); }}
                className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 active:scale-90 transition-transform"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatTile
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            label="Highest Level"
            value={`${progress.highestLevel}`}
          />
          <StatTile
            icon={<RotateCcw className="w-5 h-5 text-primary" />}
            label="Total Runs"
            value={`${progress.totalRuns}`}
          />
          <StatTile
            icon={<Zap className="w-5 h-5 text-neon-cyan" />}
            label="High Score"
            value={formatStat(progress.highScore || 0)}
          />
          <StatTile
            icon={<Target className="w-5 h-5 text-neon-magenta" />}
            label="Best Combo"
            value={`x${(progress.bestCombo || 0).toFixed(1)}`}
          />
          {(progress.timesCompleted || 0) > 0 && (
            <div className="col-span-2">
              <StatTile
                icon={<Award className="w-5 h-5 text-yellow-500" />}
                label="Network Synchronized"
                value={`${progress.timesCompleted}x`}
              />
            </div>
          )}
        </div>

        {/* Progression */}
        <div className="rounded-xl border border-primary/20 bg-secondary/30 p-4 mb-6">
          <h3 className="font-display text-xs tracking-widest uppercase text-muted-foreground mb-3">
            Progression
          </h3>
          <div className="space-y-3">
            <ProgressRow
              label="Optimum Layer"
              status={
                progress.optimumLayerUnlocked
                  ? "Unlocked"
                  : progress.trialUsed
                    ? "Trial Used"
                    : `Unlock at Level 40`
              }
              unlocked={progress.optimumLayerUnlocked}
            />
            <ProgressRow
              label="Trial Mode"
              status={
                progress.trialUsed
                  ? "Used"
                  : "Available"
              }
              unlocked={!progress.trialUsed}
            />
          </div>
        </div>

        {/* Optimum status */}
        {!progress.optimumLayerUnlocked && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <p className="font-display text-xs tracking-wider uppercase text-foreground mb-1">
                  Optimum Layer Locked
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  Reach Level 40 to permanently unlock the Optimum Layer with full rewards and leaderboard access.
                </p>
                <div className="mt-2 w-full h-2 rounded-full bg-secondary/80 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((progress.highestLevel / 40) * 100, 100)}%`,
                      background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                    }}
                  />
                </div>
                <p className="font-body text-[10px] text-muted-foreground mt-1">
                  Level {progress.highestLevel} / 40
                </p>
              </div>
            </div>
          </div>
        )}

        <BuiltByFooter />
      </div>
    </div>
  );
};

function formatStat(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toLocaleString();
}

const StatTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex flex-col items-center p-4 rounded-xl bg-secondary/40 border border-primary/20 neon-box">
    {icon}
    <span className="font-display text-2xl font-bold text-foreground mt-2">{value}</span>
    <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
  </div>
);

const ProgressRow = ({ label, status, unlocked }: { label: string; status: string; unlocked: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="font-body text-sm text-foreground/80">{label}</span>
    <span className={`font-display text-xs tracking-wider ${unlocked ? "text-primary" : "text-muted-foreground"}`}>
      {status}
    </span>
  </div>
);

export default Profile;
