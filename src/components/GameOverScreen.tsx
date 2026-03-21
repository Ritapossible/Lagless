import { GameState } from "@/game/types";

interface GameOverProps {
  state: GameState;
  onRestart: () => void;
  onExit: () => void;
}

const GameOverScreen = ({ state, onRestart, onExit }: GameOverProps) => {
  return (
    <div className="absolute inset-0 bg-space-dark/90 flex flex-col items-center justify-center z-30 animate-slide-up">
      <h2 className="font-display text-4xl font-black tracking-wider neon-glow mb-2">
        {state.health <= 0 ? "Packet Lost" : "Timeout"}
      </h2>
      <p className="font-body text-muted-foreground text-sm mb-8">
        {state.health <= 0 ? "Packet integrity compromised" : "Latency budget depleted"}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-10 w-64">
        <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/40 border border-primary/20">
          <span className="font-display text-2xl font-bold text-foreground">{Math.floor(state.score)}</span>
          <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Score</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/40 border border-primary/20">
          <span className="font-display text-2xl font-bold text-foreground">{Math.floor(state.distance)}</span>
          <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Distance</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/40 border border-primary/20">
          <span className="font-display text-2xl font-bold text-foreground">{state.level}</span>
          <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Level</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/40 border border-primary/20">
          <span className="font-display text-2xl font-bold text-foreground">x{state.comboMultiplier.toFixed(1)}</span>
          <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Best Combo</span>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="px-12 py-3 font-display text-xl font-bold tracking-[0.3em] uppercase
          border-2 border-primary rounded-xl bg-primary/10 neon-box-intense
          active:scale-[0.97] transition-all duration-200 mb-4"
      >
        Retry
      </button>
      <button
        onClick={onExit}
        className="px-8 py-2 font-display text-sm tracking-widest uppercase text-muted-foreground
          active:scale-95 transition-transform"
      >
        Exit
      </button>
    </div>
  );
};

export default GameOverScreen;
