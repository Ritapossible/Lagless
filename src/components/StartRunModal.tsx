import { loadProgress } from "@/game/playerProgress";

interface StartRunModalProps {
  onStart: (startLevel: number) => void;
  onBack: () => void;
}

const StartRunModal = ({ onStart, onBack }: StartRunModalProps) => {
  const progress = loadProgress();
  const resumeLevel = progress.lastResumeNodeLevel;
  const hasResumeNode = resumeLevel > 0;

  return (
    <div className="fixed inset-0 z-50 bg-space-dark/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="max-w-sm w-full">
        {/* Title */}
        <h2 className="font-display text-2xl font-bold neon-glow text-center mb-2">
          Start Run
        </h2>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Choose your starting point
        </p>

        {/* Resume option */}
        {hasResumeNode && (
          <button
            onClick={() => onStart(resumeLevel)}
            className="w-full mb-4 px-6 py-4 font-display text-base tracking-wider uppercase border-2 border-primary rounded-xl bg-primary/10 neon-box active:scale-95 transition-transform text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-primary font-bold flex items-center gap-2">
                  <span>⚡</span>
                  <span>Resume Routing</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal">
                  Continue from Level {resumeLevel}
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">L{resumeLevel}</span>
            </div>
          </button>
        )}

        {/* Restart option */}
        <button
          onClick={() => onStart(1)}
          className="w-full mb-6 px-6 py-4 font-display text-base tracking-wider uppercase border-2 border-muted/30 rounded-xl bg-muted/5 active:scale-95 transition-transform text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground font-bold flex items-center gap-2">
                <span>🔄</span>
                <span>Restart Network</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal">
                Fresh run from Level 1
              </p>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">L1</span>
          </div>
        </button>

        {/* Back button */}
        <button
          onClick={onBack}
          className="w-full px-6 py-2 font-display text-xs tracking-widest uppercase text-muted-foreground active:scale-95 transition-transform"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default StartRunModal;
