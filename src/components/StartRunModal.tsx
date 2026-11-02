import { ChevronRight, RotateCcw, Flag } from "lucide-react";
import { loadProgress } from "@/game/playerProgress";
import { WORLDS } from "@/game/types";
import ScreenHeader from "./ScreenHeader";

interface StartRunModalProps {
  onStart: (startLevel: number) => void;
  onBack: () => void;
}

function worldFor(level: number) {
  if (level >= 40) return WORLDS[4].name;
  if (level >= 33) return WORLDS[3].name;
  if (level >= 26) return WORLDS[2].name;
  if (level >= 13) return WORLDS[1].name;
  return WORLDS[0].name;
}

const StartRunModal = ({ onStart, onBack }: StartRunModalProps) => {
  const progress = loadProgress();
  const resumeLevel = Math.min(progress.lastResumeNodeLevel, 49);
  const hasResumeNode = resumeLevel > 0;

  const options = [
    ...(hasResumeNode
      ? [{ icon: Flag, title: "Resume from checkpoint", meta: worldFor(resumeLevel), level: resumeLevel, primary: true }]
      : []),
    { icon: RotateCcw, title: "New run", meta: WORLDS[0].name, level: 1, primary: !hasResumeNode },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background px-6 sm:px-8">
      <ScreenHeader title="Start a run" onBack={onBack} backLabel="Runners" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-16">
        <div className="space-y-2 animate-enter">
          {options.map(({ icon: Icon, title, meta, level, primary }) => (
            <button
              key={title}
              type="button"
              onClick={(e) => { e.stopPropagation(); onStart(level); }}
              className={`flex h-[72px] w-full items-center gap-4 rounded-2xl border px-5 text-left transition-colors ${
                primary ? "border-primary/50 bg-secondary hover:bg-[#222735]" : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${primary ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
              <span className="flex-1">
                <span className="block text-[15px] font-medium">{title}</span>
                <span className="block text-sm text-subtle">{meta}</span>
              </span>
              <span className="font-mono text-sm tabular-nums text-subtle">Lv {level}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
          ))}
        </div>
        {hasResumeNode && (
          <p className="mt-4 text-sm text-muted-foreground">
            Checkpoints save as you pass them, from level 10 on.
          </p>
        )}
      </div>
    </div>
  );
};

export default StartRunModal;
