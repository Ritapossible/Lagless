import { useRef, useEffect, useCallback, useState } from "react";
import { createInitialState, updateGame, switchLane, jump, activateAbility } from "@/game/engine";
import { renderGame } from "@/game/renderer";
import { GameState } from "@/game/types";
import { playLaneSwitch, playJump, playPickup, playHit, playAbility, playLevelUp, playGameOver, startBGM, stopBGM, resumeAudio } from "@/game/audio";
import GameHUD from "./GameHUD";
import GameOverScreen from "./GameOverScreen";

const GameArena = ({ onExit, character }: { onExit: () => void; character?: import("@/game/types").Character }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(character));
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [hudState, setHudState] = useState<GameState>(stateRef.current);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const characterRef = useRef(character);

  // Start game + BGM after instructions dismissed
  useEffect(() => {
    if (!showInstructions) {
      resumeAudio();
      startBGM();
      stateRef.current = { ...stateRef.current, running: true };
    }
    return () => { stopBGM(); };
  }, [showInstructions]);

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

    let hudCounter = 0;

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      stateRef.current = updateGame(stateRef.current, dt);

      // Process audio events
      const ae = stateRef.current.audioEvents;
      if (ae.hit) playHit();
      if (ae.pickup) playPickup();
      if (ae.levelUp) playLevelUp();
      if (ae.gameOver) { playGameOver(); stopBGM(); }

      // Reset scale before drawing
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);

      renderGame(ctx, stateRef.current, canvas.clientWidth, canvas.clientHeight);

      // Update HUD at 15fps
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

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

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
    stateRef.current = createInitialState(characterRef.current);
    stateRef.current.running = true;
    lastTimeRef.current = 0;
    setShowGameOver(false);
    setHudState(stateRef.current);
    animRef.current = requestAnimationFrame(function loop(time: number) {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      stateRef.current = updateGame(stateRef.current, dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      renderGame(ctx, stateRef.current, canvas.clientWidth, canvas.clientHeight);
      
      if (stateRef.current.gameOver) {
        setHudState({ ...stateRef.current });
        setShowGameOver(true);
        return;
      }

      setHudState({ ...stateRef.current });
      animRef.current = requestAnimationFrame(loop);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {!showInstructions && <GameHUD state={hudState} onAbility={handleAbility} onPause={handlePause} />}
      {showGameOver && (
        <GameOverScreen state={hudState} onRestart={handleRestart} onExit={onExit} />
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
        <div className="absolute inset-0 bg-space-dark/95 backdrop-blur-sm flex flex-col items-center justify-center z-30 px-6 animate-fade-in">
          <h2 className="font-display text-2xl font-bold neon-glow mb-6">How to Play</h2>
          <div className="max-w-sm w-full space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-xl">👆</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Swipe Left / Right</p>
                <p className="text-xs">Switch between 3 lanes to avoid obstacles and find optimal routes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-xl">⬆️</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Tap / Swipe Up</p>
                <p className="text-xs">Jump over obstacles. Keyboard: Space or W.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Ability Button</p>
                <p className="text-xs">Activate your character's unique skill. Keyboard: E or Shift.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl p-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-foreground font-semibold text-sm">Tips</p>
                <p className="text-xs">Stay on blue lanes for speed. Collect relay diamonds to refill your latency timer. Avoid red congested lanes!</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="mt-8 px-10 py-3 font-display text-lg tracking-widest uppercase border-2 border-primary rounded-xl bg-primary/10 neon-box active:scale-95 transition-transform"
          >
            Start
          </button>
          <button
            onClick={() => setShowInstructions(false)}
            className="mt-3 px-6 py-2 font-display text-xs tracking-widest uppercase text-muted-foreground active:scale-95 transition-transform"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
};

export default GameArena;
