import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Gift, Clock, Target, Zap, Radio, Wrench } from "lucide-react";
import BuiltByFooter from "@/components/BuiltByFooter";
import { loadDailyMissions, DAILY_MISSIONS, DailyMissionsState, claimDailyReward } from "@/game/dailyMissions";
import { loadProgress, PlayerProgress } from "@/game/playerProgress";

const MISSION_ICONS: Record<string, React.ReactNode> = {
  latency_above_60: <Radio className="w-5 h-5 text-primary" />,
  correct_routing: <Target className="w-5 h-5 text-neon-cyan" />,
  use_relays: <Zap className="w-5 h-5 text-yellow-400" />,
  deploy_flexnodes: <Wrench className="w-5 h-5 text-neon-magenta" />,
};

const Missions = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<DailyMissionsState>(() => loadDailyMissions());
  const [progress] = useState<PlayerProgress>(() => loadProgress());
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);

  // Calculate time until reset
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = DAILY_MISSIONS.filter(m => state.missions[m.id]?.completed).length;
  const totalMissions = DAILY_MISSIONS.length;

  const handleClaimReward = () => {
    const updated = claimDailyReward();
    setState(updated);
    setShowRewardClaimed(true);
    setTimeout(() => setShowRewardClaimed(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
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
            Daily Missions
          </h1>
          <div className="w-14" />
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-display text-xs tracking-widest text-muted-foreground">
            Resets in {timeLeft}
          </span>
        </div>

        {/* Overall progress */}
        <div
          className="rounded-xl border border-primary/20 bg-secondary/30 backdrop-blur-sm p-4 mb-5"
          style={{
            background: state.allCompleted
              ? 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--neon-cyan) / 0.1))'
              : undefined,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-xs tracking-widest uppercase text-muted-foreground">
              Progress
            </span>
            <span className="font-display text-sm font-bold text-primary">
              {completedCount}/{totalMissions}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(completedCount / totalMissions) * 100}%`,
                background: state.allCompleted
                  ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--neon-cyan)), #ffd700)'
                  : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--neon-cyan)))',
                boxShadow: '0 0 10px hsl(var(--primary) / 0.6)',
              }}
            />
          </div>
          {state.allCompleted && (
            <p className="font-display text-[10px] tracking-widest text-primary mt-2 text-center uppercase">
              ✨ All Missions Complete!
            </p>
          )}
        </div>

        {/* Mission Cards */}
        <div className="space-y-3 mb-6">
          {DAILY_MISSIONS.map((mission, idx) => {
            const mp = state.missions[mission.id];
            const isComplete = mp?.completed || false;
            const current = mp?.current || 0;
            const progressPct = Math.min((current / mission.target) * 100, 100);

            return (
              <div
                key={mission.id}
                className={`rounded-xl border p-4 transition-all duration-300 ${
                  isComplete
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-primary/15 bg-secondary/30'
                }`}
                style={{
                  animation: `slideUp 0.4s ease-out ${0.1 * idx}s both`,
                  boxShadow: isComplete
                    ? '0 0 15px hsl(var(--primary) / 0.15), inset 0 0 15px hsl(var(--primary) / 0.05)'
                    : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isComplete ? 'bg-primary/20' : 'bg-secondary/60'
                    }`}
                  >
                    {MISSION_ICONS[mission.id] || <span className="text-lg">{mission.icon}</span>}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                        {mission.title}
                      </h3>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-foreground mb-2">
                      {mission.description}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary/80 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPct}%`,
                            background: isComplete
                              ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--neon-cyan)))'
                              : 'hsl(var(--primary) / 0.6)',
                          }}
                        />
                      </div>
                      <span className={`font-display text-[10px] tracking-wider ${isComplete ? 'text-primary' : 'text-muted-foreground'}`}>
                        {Math.min(Math.floor(current), mission.target)}/{mission.target}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reward Section */}
        <div
          className={`rounded-xl border p-4 mb-4 ${
            state.allCompleted && !state.rewardClaimed
              ? 'border-accent/40 bg-accent/10'
              : 'border-primary/15 bg-secondary/20'
          }`}
          style={{
            boxShadow: state.allCompleted && !state.rewardClaimed
              ? '0 0 20px hsl(var(--accent) / 0.2), inset 0 0 15px hsl(var(--accent) / 0.05)'
              : undefined,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Gift className={`w-5 h-5 ${state.allCompleted ? 'text-accent' : 'text-muted-foreground'}`} />
            <div>
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                Daily Reward
              </h3>
              <p className="font-body text-xs text-muted-foreground">
                Complete all missions to unlock an Optimum Layer Trial
              </p>
            </div>
          </div>

          {state.rewardClaimed ? (
            <div className="text-center py-2">
              <span className="font-display text-xs tracking-widest text-primary uppercase">
                ✅ Reward Claimed — Trial Unlocked
              </span>
            </div>
          ) : state.allCompleted ? (
            <button
              onClick={handleClaimReward}
              className="w-full py-3 font-display text-sm font-bold tracking-[0.2em] uppercase
                border-2 border-accent rounded-xl bg-accent/10
                active:scale-[0.97] transition-all duration-200"
              style={{
                animation: 'pulseGlow 2s ease-in-out infinite',
                boxShadow: '0 0 15px hsl(var(--accent) / 0.4), 0 0 30px hsl(var(--accent) / 0.15)',
              }}
            >
              Claim Reward
            </button>
          ) : (
            <div className="w-full py-3 text-center font-display text-xs tracking-widest uppercase text-muted-foreground/50">
              Complete all missions to unlock
            </div>
          )}
        </div>

        {/* Player hint */}
        <div className="text-center mb-6">
          <p className="font-body text-[10px] text-muted-foreground">
            Mission progress tracked during gameplay runs
          </p>
        </div>

        {showRewardClaimed && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md neon-box"
            style={{ animation: 'slideUp 0.3s ease-out both' }}
          >
            <p className="font-display text-sm tracking-wider text-center text-primary">
              ⚡ Optimum Layer Trial Unlocked!
            </p>
          </div>
        )}

        <BuiltByFooter />
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px hsl(var(--accent) / 0.4), 0 0 30px hsl(var(--accent) / 0.15); }
          50% { box-shadow: 0 0 25px hsl(var(--accent) / 0.6), 0 0 50px hsl(var(--accent) / 0.25); }
        }
      `}</style>
    </div>
  );
};

export default Missions;
