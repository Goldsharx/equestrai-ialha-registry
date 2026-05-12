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
  <g fill='none' stroke='#8a8a8a' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'>
    <path d='M120 270
      C 130 220, 160 200, 200 200
      L 230 180
      C 240 150, 260 130, 290 130
      C 305 110, 330 110, 340 130
      C 360 130, 370 150, 365 175
      L 380 195
      C 430 200, 500 195, 560 200
      C 600 200, 640 215, 660 240
      C 680 250, 700 270, 700 290
      L 690 300
      L 685 360
      L 670 360
      L 670 305
      L 600 305
      L 595 360
      L 580 360
      L 580 305
      C 510 305, 380 305, 290 305
      L 285 360
      L 270 360
      L 270 305
      L 200 305
      L 195 360
      L 180 360
      L 185 295
      C 150 290, 130 285, 120 270 Z' />
    <circle cx='320' cy='150' r='3' fill='#8a8a8a'/>
    <path d='M295 130 L 310 115' />
    <path d='M335 130 L 348 115' />
    <path d='M370 200 C 360 230, 350 260, 340 280' />
    <path d='M120 270 C 110 265, 100 280, 95 295 C 90 305, 100 305, 110 295' />
  </g>
</svg>`;

type Stroke = { color: string; size: number; points: { x: number; y: number }[] };

export function MarkingsCanvas({
  initialUrl,
  onSave,
}: {
  initialUrl?: string | null;
  onSave: (blob: Blob) => Promise<void> | void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);
  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState(SIZES[1].value);
  const [saving, setSaving] = useState(false);

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
  async function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const finished = drawingRef.current;
    drawingRef.current = null;
    const next = [...strokes, finished];
    setStrokes(next);
    // Persist after stroke completes.
    await persist();
  }

  async function persist() {
    const c = canvasRef.current;
    if (!c) return;
    setSaving(true);
    try {
      const blob: Blob | null = await new Promise((resolve) =>
        c.toBlob((b) => resolve(b), "image/png"),
      );
      if (blob) await onSave(blob);
    } finally {
      setSaving(false);
    }
  }

  function undo() {
    setStrokes((s) => s.slice(0, -1));
    // Persist after a tick so canvas reflects new state.
    setTimeout(persist, 0);
  }
  function clearAll() {
    setStrokes([]);
    setTimeout(persist, 0);
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
        {saving ? "Saving drawing…" : "Draw markings directly on the horse outline. Changes save automatically."}
        {initialUrl && !strokes.length ? " A previously saved drawing exists." : ""}
      </p>
    </div>
  );
}
