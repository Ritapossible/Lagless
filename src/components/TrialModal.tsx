import { loadProgress, countEligibleTrials, TRIAL_SECONDS } from "@/game/playerProgress";
import { isDailyRewardAvailable } from "@/game/dailyMissions";
import { Check, Circle } from "lucide-react";

interface Props {
  onAccept: () => void;
  onDecline: () => void;
  trialsAvailable?: number;
}

// Offers a short run in Clear Channel, the final world, before it is unlocked
const TrialModal = ({ onAccept, onDecline, trialsAvailable: trialsAvailableProp }: Props) => {
  const progress = loadProgress();
  const trialsAvailable = trialsAvailableProp ?? countEligibleTrials(progress);

  const conditions = [
    { label: "Reach level 10", met: progress.highestLevel >= 10 },
    { label: "Fly 5 runs", met: progress.totalRuns >= 5 },
    { label: "Finish today's missions", met: isDailyRewardAvailable() },
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/90 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-enter">
        <p className="text-sm text-primary">Trial unlocked</p>
        <h2 className="mt-2 text-[28px] font-medium leading-tight">Fly Clear Channel for {TRIAL_SECONDS / 60} minutes</h2>
        <p className="mt-3 text-sm leading-5 text-subtle">
          A preview of the final world, normally reached at level 40: fastest track, fewest hazards, hardest hits. Each trial is offered once.
        </p>

        <ul className="mt-6 space-y-2">
          {conditions.map(({ label, met }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              {met
                ? <Check className="h-4 w-4 text-positive" strokeWidth={1.5} />
                : <Circle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
              <span className={met ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {trialsAvailable} {trialsAvailable === 1 ? "trial" : "trials"} available
        </p>

        <div className="mt-8 flex gap-3">
          <button onClick={onAccept} className="btn-primary flex-1">Start trial</button>
          <button onClick={onDecline} className="btn-secondary">Later</button>
        </div>
      </div>
    </div>
  );
};

export default TrialModal;
