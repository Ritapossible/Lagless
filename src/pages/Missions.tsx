import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import BuiltByFooter from "@/components/BuiltByFooter";
import ScreenHeader from "@/components/ScreenHeader";
import { loadDailyMissions, DAILY_MISSIONS, DailyMissionsState, claimDailyReward } from "@/game/dailyMissions";

// Missions are keyed by the UTC date (see dailyMissions.ts), so count down to UTC midnight
function untilMidnight() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const diff = next - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h} h ${m.toString().padStart(2, "0")} min`;
}

const Missions = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<DailyMissionsState>(() => loadDailyMissions());
  const [timeLeft, setTimeLeft] = useState(untilMidnight);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(untilMidnight()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = DAILY_MISSIONS.filter(m => state.missions[m.id]?.completed).length;

  return (
    <div className="min-h-[100svh] bg-background px-6 sm:px-8">
      <ScreenHeader title="Daily missions" onBack={() => navigate("/")} />
      <main className="mx-auto max-w-2xl pb-16 pt-4 animate-enter">
        <div className="flex items-baseline justify-between">
          <p className="text-[28px] font-medium leading-none">
            <span className="font-mono tabular-nums">{completedCount}</span>
            <span className="text-subtle"> of {DAILY_MISSIONS.length} done</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">Resets in {timeLeft}</p>
        </div>

        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {DAILY_MISSIONS.map((mission) => {
            const mp = state.missions[mission.id];
            const done = mp?.completed || false;
            const current = Math.min(Math.floor(mp?.current || 0), mission.target);
            return (
              <li key={mission.id} className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${done ? "border-positive bg-positive/15" : "border-border"}`}>
                    {done && <Check className="h-3 w-3 text-positive" strokeWidth={2} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{mission.title}</p>
                    <p className="text-sm text-subtle">{mission.description}</p>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-subtle">{current}/{mission.target}</span>
                </div>
                <div className="ml-8 mt-3 h-1 overflow-hidden rounded-full bg-foreground/10">
                  <div className={`h-full rounded-full ${done ? "bg-positive" : "bg-foreground/50"}`} style={{ width: `${(current / mission.target) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>

        <section className="surface mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-[15px] font-medium">Daily reward</p>
            <p className="mt-1 text-sm text-subtle">
              {state.rewardClaimed
                ? "Claimed. Your Clear Channel trial is ready."
                : "Finish all four for a 60 second trial in Clear Channel, the final world."}
            </p>
          </div>
          {state.rewardClaimed ? (
            <button onClick={() => navigate("/play", { state: { startTrial: true } })} className="btn-primary">
              Start trial
            </button>
          ) : (
            <button
              onClick={() => setState(claimDailyReward())}
              disabled={!state.allCompleted}
              className="btn-primary disabled:pointer-events-none disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
            >
              Claim reward
            </button>
          )}
        </section>

        <p className="mt-4 text-sm text-muted-foreground">Progress counts during runs. Missions reset at 00:00 UTC.</p>
        <BuiltByFooter />
      </main>
    </div>
  );
};

export default Missions;
