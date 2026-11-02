import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BuiltByFooter from "@/components/BuiltByFooter";
import ScreenHeader from "@/components/ScreenHeader";
import { loadTopRuns, RunRecord } from "@/game/leaderboard";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [runs] = useState<RunRecord[]>(() => loadTopRuns());

  return (
    <div className="min-h-[100svh] bg-background px-6 sm:px-8">
      <ScreenHeader title="Leaderboard" onBack={() => navigate("/")} />
      <main className="mx-auto max-w-2xl pb-16 pt-4 animate-enter">
        <p className="text-sm text-subtle">Your 10 best runs on this device</p>

        {runs.length === 0 ? (
          <div className="surface mt-6 p-8 text-center">
            <p className="text-[15px] font-medium">No runs yet</p>
            <p className="mt-1 text-sm text-subtle">Finish a run and it lands here.</p>
            <button onClick={() => navigate("/play")} className="btn-primary mt-6">Play</button>
          </div>
        ) : (
          <ol className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {runs.map((run, i) => (
              <li key={`${run.date}-${i}`} className="flex h-16 items-center gap-4 px-5">
                <span className={`w-6 font-mono text-sm tabular-nums ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px]">
                    {run.victory ? "Network clear" : `Lv ${run.level} · ${run.world}`}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {run.character} · x{run.bestCombo.toFixed(1)} combo · {formatDate(run.date)}
                  </p>
                </div>
                <span className="font-mono text-lg tabular-nums">{run.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}

        <BuiltByFooter />
      </main>
    </div>
  );
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default Leaderboard;
