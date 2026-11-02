import { GameState, LEVEL_DISTANCE } from "@/game/types";
import { RotateCcw } from "lucide-react";
import BuiltByFooter from "./BuiltByFooter";

interface GameOverProps {
  state: GameState;
  /** The level Retry starts from */
  retryLevel: number;
  onRestart: () => void;
  onExit: () => void;
}

const fmt = (n: number) => Math.floor(n).toLocaleString();

const GameOverScreen = ({ state, retryLevel, onRestart, onExit }: GameOverProps) => {
  const isVictory = state.failureCause === '__VICTORY__';
  const progressInLevel = ((state.distance % LEVEL_DISTANCE) / LEVEL_DISTANCE) * 100;
  const bestCombo = Math.max(state.bestCombo, state.comboMultiplier);

  const title = isVictory ? "Network clear" : state.health <= 0 ? "Hull lost" : "Timed out";
  const subtitle = isVictory
    ? "You flew all 50 levels, from Congestion Zone to Clear Channel"
    : `${state.worldConfig.name} · level ${state.level} · ${state.failureCause || "Signal lost"}`;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-background/90 px-6 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md animate-enter">
        <h2 className="text-[40px] font-medium leading-none tracking-[-0.02em]">{title}</h2>
        <p className="mt-3 text-sm text-subtle">{subtitle}</p>

        <div className="surface mt-8 p-5">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="mt-1 font-mono text-[32px] leading-none tabular-nums">{fmt(state.score)}</p>
          <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
            <Stat label="Distance" value={`${fmt(state.distance)} m`} />
            <Stat label="Best combo" value={`x${bestCombo.toFixed(1)}`} />
            <Stat label="Level" value={`${state.level}`} />
          </dl>
        </div>

        <dl className="mt-4 divide-y divide-border rounded-2xl border border-border">
          <Row label="Relays collected" value={state.relaysUsed} />
          <Row label="Platforms deployed" value={state.platformsDeployed} />
          <Row label="Hits taken" value={state.routingMistakes} />
        </dl>

        {!isVictory && (
          <div className="mt-6">
            <div className="flex justify-between text-sm">
              <span className="text-subtle">To level {state.level + 1}</span>
              <span className="font-mono tabular-nums">{Math.floor(progressInLevel)}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/15">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progressInLevel}%` }} />
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button onClick={onRestart} className="btn-primary flex-1">
            <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
            {isVictory ? "Fly again" : retryLevel > 1 ? `Retry from Lv ${retryLevel}` : "Retry"}
          </button>
          <button onClick={onExit} className="btn-secondary">
            Home
          </button>
        </div>
        <BuiltByFooter />
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 font-mono text-[15px] tabular-nums">{value}</dd>
  </div>
);

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex h-11 items-center justify-between px-5 text-sm">
    <dt className="text-subtle">{label}</dt>
    <dd className="font-mono tabular-nums">{value}</dd>
  </div>
);

export default GameOverScreen;
