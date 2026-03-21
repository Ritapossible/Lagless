import { useRef, useEffect, useCallback, useState } from "react";
import { createInitialState, updateGame, switchLane, jump, activateAbility } from "@/game/engine";
import { renderGame } from "@/game/renderer";
import { GameState } from "@/game/types";
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

  // Start game
  useEffect(() => {
    stateRef.current = { ...stateRef.current, running: true };
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

    let hudCounter = 0;

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      stateRef.current = updateGame(stateRef.current, dt);

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
      // Tap = jump
      stateRef.current = jump(stateRef.current);
    } else if (absDx > absDy && absDx > 30) {
      // Horizontal swipe = lane switch
      stateRef.current = switchLane(stateRef.current, dx > 0 ? 1 : -1);
    } else if (dy < -40) {
      // Swipe up = jump
      stateRef.current = jump(stateRef.current);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        stateRef.current = switchLane(stateRef.current, -1);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        stateRef.current = switchLane(stateRef.current, 1);
      } else if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        stateRef.current = jump(stateRef.current);
      } else if (e.key === "e" || e.key === "Shift") {
        stateRef.current = activateAbility(stateRef.current);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleAbility = useCallback(() => {
    stateRef.current = activateAbility(stateRef.current);
  }, []);

  const handlePause = useCallback(() => {
    stateRef.current = { ...stateRef.current, paused: !stateRef.current.paused };
    setHudState({ ...stateRef.current });
  }, []);

  const handleRestart = useCallback(() => {
    stateRef.current = createInitialState();
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
      <GameHUD state={hudState} onAbility={handleAbility} onPause={handlePause} />
      {showGameOver && (
        <GameOverScreen state={hudState} onRestart={handleRestart} onExit={onExit} />
      )}
      {hudState.paused && !showGameOver && (
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
    </div>
  );
};

export default GameArena;
