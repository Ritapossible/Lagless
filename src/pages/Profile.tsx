import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check, X } from "lucide-react";
import BuiltByFooter from "@/components/BuiltByFooter";
import ScreenHeader from "@/components/ScreenHeader";
import AchievementBadges from "@/components/AchievementBadges";
import { loadProgress, saveProgress, PlayerProgress } from "@/game/playerProgress";

const FINAL_WORLD_LEVEL = 40;

const Profile = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(progress.username);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Username can't be empty");
      return;
    }
    const updated = { ...progress, username: trimmed };
    saveProgress(updated);
    setProgress(updated);
    setEditing(false);
    setError("");
  };

  const handleCancel = () => {
    setDraft(progress.username);
    setEditing(false);
    setError("");
  };

  const name = progress.username || "Guest";
  const toFinal = Math.min(progress.highestLevel / FINAL_WORLD_LEVEL, 1);

  return (
    <div className="min-h-[100svh] bg-background px-6 sm:px-8">
      <ScreenHeader title="Profile" onBack={() => navigate("/")} />
      <main className="mx-auto max-w-4xl pb-16 pt-4 animate-enter">
        {/* Name */}
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-lg font-medium">
            {name.charAt(0).toUpperCase()}
          </span>
          {editing ? (
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  aria-label="Username"
                  maxLength={20}
                  onChange={(e) => { setDraft(e.target.value); setError(""); }}
                  className="h-10 w-full max-w-xs rounded-[10px] border border-border bg-secondary px-3 text-[15px] focus:border-primary/60 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
                <button onClick={handleSave} aria-label="Save" className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button onClick={handleCancel} aria-label="Cancel" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border text-subtle">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-[22px] font-medium leading-tight sm:text-[28px]">{name}</h2>
              <button onClick={() => { setDraft(progress.username); setEditing(true); }} aria-label="Edit name" className="btn-quiet shrink-0">
                <Pencil className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <dl className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="High score" value={Math.floor(progress.highScore || 0).toLocaleString()} />
          <Stat label="Highest level" value={`${progress.highestLevel}`} />
          <Stat label="Best combo" value={`x${(progress.bestCombo || 0).toFixed(1)}`} />
          <Stat label="Runs" value={`${progress.totalRuns}`} />
        </dl>

        {/* Road to the final world */}
        <section className="surface mt-4 p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-medium">
              {progress.finalWorldUnlocked ? "Clear Channel unlocked" : "Road to Clear Channel"}
            </p>
            <span className="font-mono text-sm tabular-nums text-subtle">
              {Math.min(progress.highestLevel, FINAL_WORLD_LEVEL)} / {FINAL_WORLD_LEVEL}
            </span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-primary" style={{ width: `${toFinal * 100}%` }} />
          </div>
          <p className="mt-3 text-sm text-subtle">
            {progress.finalWorldUnlocked
              ? `Finished the game ${progress.timesCompleted || 0} ${progress.timesCompleted === 1 ? "time" : "times"}. Trials played: ${progress.trialsUsed || 0}.`
              : `Reach level ${FINAL_WORLD_LEVEL} to unlock the final world for good. Trials played: ${progress.trialsUsed || 0}.`}
          </p>
        </section>

        <div className="mt-10">
          <AchievementBadges progress={progress} />
        </div>

        <BuiltByFooter />
      </main>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="mt-2 font-mono text-[28px] leading-none tabular-nums">{value}</dd>
  </div>
);

export default Profile;
