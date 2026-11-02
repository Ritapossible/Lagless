import { useState } from "react";
import BuiltByFooter from "./BuiltByFooter";
import ScreenHeader from "./ScreenHeader";
import ThreeCanvas from "./ThreeCanvas";
import { CHARACTERS, Character } from "@/game/types";
import { RUNNER_INFO } from "@/game/runners";
import { CraftStage } from "@/game/three/CraftStage";

interface Props {
  onSelect: (character: Character) => void;
  onBack: () => void;
}

const CharacterSelect = ({ onSelect, onBack }: Props) => {
  const [selected, setSelected] = useState(0);
  const runner = CHARACTERS[selected];
  const info = RUNNER_INFO[runner.ability];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background px-6 sm:px-8">
      <ScreenHeader title="Choose a runner" onBack={onBack} />

      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 py-4 md:grid-cols-[1.2fr_1fr]">
        {/* The craft on its stand is the one rich thing on this screen */}
        <ThreeCanvas
          key={runner.ability}
          create={(canvas) => {
            const stage = new CraftStage(canvas);
            stage.setCraft(runner.ability);
            return stage;
          }}
          frame={(stage, dt) => stage.render(dt)}
          className="aspect-[4/3] w-full"
        />

        <div className="animate-enter">
          <h2 className="text-[32px] font-medium leading-none">{runner.name}</h2>
          <p className="mt-2 text-sm text-subtle">{info.craft}</p>

          <div className="surface mt-6 p-5">
            <p className="text-sm text-muted-foreground">Ability</p>
            <p className="mt-1 text-[15px] font-medium">{info.abilityName}</p>
            <p className="mt-1 text-sm leading-5 text-subtle">{info.abilityText}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <dt className="text-sm text-muted-foreground">Lasts</dt>
                <dd className="mt-1 font-mono text-lg tabular-nums">{runner.abilityDuration / 1000} s</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Recharge</dt>
                <dd className="mt-1 font-mono text-lg tabular-nums">{runner.abilityCooldown / 1000} s</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Runner">
            {CHARACTERS.map((char, i) => (
              <button
                key={char.name}
                role="radio"
                aria-checked={selected === i}
                onClick={() => setSelected(i)}
                className={`h-11 rounded-[10px] border text-sm transition-colors ${
                  selected === i
                    ? "border-primary/60 bg-secondary text-foreground"
                    : "border-border text-subtle hover:text-foreground"
                }`}
              >
                {char.name}
              </button>
            ))}
          </div>

          <button onClick={() => onSelect(runner)} className="btn-primary mt-6 w-full">
            Fly {runner.name}
          </button>
        </div>
      </div>
      <BuiltByFooter />
    </div>
  );
};

export default CharacterSelect;
