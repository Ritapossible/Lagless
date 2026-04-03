import { useState } from "react";
import BuiltByFooter from "./BuiltByFooter";
import { CHARACTERS, Character } from "@/game/types";
import warpRunnerImg from "@/assets/char-warp-runner.png";
import relayMasterImg from "@/assets/char-relay-master.png";
import nodeEngineerImg from "@/assets/char-node-engineer.png";

const CHAR_IMAGES = [warpRunnerImg, relayMasterImg, nodeEngineerImg];

const ABILITY_DESCRIPTIONS: Record<string, string> = {
  speed_warp: "Hyper speed + obstacle immunity",
  relay_chain: "Auto-teleport across danger zones",
  node_deploy: "Deploy temporary safe platforms",
};

interface Props {
  onSelect: (character: Character) => void;
  onBack: () => void;
}

const CharacterSelect = ({ onSelect, onBack }: Props) => {
  const [selected, setSelected] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button
          onClick={onBack}
          className="text-muted-foreground font-display text-xs tracking-widest uppercase active:scale-95 transition-transform"
        >
          ← Back
        </button>
        <h1 className="font-display text-lg font-bold neon-glow tracking-wider">
          Select Runner
        </h1>
        <div className="w-12" />
      </div>

      {/* Character showcase */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        {/* Character image */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-40"
            style={{
              background: selected === 0
                ? "hsl(var(--neon-blue))"
                : selected === 1
                  ? "hsl(var(--neon-cyan))"
                  : "hsl(var(--neon-magenta))",
            }}
          />
          <img
            src={CHAR_IMAGES[selected]}
            alt={CHARACTERS[selected].name}
            className="relative w-44 h-44 object-contain animate-float drop-shadow-[0_0_24px_hsl(var(--neon-blue)/0.5)]"
          />
        </div>

        {/* Character name */}
        <h2 className="font-display text-2xl font-bold tracking-wider neon-glow leading-tight">
          {CHARACTERS[selected].name}
        </h2>

        {/* Ability badge */}
        <div className="px-4 py-2 rounded-xl border border-border bg-card/60 neon-box">
          <p className="font-display text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
            Ability
          </p>
          <p className="font-body text-sm text-foreground">
            {ABILITY_DESCRIPTIONS[CHARACTERS[selected].ability]}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-center">
          <div>
            <p className="font-display text-[9px] tracking-widest uppercase text-muted-foreground">
              Duration
            </p>
            <p className="font-display text-base font-bold text-foreground">
              {CHARACTERS[selected].abilityDuration / 1000}s
            </p>
          </div>
          <div>
            <p className="font-display text-[9px] tracking-widest uppercase text-muted-foreground">
              Cooldown
            </p>
            <p className="font-display text-base font-bold text-foreground">
              {CHARACTERS[selected].abilityCooldown / 1000}s
            </p>
          </div>
        </div>
      </div>

      {/* Character selector row */}
      <div className="flex justify-center gap-3 pb-4">
        {CHARACTERS.map((char, i) => (
          <button
            key={char.name}
            onClick={() => setSelected(i)}
            className={`relative w-20 h-20 rounded-2xl border-2 transition-all duration-200 active:scale-95 overflow-hidden ${
              selected === i
                ? "border-primary neon-box-intense scale-105"
                : "border-border bg-card/40 opacity-60"
            }`}
          >
            <img
              src={CHAR_IMAGES[i]}
              alt={char.name}
              className="w-full h-full object-contain p-1"
            />
          </button>
        ))}
      </div>

      {/* Play button */}
      <div className="px-6 pb-8">
        <button
          onClick={() => onSelect(CHARACTERS[selected])}
          className="w-full py-4 font-display text-lg font-bold tracking-[0.25em] uppercase rounded-2xl bg-primary text-primary-foreground neon-box-intense active:scale-[0.97] transition-transform"
        >
          Deploy
        </button>
      </div>
    </div>
  );
};

export default CharacterSelect;
