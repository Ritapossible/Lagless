import { useState } from "react";
import { Heart, Zap, Timer, Volume2, VolumeX } from "lucide-react";
import { GameState } from "@/game/types";
import { toggleMute, isMuted } from "@/game/audio";
import gmumIcon from "@/assets/gmum-character.jpg";

interface GameHUDProps {
  state: GameState;
  onAbility: () => void;
  onPause: () => void;
}

function formatScore(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 10_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

const GameHUD = ({ state, onAbility, onPause }: GameHUDProps) => {
  const [muted, setMuted] = useState(isMuted());
  const healthPercent = (state.health / state.maxHealth) * 100;
  const latencyPercent = (state.latencyBudget / state.maxLatency) * 100;
  const cooldownPercent = state.abilityCooldownTimer > 0
    ? (state.abilityCooldownTimer / state.character.abilityCooldown) * 100
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="flex items-start justify-between px-3 pt-3 pointer-events-auto gap-2">
        {/* Left: avatar + health */}
        <div className="flex items-center gap-2">
          <button onClick={onPause} className="active:scale-95 transition-transform">
            <img
              src={gmumIcon}
              alt="GMUM"
              className="w-9 h-9 rounded-full border border-primary/50 object-cover"
            />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-neon-magenta fill-neon-magenta" />
              <Heart className="w-3.5 h-3.5 text-neon-magenta fill-neon-magenta" />
              {state.health < state.maxHealth * 0.5 && (
                <Heart className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${healthPercent}%`,
                  background: healthPercent > 50
                    ? 'hsl(var(--neon-magenta))'
                    : healthPercent > 25
                    ? 'hsl(40, 100%, 50%)'
                    : 'hsl(0, 80%, 50%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Center: Level */}
        <div className="text-center flex-shrink-0">
          <span className="font-display text-xs tracking-widest uppercase text-muted-foreground">
            Lv.{state.level}
          </span>
          <p className="font-display text-[9px] tracking-wider text-primary/70 truncate max-w-[80px]">
            {state.worldConfig.name}
          </p>
        </div>

        {/* Right: Latency + Score */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMuted(toggleMute())}
            className="p-1 rounded-full bg-secondary/60 border border-primary/30 active:scale-95 transition-transform"
          >
            {muted
              ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              : <Volume2 className="w-3.5 h-3.5 text-primary" />
            }
          </button>
          <div className="flex items-center gap-1 rounded-full border border-primary/40 bg-secondary/60 px-2.5 py-1 neon-box min-w-[60px] justify-center">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary flex-shrink-0" />
            <span className="font-display text-[11px] font-semibold text-foreground tabular-nums whitespace-nowrap">
              {formatScore(Math.floor(state.score))}
            </span>
          </div>
        </div>
      </div>

      {/* Latency Budget bar (top) */}
      <div className="px-3 mt-1">
        <div className="flex items-center gap-1.5">
          <Timer className="w-3 h-3 text-primary/70" />
          <div className="flex-1 h-2 rounded-full bg-secondary/80 overflow-hidden neon-box">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${latencyPercent}%`,
                background: latencyPercent > 50
                  ? 'linear-gradient(90deg, hsl(200, 100%, 50%), hsl(185, 100%, 55%))'
                  : latencyPercent > 25
                  ? 'hsl(40, 100%, 50%)'
                  : 'hsl(0, 80%, 50%)',
                boxShadow: `0 0 8px ${latencyPercent > 50 ? 'hsl(200, 100%, 50%)' : 'hsl(0, 80%, 50%)'}`,
              }}
            />
          </div>
          <span className="font-display text-[10px] text-muted-foreground w-8 text-right">
            {Math.floor(state.latencyBudget)}
          </span>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-4 left-0 right-0 flex items-end justify-between px-4 pointer-events-auto">
        {/* Combo meter */}
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-neon-cyan" />
            <span className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">
              Combo
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-lg font-bold text-foreground neon-glow">
              {state.comboCount}
            </span>
            <span className="font-display text-[10px] text-primary">
              x{state.comboMultiplier.toFixed(1)}
            </span>
          </div>
          <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-neon-cyan transition-all"
              style={{ width: `${Math.min(state.comboCount * 10, 100)}%` }}
            />
          </div>
        </div>

        {/* Ability button */}
        <button
          onClick={onAbility}
          disabled={state.abilityActive || state.abilityCooldownTimer > 0}
          className="relative w-16 h-16 rounded-full border-2 border-primary bg-primary/10
            flex items-center justify-center
            active:scale-95 transition-all duration-200
            disabled:border-muted-foreground disabled:opacity-40"
          style={{
            boxShadow: state.abilityActive
              ? '0 0 20px hsl(160, 100%, 55%), inset 0 0 15px hsl(160, 100%, 55%)'
              : cooldownPercent <= 0
              ? '0 0 15px hsl(200, 100%, 50%), inset 0 0 10px hsl(200, 100%, 50%, 0.3)'
              : 'none',
          }}
        >
          <Zap className="w-7 h-7 text-primary" />
          {cooldownPercent > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="29"
                fill="none"
                stroke="hsl(200, 100%, 50%)"
                strokeWidth="2"
                strokeDasharray={`${(1 - cooldownPercent / 100) * 182} 182`}
                opacity="0.6"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Level-up banner */}
      {state.levelUpDisplay > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: Math.min(state.levelUpDisplay / 0.5, 1) }}
        >
          <div
            className="flex flex-col items-center"
            style={{ transform: `scale(${1 + (2.5 - state.levelUpDisplay) * 0.03})` }}
          >
            <span className="font-display text-3xl font-bold tracking-widest uppercase neon-glow text-foreground drop-shadow-lg">
              Level {state.level}
            </span>
            <span className="font-display text-sm tracking-wider text-primary mt-1 drop-shadow">
              {state.levelUpName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD;
