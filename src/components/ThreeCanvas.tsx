import { useEffect, useRef } from "react";

interface View {
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

interface Props<T extends View> {
  create: (canvas: HTMLCanvasElement) => T;
  frame: (view: T, dt: number) => void;
  className?: string;
}

// Owns a WebGL canvas: creates the view, keeps it sized and runs its frame loop
function ThreeCanvas<T extends View>({ create, frame, className }: Props<T>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let view: T;
    try {
      view = create(canvas);
    } catch {
      return; // No WebGL: the page still works without the scene
    }
    const resize = () => view.resize(canvas.clientWidth, canvas.clientHeight);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let raf = 0;
    let last = 0;
    const loop = (time: number) => {
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
      last = time;
      frameRef.current(view, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      view.dispose();
    };
    // create runs once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}

export default ThreeCanvas;
