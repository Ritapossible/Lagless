import { useRef, useEffect, useCallback, useState } from "react";
import { createInitialState, updateGame, switchLane, jump, activateAbility } from "@/game/engine";
import { GameRenderer } from "@/game/three/GameRenderer";
import { GameState, WORLDS } from "@/game/types";
import { playLaneSwitch, playJump, playPickup, playHit, playAbility, playLevelUp, playGameOver, playAchievement, startBGM, stopBGM, resumeAudio, suspendAudio } from "@/game/audio";
import { updateAfterRun, loadProgress, retryLevel, TRIAL_SECONDS, markTrialConditionUsed, countEligibleTrials, updateResumeNode, calculateResumeNode, completeGame } from "@/game/playerProgress";
import { updateDailyMissionsAfterRun, RunMissionStats } from "@/game/dailyMissions";
import { findNewAchievements } from "@/game/achievements";
import { toast } from "sonner";
import GameHUD from "./GameHUD";
import GameOverScreen from "./GameOverScreen";
import TrialModal from "./TrialModal";
import ScreenHeader from "./ScreenHeader";
import { recordRun } from "@/game/bestRuns";
import { isNewPlayer, relayHintActive } from "@/game/relayHint";

const GameArena = ({ onExit, onBack, character, startLevel = 1, startAsTrial = false }: { onExit: () => void; onBack?: () => void; character?: import("@/game/types").Character; startLevel?: number; startAsTrial?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const stateRef = useRef<GameState>(createInitialState(character, startAsTrial ? 40 : startLevel));
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [hudState, setHudState] = useState<GameState>(stateRef.current);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialChecked, setTrialChecked] = useState(false);
  const [remainingTrials, setRemainingTrials] = useState(0);
  const characterRef = useRef(character);
  const trialActiveRef = useRef(startAsTrial);
  const trialRunRef = useRef(startAsTrial); // tracks if current/last run was a trial
  const trialTimerRef = useRef(startAsTrial ? TRIAL_SECONDS : 0);
  // Relay coaching for new players: seconds flown this run, and whether this player still needs it
  const runTimeRef = useRef(0);
  const coachRef = useRef(!startAsTrial && isNewPlayer(loadProgress().totalRuns));
  const showRelayHint = () => relayHintActive(coachRef.current, runTimeRef.current, stateRef.current.relaysUsed);

  // Start game + BGM after instructions dismissed
  useEffect(() => {
    if (!showInstructions) {
      resumeAudio();
      startBGM();
      stateRef.current = { ...stateRef.current, running: true };
    }
    return () => { stopBGM(); };
  }, [showInstructions]);

  // Check trial eligibility when game ends
  useEffect(() => {
    if (showGameOver && !trialChecked && !trialRunRef.current) {
      const gs = stateRef.current;
      const isVictory = gs.failureCause === '__VICTORY__';
      
      const progressBefore = loadProgress();
      let progress;
      if (isVictory) {
        progress = completeGame(gs.score, Math.max(gs.bestCombo, gs.comboMultiplier));
      } else {
        progress = updateAfterRun(gs.level, gs.score, Math.max(gs.bestCombo, gs.comboMultiplier));
      }
      
      const rank = recordRun({
        score: gs.score,
        level: gs.level,
        world: gs.worldConfig.name,
        character: gs.character.name,
        bestCombo: Math.max(gs.bestCombo, gs.comboMultiplier),
        victory: isVictory,
        date: new Date().toISOString(),
      });
      if (rank > 0) {
        toast(`#${rank} in your best runs`, { description: `${Math.floor(gs.score).toLocaleString()} points`, duration: 3000 });
      }

      // Check for newly unlocked achievements
      const newAchievements = findNewAchievements(progressBefore, progress);
      newAchievements.forEach((a, i) => {
        setTimeout(() => {
          playAchievement();
          toast(`Achievement · ${a.name}`, { description: a.description, duration: 4000 });
        }, 500 + i * 1200);
      });
      
      // Update daily missions with run stats
      const missionStats: RunMissionStats = {
        latencyAbove60Seconds: gs.latencyAbove60Time,
        pickupsCollected: gs.pickupsCollected,
        relaysUsed: gs.relaysUsed,
        platformsDeployed: gs.platformsDeployed,
      };
      updateDailyMissionsAfterRun(missionStats);
      
      if (!isVictory) {
        const eligible = countEligibleTrials(progress);
        if (eligible > 0) {
          setRemainingTrials(eligible);
          setShowTrialModal(true);
        }
      }
      setTrialChecked(true);
    } else if (showGameOver && !trialChecked && trialRunRef.current) {
      // Trial run just ended — check if more trials remain
      const progress = loadProgress();
      const eligible = countEligibleTrials(progress);
      if (eligible > 0) {
        setRemainingTrials(eligible);
        setShowTrialModal(true);
      }
      setTrialChecked(true);
    }
  }, [showGameOver, trialChecked]);

  const startGameLoop = useCallback(() => {
    const view = rendererRef.current;
    if (!view) return;
    let hudCounter = 0;

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      // Trial mode timer
      if (trialActiveRef.current) {
        trialTimerRef.current -= dt;
        if (trialTimerRef.current <= 0) {
          // Trial expired — show "Trial Ended" banner then game over
          stateRef.current = {
            ...stateRef.current,
            gameOver: true,
            running: false,
            failureCause: "Trial time up",
            levelUpDisplay: 2.5,
            levelUpName: "Trial over",
            audioEvents: { ...stateRef.current.audioEvents, gameOver: true },
          };
          trialActiveRef.current = false;
          // Stop BGM immediately
          playGameOver();
          stopBGM();
          // Render final frame, then delay showing game over screen
          view.render(stateRef.current, 0);
          setHudState({ ...stateRef.current });
          // Show game over after a short delay so player sees the banner
          setTimeout(() => {
            setShowGameOver(true);
          }, 2000);
          return; // Stop the loop — don't continue to updateGame
        }
      }

      stateRef.current = updateGame(stateRef.current, dt);

      const ae = stateRef.current.audioEvents;
      if (ae.hit) playHit();
      if (ae.pickup) playPickup();
      if (ae.levelUp) {
        playLevelUp();
        // Track resume node on level-up (skip during trial mode)
        if (!trialActiveRef.current) {
          const lvl = stateRef.current.level;
          const prevProgress = loadProgress();
          const prevResume = prevProgress.lastResumeNodeLevel;
          const updated = updateResumeNode(lvl);
          if (updated.lastResumeNodeLevel > prevResume) {
            stateRef.current = {
              ...stateRef.current,
              floatingTexts: [
                ...stateRef.current.floatingTexts,
                { text: `Checkpoint saved · Lv ${updated.lastResumeNodeLevel}`, x: 0.5, y: 0.35, life: 2.5, color: '#4cc38a' },
              ],
            };
          }
        }
      }
      if (ae.gameOver) { playGameOver(); stopBGM(); }

      if (stateRef.current.running && !stateRef.current.paused) runTimeRef.current += dt;
      view.render(stateRef.current, dt, showRelayHint());

      hudCounter++;
      if (hudCounter % 4 === 0) {
        setHudState({ ...stateRef.current });
      }

      if (stateRef.current.gameOver) {
        setHudState({ ...stateRef.current });
        setShowGameOver(true);
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = new GameRenderer(canvas);
    rendererRef.current = view;

    const resize = () => view.resize(canvas.clientWidth, canvas.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    startGameLoop();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      view.dispose();
      rendererRef.current = null;
    };
  }, [startGameLoop]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  // Controls only act on a run in progress, not on the how-to-play screen, while paused or after the end
  const canControl = () => {
    const s = stateRef.current;
    return s.running && !s.paused && !s.gameOver;
  };

  const triggerAbility = () => {
    const before = stateRef.current;
    stateRef.current = activateAbility(before);
    if (stateRef.current.abilityActive && !before.abilityActive) playAbility();
  };

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    if (!canControl()) { touchStartRef.current = null; return; }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (dt < 300 && absDx < 20 && absDy < 20) {
      stateRef.current = jump(stateRef.current);
      playJump();
    } else if (absDx > absDy && absDx > 30) {
      stateRef.current = switchLane(stateRef.current, dx > 0 ? 1 : -1);
      playLaneSwitch();
    } else if (dy < -40) {
      stateRef.current = jump(stateRef.current);
      playJump();
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const gameKey = ["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w", "e", "Shift"].includes(key);
      if (!gameKey || !canControl()) return;
      // Stop Space from also pressing whichever HUD button last had focus
      e.preventDefault();
      if (key === "ArrowLeft" || key === "a") {
        stateRef.current = switchLane(stateRef.current, -1);
        playLaneSwitch();
      } else if (key === "ArrowRight" || key === "d") {
        stateRef.current = switchLane(stateRef.current, 1);
        playLaneSwitch();
      } else if (key === " " || key === "ArrowUp" || key === "w") {
        stateRef.current = jump(stateRef.current);
        playJump();
      } else if (key === "e" || key === "Shift") {
        triggerAbility();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleAbility = useCallback(() => {
    if (canControl()) triggerAbility();
  }, []);

  // Leaving the app or tab mid-run pauses it and silences the music, so nothing is lost while away
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        suspendAudio();
        if (canControl()) {
          stateRef.current = { ...stateRef.current, paused: true };
          setHudState({ ...stateRef.current });
        }
      } else {
        resumeAudio();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handlePause = useCallback(() => {
    stateRef.current = { ...stateRef.current, paused: !stateRef.current.paused };
    setHudState({ ...stateRef.current });
  }, []);

  // Retry resumes from the checkpoint this run passed. After a trial, the player goes back to their own
  // progress: a trial previews Clear Channel, it doesn't unlock it.
  const nextRunLevel = useCallback(() => {
    const gs = stateRef.current;
    if (gs.failureCause === '__VICTORY__') return 1;
    if (trialRunRef.current) return loadProgress().lastResumeNodeLevel || 1;
    return retryLevel(gs.level, startLevel);
  }, [startLevel]);

  const handleRestart = useCallback(() => {
    const restartLevel = nextRunLevel();
    trialActiveRef.current = false;
    trialRunRef.current = false;
    trialTimerRef.current = 0;
    stateRef.current = createInitialState(characterRef.current, restartLevel);
    stateRef.current.running = true;
    lastTimeRef.current = 0;
    runTimeRef.current = 0;
    coachRef.current = isNewPlayer(loadProgress().totalRuns);
    setShowGameOver(false);
    setTrialChecked(false);
    setHudState(stateRef.current);
    startBGM();
    startGameLoop();
  }, [startGameLoop, nextRunLevel]);

  const handleStartTrial = useCallback(() => {
    setShowTrialModal(false);
    // Mark the condition as used immediately when player accepts
    markTrialConditionUsed();
    setRemainingTrials(prev => prev - 1);
    trialActiveRef.current = true;
    trialRunRef.current = true;
    trialTimerRef.current = TRIAL_SECONDS;

    // Create a fresh state starting at Level 40 (Clear Channel)
    stateRef.current = createInitialState(characterRef.current, 40);
    stateRef.current.running = true;
    lastTimeRef.current = 0;
    runTimeRef.current = 0;
    coachRef.current = false;
    setShowGameOver(false);
    // Reset trialChecked so after this trial ends, we check for remaining trials
    setTrialChecked(false);
    setHudState(stateRef.current);
    startBGM();
    startGameLoop();
  }, [startGameLoop]);

  const handleDeclineTrial = useCallback(() => {
    setShowTrialModal(false);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {!showInstructions && (
        <GameHUD
          state={hudState}
          onAbility={handleAbility}
          onPause={handlePause}
          trialTimer={trialActiveRef.current ? Math.max(0, trialTimerRef.current) : undefined}
          relayHint={showRelayHint()}
        />
      )}
      {showGameOver && !showTrialModal && (
        <GameOverScreen state={hudState} retryLevel={nextRunLevel()} onRestart={handleRestart} onExit={onExit} />
      )}
      {showTrialModal && (
        <TrialModal onAccept={handleStartTrial} onDecline={handleDeclineTrial} trialsAvailable={remainingTrials} />
      )}
      {hudState.paused && !showGameOver && !showInstructions && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs animate-enter text-center">
            <h2 className="text-[28px] font-medium">Paused</h2>
            <p className="mt-2 font-mono text-sm text-subtle">Lv {hudState.level} · {Math.floor(hudState.score).toLocaleString()}</p>
            <button onClick={handlePause} className="btn-primary mt-8 w-full">Resume</button>
            <button onClick={onExit} className="btn-secondary mt-3 w-full">Quit to home</button>
          </div>
        </div>
      )}
      {showInstructions && <HowToPlay onStart={() => setShowInstructions(false)} onBack={onBack || onExit} />}
    </div>
  );
};

const CONTROLS = [
  { action: "Switch lane", keys: ["←", "→"], touch: "Swipe left or right" },
  { action: "Jump", keys: ["Space"], touch: "Tap or swipe up" },
  { action: "Ability", keys: ["E"], touch: "Button, bottom right" },
];

const RULES = [
  { title: "Keep your latency budget", text: "It drains every second and fast on red lanes. At 0 ms the run times out." },
  { title: "Ride the teal lanes", text: "Relay lanes refill the budget and build your combo. Teal diamonds refill it too." },
  { title: "Jump the hazards", text: "Crates, storm pylons and broken gates cost hull. Green crosses repair it, amber coins add score." },
  { title: "Five worlds, 50 levels", text: "Boss waves at 25 and 39. Checkpoints save from level 10, so a long run is never lost." },
];

const HowToPlay = ({ onStart, onBack }: { onStart: () => void; onBack: () => void }) => (
  <div className="absolute inset-0 z-30 overflow-y-auto bg-background/85 px-6 backdrop-blur-sm sm:px-8">
    <ScreenHeader title="How to play" onBack={onBack} />
    <div className="mx-auto grid max-w-4xl gap-8 pb-10 pt-4 md:grid-cols-2 animate-enter">
      <section>
        <h2 className="text-sm text-muted-foreground">Controls</h2>
        <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {CONTROLS.map(({ action, keys, touch }) => (
            <div key={action} className="flex h-14 items-center gap-4 px-5">
              <dt className="flex-1 text-[15px]">{action}</dt>
              <dd className="hidden gap-1 sm:flex">{keys.map(k => <kbd key={k} className="keycap">{k}</kbd>)}</dd>
              <dd className="text-sm text-subtle sm:hidden">{touch}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2 className="text-sm text-muted-foreground">Rules</h2>
        <ul className="mt-3 space-y-4">
          {RULES.map(({ title, text }) => (
            <li key={title}>
              <p className="text-[15px] font-medium">{title}</p>
              <p className="mt-1 text-sm leading-5 text-subtle">{text}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-background/95 px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none md:col-span-2">
        <button onClick={onStart} className="btn-primary w-full md:w-auto md:px-10">Start run</button>
      </div>
    </div>
  </div>
);

export default GameArena;
