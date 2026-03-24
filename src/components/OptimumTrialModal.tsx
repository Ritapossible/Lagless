import { loadProgress } from "@/game/playerProgress";
import { CheckCircle, Calendar, Zap } from "lucide-react";

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

const OptimumTrialModal = ({ onAccept, onDecline }: Props) => {
  const progress = loadProgress();

  // Determine which conditions were met
  const reachedLv10 = progress.highestLevel >= 10;
  const failed5Runs = progress.totalRuns >= 5;

  return (
    <div className="absolute inset-0 bg-space-dark/95 backdrop-blur-sm flex flex-col items-center justify-center z-40 px-5 animate-fade-in">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-foreground/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Condition badges */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          <ConditionBadge
            icon={<CheckCircle className="w-3.5 h-3.5" />}
            label={`Lv. ${progress.highestLevel}`}
            sublabel="Reached"
            met={reachedLv10}
          />
          <ConditionBadge
            icon={<CheckCircle className="w-3.5 h-3.5" />}
            label={`${progress.totalRuns} Runs`}
            sublabel="Failed"
            met={failed5Runs}
          />
          <ConditionBadge
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Daily Mission"
            sublabel="Coming Soon"
            met={false}
            disabled
          />
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl font-bold tracking-wider mb-4 text-center" style={{
          color: "hsl(45, 100%, 65%)",
          textShadow: "0 0 20px hsl(45 100% 50% / 0.4)",
        }}>
          Network Beacon Detected <Zap className="inline w-6 h-6 text-yellow-400" />
        </h2>

        {/* Description */}
        <p className="font-body text-base text-foreground/80 text-center mb-2 leading-relaxed">
          You have discovered a temporary{" "}
          <span className="text-primary font-semibold">Optimum Layer</span>{" "}
          tunnel.
        </p>
        <p className="font-body text-base text-foreground/70 text-center mb-8 leading-relaxed">
          Would you like to test ultra-low latency routing?
        </p>

        {/* Primary CTA */}
        <button
          onClick={onAccept}
          className="w-full py-4 rounded-xl border-2 border-primary bg-primary/5
            font-display text-lg font-bold tracking-wider
            active:scale-[0.97] transition-all duration-200 mb-3"
          style={{
            boxShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 0 50px hsl(var(--primary) / 0.15), inset 0 0 20px hsl(var(--primary) / 0.08)",
            animation: "pulseGlowTrial 2.5s ease-in-out infinite",
          }}
        >
          <Zap className="inline w-5 h-5 text-yellow-400 mr-2 -mt-0.5" />
          Try Optimum Layer Preview
        </button>

        <p className="font-body text-[10px] text-muted-foreground text-center mb-6">
          Special short trial to experience ultra-low latency routing.
        </p>

        {/* Secondary CTA - styled like primary but slightly different */}
        <button
          onClick={onDecline}
          className="px-8 py-3 rounded-xl border border-primary/40 bg-primary/5
            font-display text-sm font-bold tracking-wider
            active:scale-95 transition-all text-foreground/70"
          style={{
            boxShadow: "0 0 10px hsl(var(--primary) / 0.2), inset 0 0 10px hsl(var(--primary) / 0.05)",
          }}
        >
          Later
        </button>
      </div>

      <style>{`
        @keyframes pulseGlowTrial {
          0%, 100% { box-shadow: 0 0 20px hsl(var(--primary) / 0.4), 0 0 50px hsl(var(--primary) / 0.15), inset 0 0 20px hsl(var(--primary) / 0.08); }
          50% { box-shadow: 0 0 30px hsl(var(--primary) / 0.6), 0 0 70px hsl(var(--primary) / 0.25), inset 0 0 25px hsl(var(--primary) / 0.12); }
        }
      `}</style>
    </div>
  );
};

const ConditionBadge = ({
  icon,
  label,
  sublabel,
  met,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  met: boolean;
  disabled?: boolean;
}) => (
  <div
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-body
      ${met
        ? "border-primary/40 bg-primary/10 text-foreground/90"
        : disabled
          ? "border-border/30 bg-secondary/20 text-muted-foreground/50"
          : "border-border/50 bg-secondary/30 text-muted-foreground/70"
      }`}
  >
    <span className={met ? "text-primary" : "text-muted-foreground/50"}>{icon}</span>
    <div className="flex flex-col leading-tight">
      <span className="font-display text-[11px] font-bold">{label}</span>
      <span className="text-[9px] text-muted-foreground">{sublabel}</span>
    </div>
  </div>
);

export default OptimumTrialModal;
