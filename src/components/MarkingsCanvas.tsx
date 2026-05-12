import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eraser, Undo2 } from "lucide-react";

const COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#111111" },
  { name: "Brown", value: "#7a4a2b" },
  { name: "Red", value: "#c0392b" },
];
const SIZES = [
  { name: "S", value: 3 },
  { name: "M", value: 7 },
  { name: "L", value: 14 },
];

// Simple horse side-view silhouette outline (SVG, drawn as background).
const HORSE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'>
  <rect width='800' height='400' fill='#fafaf6'/>
  <g fill='none' stroke='#8a8a8a' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
    <!-- Body -->
    <path d='M230 190 C 230 170, 250 150, 280 145
      C 300 140, 320 138, 340 135
      C 350 130, 355 120, 355 110
      C 355 100, 350 90, 340 85
      L 335 75 C 330 68, 340 60, 348 65
      L 355 70 C 360 62, 358 52, 365 48
      C 370 45, 378 50, 375 58
      C 373 64, 370 70, 375 78
      C 380 85, 385 95, 385 108
      C 385 118, 382 128, 378 138
      C 395 135, 415 132, 440 132
      C 500 132, 540 138, 570 148
      C 590 155, 610 168, 620 180
      C 630 175, 638 165, 645 160
      C 650 157, 655 158, 653 163
      C 650 170, 640 182, 632 190
      C 640 205, 645 225, 645 245
      L 648 290 C 649 300, 648 308, 642 310
      L 635 310 C 632 308, 632 302, 633 295
      L 635 260 C 632 245, 625 232, 618 225
      C 600 235, 570 242, 540 245
      L 538 290 C 537 300, 536 308, 530 310
      L 523 310 C 520 308, 520 302, 521 295
      L 525 260 C 510 262, 480 262, 460 260
      C 440 258, 410 252, 390 245
      L 385 290 C 384 300, 383 308, 377 310
      L 370 310 C 367 308, 367 302, 368 295
      L 372 260 C 350 252, 330 242, 315 230
      C 300 240, 285 248, 270 252
      L 265 290 C 264 300, 263 308, 257 310
      L 250 310 C 247 308, 247 302, 248 295
      L 252 260 C 240 250, 230 235, 228 218
      C 227 208, 228 198, 230 190 Z' />
    <!-- Eye -->
    <circle cx='360' cy='95' r='3' fill='#8a8a8a'/>
    <!-- Nostril -->
    <ellipse cx='341' cy='80' rx='2' ry='1.5' fill='#8a8a8a'/>
    <!-- Ear -->
    <path d='M365 48 C 362 38, 365 28, 370 22 C 373 28, 374 38, 375 48' />
    <!-- Mane -->
    <path d='M355 55 C 350 65, 345 80, 340 95 C 338 100, 335 110, 335 120 C 332 130, 330 140, 340 145' />
    <!-- Tail -->
    <path d='M230 190 C 215 185, 200 175, 185 180 C 170 185, 160 200, 155 215 C 150 230, 155 240, 165 235 C 170 230, 180 215, 190 205 C 200 200, 215 198, 228 198' />
    <!-- Hooves -->
    <path d='M248 305 L 248 315 C 248 318, 258 318, 258 315 L 258 305' />
    <path d='M368 305 L 368 315 C 368 318, 378 318, 378 315 L 378 305' />
    <path d='M521 305 L 521 315 C 521 318, 531 318, 531 315 L 531 305' />
    <path d='M633 305 L 633 315 C 633 318, 643 318, 643 315 L 643 305' />
  </g>
</svg>`;

type Stroke = { color: string; size: number; points: { x: number; y: number }[] };

export function MarkingsCanvas({
  initialUrl,
  onChange,
}: {
  initialUrl?: string | null;
  onChange: (blob: Blob | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);
  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState(SIZES[1].value);

  // Load background silhouette once.
  useEffect(() => {
    const img = new Image();
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(HORSE_SVG);
    img.onload = () => {
      bgRef.current = img;
      redraw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize canvas to container width while keeping 2:1 aspect ratio.
  useEffect(() => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;
    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      const h = Math.round(w / 2);
      const dpr = window.devicePixelRatio || 1;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw whenever strokes change.
  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  function redraw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const w = c.clientWidth;
    const h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, w, h);
    const all = drawingRef.current ? [...strokes, drawingRef.current] : strokes;
    for (const s of all) {
      if (s.points.length === 0) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }
  }

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = { color, size, points: [pointFromEvent(e)] };
    redraw();
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current.points.push(pointFromEvent(e));
    redraw();
  }
  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const finished = drawingRef.current;
    drawingRef.current = null;
    const next = [...strokes, finished];
    setStrokes(next);
    setTimeout(emitCanvasChange, 0);
  }

  function emitCanvasChange() {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => onChange(blob), "image/png");
  }

  function undo() {
    setStrokes((s) => {
      const next = s.slice(0, -1);
      setTimeout(() => (next.length ? emitCanvasChange() : onChange(null)), 0);
      return next;
    });
  }
  function clearAll() {
    setStrokes([]);
    setTimeout(() => onChange(null), 0);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Color</span>
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              title={c.name}
              className={cn(
                "h-6 w-6 cursor-pointer rounded-full border-2 transition",
                color === c.value
                  ? "border-secondary ring-2 ring-secondary/40"
                  : "border-muted-foreground/30",
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Brush</span>
          {SIZES.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setSize(s.value)}
              className={cn(
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border text-xs",
                size === s.value
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-muted-foreground/30",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={strokes.length === 0}
          >
            <Undo2 className="mr-1 h-3 w-3" /> Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={strokes.length === 0}
          >
            <Eraser className="mr-1 h-3 w-3" /> Clear
          </Button>
        </div>
      </div>
      <div ref={wrapRef} className="overflow-hidden rounded-md border bg-cream/30">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="block w-full touch-none"
          style={{ cursor: "crosshair" }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Draw markings directly on the horse outline. The drawing saves with the registration.
        {initialUrl && !strokes.length ? " A previously saved drawing exists." : ""}
      </p>
    </div>
  );
}
