import { useState } from "react";
import { Pause, Volume2, VolumeX, Zap, FastForward, Layers } from "lucide-react";
import { AbilityType, GameState } from "@/game/types";
import { toggleMute, isMuted } from "@/game/audio";

interface GameHUDProps {
  state: GameState;
  onAbility: () => void;
  onPause: () => void;
  trialTimer?: number;
}

const ABILITY_ICONS: Record<AbilityType, typeof Zap> = {
  speed_warp: Zap,
  relay_chain: FastForward,
  node_deploy: Layers,
};

// Latency budget is measured in ms; colour shifts as it runs out
function budgetTone(percent: number) {
  if (percent > 50) return { text: "text-foreground", bar: "bg-relay" };
  if (percent > 25) return { text: "text-primary", bar: "bg-primary" };
  return { text: "text-destructive", bar: "bg-destructive" };
}

const GameHUD = ({ state, onAbility, onPause, trialTimer }: GameHUDProps) => {
  const [muted, setMuted] = useState(isMuted());
  const hullPercent = (state.health / state.maxHealth) * 100;
  const budgetPercent = (state.latencyBudget / state.maxLatency) * 100;
  const tone = budgetTone(budgetPercent);
  const cooldown = state.abilityCooldownTimer > 0 ? state.abilityCooldownTimer / state.character.abilityCooldown : 0;
  const ready = !state.abilityActive && cooldown <= 0;
  const AbilityIcon = ABILITY_ICONS[state.character.ability];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Top row: three quiet panels so the numbers read over any world */}
      <div className="pointer-events-auto flex items-start justify-between gap-3 px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background/75 p-2 pr-4 backdrop-blur">
          <button onClick={onPause} aria-label="Pause" className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-secondary">
            <Pause className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="w-24">
            <div className="flex justify-between text-xs text-subtle">
              <span>Hull</span>
              <span className="font-mono tabular-nums">{Math.round(hullPercent)}%</span>
            </div>
            <div className="mt-1.5 grid grid-cols-5 gap-0.5">
              {[0, 1, 2, 3, 4].map(i => (
                <span key={i} className={`h-1.5 rounded-[2px] ${hullPercent > i * 20 ? (hullPercent > 40 ? "bg-foreground" : "bg-destructive") : "bg-foreground/15"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Latency budget: the number that ends a run */}
        <div className="hidden w-full max-w-sm rounded-xl border border-border bg-background/75 px-4 py-2.5 backdrop-blur sm:block">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-sm tabular-nums">Lv {state.level} <span className="text-subtle">· {state.worldConfig.name}</span></span>
            <span className={`font-mono text-sm tabular-nums ${tone.text}`}>{Math.floor(state.latencyBudget)} ms</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/15">
            <div className={`h-full rounded-full ${tone.bar} transition-[width] duration-200`} style={{ width: `${budgetPercent}%` }} />
          </div>
          {trialTimer !== undefined && (
            <p className="mt-1.5 font-mono text-xs tabular-nums text-primary">Trial {Math.ceil(trialTimer)} s left</p>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-background/75 p-2 pl-4 backdrop-blur">
          <span className="font-mono text-lg tabular-nums">{Math.floor(state.score).toLocaleString()}</span>
          <button
            onClick={() => setMuted(toggleMute())}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-subtle transition-colors hover:text-foreground"
          >
            {muted ? <VolumeX className="h-4 w-4" strokeWidth={1.5} /> : <Volume2 className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Phones: the budget gets its own row under the panels */}
      <div className="mx-4 mt-2 rounded-xl border border-border bg-background/75 px-4 py-2.5 backdrop-blur sm:hidden">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-sm tabular-nums">Lv {state.level}</span>
          <span className={`font-mono text-sm tabular-nums ${tone.text}`}>{Math.floor(state.latencyBudget)} ms</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/15">
          <div className={`h-full rounded-full ${tone.bar} transition-[width] duration-200`} style={{ width: `${budgetPercent}%` }} />
        </div>
        {trialTimer !== undefined && (
          <p className="mt-1.5 font-mono text-xs tabular-nums text-primary">Trial {Math.ceil(trialTimer)} s left</p>
        )}
      </div>

      {/* Bottom row */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-6 sm:px-6">
        <div className="rounded-xl border border-border bg-background/75 px-4 py-2.5 backdrop-blur">
          <p className="text-xs text-subtle">Combo</p>
          <p className="font-mono text-2xl tabular-nums">
            x{state.comboMultiplier.toFixed(1)}
            <span className="ml-2 text-sm text-muted-foreground">{state.comboCount}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="keycap hidden sm:inline-flex">E</span>
          <button
            onClick={onAbility}
            disabled={!ready}
            aria-label="Use ability"
            className={`relative flex h-16 w-16 items-center justify-center rounded-full border bg-background/80 backdrop-blur transition-[transform,background-color] active:scale-[0.97] ${
              state.abilityActive ? "border-relay" : ready ? "border-primary" : "border-border"
            }`}
          >
            <AbilityIcon className={`h-6 w-6 ${ready ? "text-primary" : state.abilityActive ? "text-relay" : "text-muted-foreground"}`} strokeWidth={1.5} />
            {cooldown > 0 && (
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray={`${(1 - cooldown) * 188.5} 188.5`} />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Running low: a steady red edge, no pulsing */}
      {budgetPercent < 25 && (
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 96px rgba(229, 72, 77, 0.35)" }} />
      )}

      {/* Event text from the engine */}
      {state.floatingTexts.map((ft, i) => (
        <span
          key={`${ft.text}-${i}`}
          className="absolute -translate-x-1/2 whitespace-nowrap rounded-md bg-background/70 px-2 py-1 font-mono text-xs backdrop-blur"
          style={{ left: `${ft.x * 100}%`, top: `${ft.y * 100}%`, color: ft.color, opacity: Math.min(1, ft.life * 2) }}
        >
          {ft.text}
        </span>
      ))}

      {/* Level change */}
      {state.levelUpDisplay > 0 && (
        <div
          className="absolute inset-x-0 top-[30%] text-center"
          style={{ opacity: Math.min(state.levelUpDisplay / 0.5, 1) }}
        >
          <p className="text-[40px] font-medium leading-none tracking-[-0.02em]">Level {state.level}</p>
          <p className={`mt-2 text-sm ${state.isBossLevel ? "text-destructive" : "text-subtle"}`}>{state.levelUpName}</p>
        </div>
      )}
    </div>
  );
};

export default GameHUD;
