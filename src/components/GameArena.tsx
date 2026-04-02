import { useRef, useEffect, useCallback, useState } from "react";
import { createInitialState, updateGame, switchLane, jump, activateAbility } from "@/game/engine";
import { renderGame } from "@/game/renderer";
import { GameState, WORLDS } from "@/game/types";
import { playLaneSwitch, playJump, playPickup, playHit, playAbility, playLevelUp, playGameOver, startBGM, stopBGM, resumeAudio } from "@/game/audio";
import { updateAfterRun, loadProgress, markTrialConditionUsed, checkOptimumTrialEligibility, updateResumeNode, calculateResumeNode } from "@/game/playerProgress";
import GameHUD from "./GameHUD";
import GameOverScreen from "./GameOverScreen";
import OptimumTrialModal from "./OptimumTrialModal";

const GameArena = ({ onExit, character, startLevel = 1 }: { onExit: () => void; character?: import("@/game/types").Character; startLevel?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(character, startLevel));
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [hudState, setHudState] = useState<GameState>(stateRef.current);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialChecked, setTrialChecked] = useState(false);
  const characterRef = useRef(character);
  const trialActiveRef = useRef(false);
  const trialRunRef = useRef(false); // tracks if current/last run was a trial
  const trialTimerRef = useRef(0);

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
      // Only track real run stats (not trial runs) for progress
      const progress = updateAfterRun(stateRef.current.level, stateRef.current.score, Math.max(stateRef.current.bestCombo, stateRef.current.comboMultiplier));
      if (checkOptimumTrialEligibility(progress)) {
        setShowTrialModal(true);
      }
      setTrialChecked(true);
    } else if (showGameOver && !trialChecked && trialRunRef.current) {
      setTrialChecked(true);
    }
  }, [showGameOver, trialChecked]);

  const startGameLoop = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
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
            failureCause: "Preview Signal Lost",
            levelUpDisplay: 2.5,
            levelUpName: "⏱ TRIAL ENDED",
            audioEvents: { ...stateRef.current.audioEvents, gameOver: true },
          };
          markTrialConditionUsed(loadProgress());
          trialActiveRef.current = false;
          // Stop BGM immediately
          playGameOver();
          stopBGM();
          // Render final frame, then delay showing game over screen
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          const dpr2 = window.devicePixelRatio || 1;
          ctx.scale(dpr2, dpr2);
          renderGame(ctx, stateRef.current, canvas.clientWidth, canvas.clientHeight);
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
                { text: `⚡ Resume Node L${updated.lastResumeNodeLevel}`, x: 0.5, y: 0.35, life: 2.5, color: '#00ff88' },
              ],
            };
          }
        }
      }
      if (ae.gameOver) { playGameOver(); stopBGM(); }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      renderGame(ctx, stateRef.current, canvas.clientWidth, canvas.clientHeight);

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    startGameLoop(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [startGameLoop]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
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
      if (e.key === "ArrowLeft" || e.key === "a") {
        stateRef.current = switchLane(stateRef.current, -1);
        playLaneSwitch();
      } else if (e.key === "ArrowRight" || e.key === "d") {
        stateRef.current = switchLane(stateRef.current, 1);
        playLaneSwitch();
      } else if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        stateRef.current = jump(stateRef.current);
        playJump();
      } else if (e.key === "e" || e.key === "Shift") {
        stateRef.current = activateAbility(stateRef.current);
        playAbility();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleAbility = useCallback(() => {
    stateRef.current = activateAbility(stateRef.current);
    playAbility();
  }, []);

  const handlePause = useCallback(() => {
    stateRef.current = { ...stateRef.current, paused: !stateRef.current.paused };
    setHudState({ ...stateRef.current });
  }, []);

  const handleRestart = useCallback(() => {
    trialActiveRef.current = false;
    trialTimerRef.current = 0;
    stateRef.current = createInitialState(characterRef.current, startLevel);
    stateRef.current.running = true;
    lastTimeRef.current = 0;
    setShowGameOver(false);
    setTrialChecked(false);
    setHudState(stateRef.current);
    startBGM();
    const canvas = canvasRef.current;
    if (canvas) startGameLoop(canvas);
  }, [startGameLoop]);

  const handleStartTrial = useCallback(() => {
    setShowTrialModal(false);
    trialActiveRef.current = true;
    trialTimerRef.current = 60; // 60-second trial

    // Create a fresh state starting at Level 40 (Optimum Layer)
    stateRef.current = createInitialState(characterRef.current, 40);
    stateRef.current.running = true;
    lastTimeRef.current = 0;
    setShowGameOver(false);
    setTrialChecked(true);
    setHudState(stateRef.current);
    startBGM();
    const canvas = canvasRef.current;
    if (canvas) startGameLoop(canvas);
  }, [startGameLoop]);

  const handleDeclineTrial = useCallback(() => {
    setShowTrialModal(false);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {!showInstructions && (
        <GameHUD
          state={hudState}
          onAbility={handleAbility}
          onPause={handlePause}
          trialTimer={trialActiveRef.current ? Math.max(0, trialTimerRef.current) : undefined}
        />
      )}
      {showGameOver && !showTrialModal && (
        <GameOverScreen state={hudState} onRestart={handleRestart} onExit={onExit} />
      )}
      {showTrialModal && (
        <OptimumTrialModal onAccept={handleStartTrial} onDecline={handleDeclineTrial} />
      )}
      {hudState.paused && !showGameOver && !showInstructions && (
        <div className="absolute inset-0 bg-space-dark/80 flex flex-col items-center justify-center z-20">
          <h2 className="font-display text-3xl font-bold neon-glow mb-8">Paused</h2>
          <button
            onClick={handlePause}
            className="px-8 py-3 font-display text-lg tracking-widest uppercase border-2 border-primary rounded-xl bg-primary/10 neon-box active:scale-95 transition-transform mb-4"
          >
            Resume
          </button>
          <button
            onClick={onExit}
            className="px-8 py-3 font-display text-sm tracking-widest uppercase text-muted-foreground active:scale-95 transition-transform"
          >
            Exit
          </button>
        </div>
      )}
      {showInstructions && (
        <div className="absolute inset-0 bg-space-dark/95 backdrop-blur-sm flex flex-col items-center z-30 px-4 animate-fade-in overflow-y-auto py-10">
          <h2 className="font-display text-2xl font-bold neon-glow mb-1">How to Play</h2>
          <p className="text-muted-foreground text-xs mb-4">Route packets through the network</p>
          <div className="max-w-sm w-full space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-lg">👆</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Swipe Left / Right</p>
                <p className="text-xs">Switch between 3 network lanes. Blue lanes boost combos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-lg">⬆️</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Tap / Swipe Up</p>
                <p className="text-xs">Jump over spam packets and data storms.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Ability (Bottom-Right)</p>
                <p className="text-xs">Activate your character's unique skill with cooldown.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-3">
              <span className="text-lg">🔴</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Avoid Red Lanes</p>
                <p className="text-xs">Congested lanes drain latency. Collapsing lanes deal damage.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl p-3">
              <span className="text-lg">💎</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Collect Relay Pickups</p>
                <p className="text-xs">Diamonds refill latency. Green pickups restore health.</p>
              </div>
            </div>
            {/* Progression retention info */}
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-lg">📡</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Resume Nodes</p>
                <p className="text-xs">L1–9: No saves. L10–19: Checkpoint every 3 levels. L20–39: Every 2 levels. L40+: Retry from failed level.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-lg">🌐</span>
              <div>
                <p className="text-foreground font-semibold text-sm">5 Network Stages</p>
                <p className="text-xs">Congestion Zone → Fragmented Grid → Mesh Awakening → FlexNode Dominion → Optimum Layer (L40+).</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="mt-5 px-10 py-3 font-display text-lg tracking-widest uppercase border-2 border-primary rounded-xl bg-primary/10 neon-box active:scale-95 transition-transform"
          >
            Start
          </button>
          <button
            onClick={() => setShowInstructions(false)}
            className="mt-2 px-6 py-2 font-display text-xs tracking-widest uppercase text-muted-foreground active:scale-95 transition-transform"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
};

export default GameArena;
