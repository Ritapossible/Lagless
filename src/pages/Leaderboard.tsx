import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import BuiltByFooter from "@/components/BuiltByFooter";
import { loadTopRuns, RunRecord } from "@/game/leaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const navigate = useNavigate();
  const [runs] = useState<RunRecord[]>(() => loadTopRuns());

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="relative z-10 flex flex-col min-h-screen px-5 pb-24 max-w-lg mx-auto">
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
            Leaderboard
          </h1>
          <div className="w-14" />
        </div>

        <p className="font-body text-xs text-muted-foreground text-center mb-6">
          Your best runs on this device.
        </p>

        {runs.length === 0 ? (
          <div className="flex flex-col items-center text-center rounded-xl border border-primary/20 bg-secondary/30 p-8">
            <Trophy className="w-8 h-8 text-primary/60 mb-3" />
            <p className="font-display text-sm tracking-wider uppercase text-foreground mb-1">
              No runs yet
            </p>
            <p className="font-body text-xs text-muted-foreground mb-5">
              Finish a run and it lands here.
            </p>
            <button
              onClick={() => navigate("/play")}
              className="px-6 py-2.5 rounded-xl border-2 border-primary bg-primary/10 font-display text-sm font-bold tracking-[0.2em] uppercase active:scale-95 transition-transform neon-box"
            >
              Play
            </button>
          </div>
        ) : (
          <ol className="space-y-2">
            {runs.map((run, i) => (
              <li
                key={`${run.date}-${i}`}
                className={`flex items-center gap-3 rounded-xl border p-3 bg-secondary/40 ${
                  i === 0 ? "border-primary/50 neon-box" : "border-primary/20"
                }`}
              >
                <span className="w-8 text-center font-display text-lg">
                  {MEDALS[i] ?? <span className="text-sm text-muted-foreground">{i + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm tracking-wider text-foreground truncate">
                    {run.victory ? "Network synchronized" : `Lv.${run.level} · ${run.world}`}
                  </p>
                  <p className="font-body text-[11px] text-muted-foreground truncate">
                    {run.character} · x{run.bestCombo.toFixed(1)} combo · {formatDate(run.date)}
                  </p>
                </div>
                <span className="font-display text-lg font-bold text-primary tabular-nums">
                  {run.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}

        <BuiltByFooter />
      </div>
    </div>
  );
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default Leaderboard;
