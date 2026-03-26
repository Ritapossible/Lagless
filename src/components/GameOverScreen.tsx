import { GameState } from "@/game/types";
import { Zap, Shield, AlertTriangle, Star, Target, XCircle } from "lucide-react";

interface GameOverProps {
  state: GameState;
  onRestart: () => void;
  onExit: () => void;
}

function formatStat(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toLocaleString();
}

const GameOverScreen = ({ state, onRestart, onExit }: GameOverProps) => {
  const isVictory = state.failureCause === '__VICTORY__';
  const nextLevel = state.level + 1;
  const progressInLevel = ((state.distance % 500) / 500) * 100;

  if (isVictory) {
    return (
      <div className="absolute inset-0 bg-space-dark/98 backdrop-blur-md flex flex-col items-center justify-center z-30 overflow-y-auto">
        {/* Victory particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ['hsl(var(--primary))', 'hsl(var(--neon-cyan))', '#ffd700', '#00ff88'][i % 4],
                animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 py-8">
          {/* Victory icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--neon-cyan) / 0.3))',
              boxShadow: '0 0 40px hsl(var(--primary) / 0.5), 0 0 80px hsl(var(--neon-cyan) / 0.3)',
              animation: 'fadeScaleIn 0.8s ease-out both',
            }}
          >
            <span className="text-4xl">🏆</span>
          </div>

          {/* Title */}
          <h2
            className="font-display text-2xl sm:text-3xl font-black tracking-[0.15em] uppercase text-center mb-2"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)), #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'fadeScaleIn 0.8s ease-out 0.2s both',
            }}
          >
            Core Network Synchronized
          </h2>

          {/* Message */}
          <div
            className="text-center mb-6 space-y-1"
            style={{ animation: 'slideUp 0.6s ease-out 0.4s both' }}
          >
            <p className="font-body text-sm text-foreground/80 leading-relaxed">
              You have conquered congestion,
            </p>
            <p className="font-body text-sm text-foreground/80 leading-relaxed">
              stabilized the grid,
            </p>
            <p className="font-body text-sm text-foreground/80 leading-relaxed">
              and achieved ultra-low latency mastery.
            </p>
          </div>

          {/* Endless mode unlock badge */}
          <div
            className="w-full rounded-xl border border-primary/30 p-4 mb-6 text-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--neon-cyan) / 0.1))',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.2), inset 0 0 20px hsl(var(--primary) / 0.05)',
              animation: 'slideUp 0.6s ease-out 0.6s both',
            }}
          >
            <p className="font-display text-xs tracking-[0.2em] uppercase text-primary mb-1">🔓 Unlocked</p>
            <p className="font-display text-lg font-bold text-foreground tracking-wider">Endless Routing Mode</p>
          </div>

          {/* Stats summary */}
          <div
            className="grid grid-cols-3 gap-3 mb-6 w-full"
            style={{ animation: 'slideUp 0.5s ease-out 0.8s both' }}
          >
            <StatCard label="Score" value={formatStat(state.score)} />
            <StatCard label="Level" value={`${state.level}`} />
            <StatCard label="Best Combo" value={`x${Math.max(state.bestCombo, state.comboMultiplier).toFixed(1)}`} />
          </div>

          {/* Buttons */}
          <button
            onClick={onRestart}
            className="w-full py-3.5 font-display text-lg font-bold tracking-[0.3em] uppercase
              border-2 border-primary rounded-xl bg-primary/10
              active:scale-[0.97] transition-all duration-200 mb-3"
            style={{
              animation: 'pulseGlow 2s ease-in-out infinite, slideUp 0.5s ease-out 1s both',
              boxShadow: '0 0 15px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2)',
            }}
          >
            Play Again
          </button>

          <button
            onClick={onExit}
            className="px-8 py-2 font-display text-sm tracking-widest uppercase text-muted-foreground
              active:scale-95 transition-transform opacity-60 hover:opacity-100"
          >
            Exit
          </button>
        </div>

        <style>{`
          @keyframes fadeScaleIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 15px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2); }
            50% { box-shadow: 0 0 25px hsl(var(--primary) / 0.7), 0 0 60px hsl(var(--primary) / 0.3); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-space-dark/95 backdrop-blur-sm flex flex-col items-center z-30 overflow-y-auto">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-5 py-8">
        {/* Title */}
        <h2
          className="font-display text-4xl sm:text-5xl font-black tracking-wider neon-glow mb-1"
          style={{ animation: "fadeScaleIn 0.6s ease-out both" }}
        >
          {state.health <= 0 ? "Packet Lost" : "Timeout"}
        </h2>

        {/* Stage context */}
        <p className="font-body text-sm text-muted-foreground mb-1">
          {state.worldConfig.name} — Level {state.level}
        </p>

        {/* Failure cause */}
        <p
          className="font-body text-xs tracking-wide mb-6"
          style={{ color: "hsl(25, 100%, 55%)" }}
        >
          Cause: {state.failureCause || "Unknown Failure"}
        </p>

        {/* Stats grid */}
        <div
          className="grid grid-cols-3 gap-3 mb-4 w-full"
          style={{ animation: "slideUp 0.5s ease-out 0.2s both" }}
        >
          <StatCard label="Score" value={formatStat(state.score)} />
          <StatCard label="Distance" value={formatStat(state.distance)} />
          <StatCard label="Best Combo" value={`x${Math.max(state.bestCombo, state.comboMultiplier).toFixed(1)}`} />
        </div>

        {/* Ability usage panel */}
        <div
          className="w-full rounded-xl border border-primary/20 bg-secondary/30 backdrop-blur-sm p-3 mb-4"
          style={{ animation: "slideUp 0.5s ease-out 0.4s both" }}
        >
          <AbilityRow
            icon={<Star className="w-4 h-4 text-yellow-400" />}
            label="Relays Used"
            value={state.relaysUsed}
            valueIcon={<Zap className="w-3.5 h-3.5 text-primary" />}
          />
          <AbilityRow
            icon={<Shield className="w-4 h-4 text-neon-cyan" />}
            label="FlexNodes Deployed"
            value={state.flexNodesDeployed}
            valueIcon={<Target className="w-3.5 h-3.5 text-primary" />}
          />
          <AbilityRow
            icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
            label="Routing Mistakes"
            value={state.routingMistakes}
            valueIcon={<XCircle className="w-3.5 h-3.5 text-destructive" />}
            isLast
          />
        </div>

        {/* Progress bar */}
        <div
          className="w-full mb-6"
          style={{ animation: "slideUp 0.5s ease-out 0.6s both" }}
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-body text-xs text-muted-foreground">
              Progress to Level {nextLevel}
            </span>
            <span className="font-display text-xs text-primary">
              {Math.floor(progressInLevel)}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary/80 overflow-hidden neon-box">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progressInLevel}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                boxShadow: "0 0 10px hsl(var(--primary) / 0.6)",
                animation: "progressFill 1.2s ease-out 0.8s both",
              }}
            />
          </div>
        </div>

        {/* Retry button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 font-display text-xl font-bold tracking-[0.3em] uppercase
            border-2 border-primary rounded-xl bg-primary/10
            active:scale-[0.97] transition-all duration-200 mb-3"
          style={{
            animation: "pulseGlow 2s ease-in-out infinite, slideUp 0.5s ease-out 0.8s both",
            boxShadow: "0 0 15px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2), inset 0 0 15px hsl(var(--primary) / 0.1)",
          }}
        >
          Retry
        </button>

        {/* Exit button */}
        <button
          onClick={onExit}
          className="px-8 py-2 font-display text-sm tracking-widest uppercase text-muted-foreground
            active:scale-95 transition-transform opacity-60 hover:opacity-100"
        >
          Exit
        </button>
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2), inset 0 0 15px hsl(var(--primary) / 0.1); }
          50% { box-shadow: 0 0 25px hsl(var(--primary) / 0.7), 0 0 60px hsl(var(--primary) / 0.3), inset 0 0 20px hsl(var(--primary) / 0.15); }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/40 border border-primary/20 neon-box">
    <span className="font-display text-xl sm:text-2xl font-bold text-foreground">{value}</span>
    <span className="font-body text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
  </div>
);

const AbilityRow = ({
  icon,
  label,
  value,
  valueIcon,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  valueIcon: React.ReactNode;
  isLast?: boolean;
}) => (
  <div className={`flex items-center justify-between py-2 ${!isLast ? "border-b border-primary/10" : ""}`}>
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-body text-xs text-foreground/80">{label}</span>
    </div>
    <div className="flex items-center gap-1">
      {valueIcon}
      <span className="font-display text-sm font-bold text-foreground">{value}</span>
    </div>
  </div>
);

export default GameOverScreen;
