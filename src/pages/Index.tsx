import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ThreeCanvas from "@/components/ThreeCanvas";
import { GameRenderer } from "@/game/three/GameRenderer";
import { loadTopRuns } from "@/game/bestRuns";

// Anchor Yards: sodium lamps match the amber accent
const HERO_WORLD = 3;

const createHero = (canvas: HTMLCanvasElement) => {
  const view = new GameRenderer(canvas);
  view.setCharacter("lift_off");
  return view;
};

const Index = () => {
  const navigate = useNavigate();
  const best = loadTopRuns()[0];

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <ThreeCanvas
        create={createHero}
        frame={(view, dt) => view.renderAttract(HERO_WORLD, dt)}
        className="absolute inset-0 h-full w-full"
      />
      {/* Neutral scrim so the copy reads over the scene */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/60 to-transparent sm:bg-gradient-to-r sm:via-background/40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <TopBar />

      <main className="relative z-10 flex flex-1 items-start px-6 pb-24 pt-8 sm:items-center sm:px-8 sm:pb-16 sm:pt-0">
        <div className="max-w-xl animate-enter">
          <h1 className="text-[40px] font-medium leading-[1.04] tracking-[-0.03em] sm:text-[64px]">
            Outrun the lag
          </h1>
          <p className="mt-4 max-w-md text-lg leading-7 text-subtle">
            Race down a failing network in hover craft and a car that flies. Ride the relay lanes, jump the jams and keep your ping low for 50 levels.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <button onClick={() => navigate("/play")} className="btn-primary">
              <Play className="h-4 w-4" strokeWidth={1.5} />
              Play
            </button>
            <button onClick={() => navigate("/runs")} className="btn-secondary">
              Best runs
            </button>
          </div>
          {best && (
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Best run {best.score.toLocaleString()} · level {best.level}
            </p>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
