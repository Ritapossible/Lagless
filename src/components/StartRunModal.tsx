import { loadProgress } from "@/game/playerProgress";

interface StartRunModalProps {
  onStart: (startLevel: number) => void;
  onBack: () => void;
}

const StartRunModal = ({ onStart, onBack }: StartRunModalProps) => {
  const progress = loadProgress();
  const resumeLevel = Math.min(progress.lastResumeNodeLevel, 49);
  const hasResumeNode = resumeLevel > 0;

  return (
    <div className="fixed inset-0 z-50 bg-space-dark/95 backdrop-blur-md flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="max-w-sm w-full relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center neon-box">
            <span className="text-2xl">🛰️</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl font-bold neon-glow text-center mb-1">
          Initialize Run
        </h2>
        <p className="text-muted-foreground text-center text-xs mb-8 font-body">
          Select routing origin point
        </p>

        {/* Resume option */}
        {hasResumeNode && (
          <button
            onClick={() => onStart(resumeLevel)}
            className="group w-full mb-3 rounded-2xl overflow-hidden active:scale-[0.98] transition-all duration-200"
          >
            <div className="relative px-5 py-4 border-2 border-primary/40 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent neon-box">
              {/* Glow pulse */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-xl">⚡</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-display text-sm font-bold tracking-wider uppercase text-primary">
                    Resume Routing
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-body">
                    Continue from saved relay node
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-black text-primary neon-glow">L{resumeLevel}</span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Restart option */}
        <button
          onClick={() => onStart(1)}
          className="group w-full mb-6 rounded-2xl overflow-hidden active:scale-[0.98] transition-all duration-200"
        >
          <div className="relative px-5 py-4 border border-muted/20 rounded-2xl bg-muted/5 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted/10 border border-muted/20 flex items-center justify-center shrink-0">
                <span className="text-xl">🔄</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-display text-sm font-bold tracking-wider uppercase text-foreground">
                  Restart Network
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-body">
                  Fresh run from origin
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-2xl font-black text-muted-foreground">L1</span>
              </div>
            </div>
          </div>
        </button>

        {/* Divider */}
        <div className="circuit-line mb-4 opacity-40" />

        {/* Back button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 font-display text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <span>←</span>
          <span>Back to Selection</span>
        </button>
      </div>
    </div>
  );
};

export default StartRunModal;
