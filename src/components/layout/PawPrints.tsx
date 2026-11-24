import { useEffect, useRef } from "react";
import { PAW_D } from "./pawPath";

const POOL = 16;
const STEP = 38; // px of mouse travel between footprints
const GAP = 20; // a print is only laid once the cursor is this far past it (small gap behind the pointer)

/**
 * Footprint trail that follows the mouse: sparse prints (one every STEP px), alternating feet, laid GAP px behind
 * the cursor and fading over 2.6s. Fade and opacity come from the original's print engine, where the walking mascot
 * lays them; here (by request) the mouse pointer does. Touch / pen input and reduced motion are ignored.
 */
export default function PawPrints() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const prints = [...root.children] as unknown as SVGSVGElement[];
    let idx = 0;
    let walked = 0;
    let steps = 0;
    let last: { x: number; y: number } | null = null;
    let queue: { x: number; y: number; ang: number }[] = [];
    let idle = 0;

    const stamp = (x: number, y: number, ang: number) => {
      const el = prints[idx++ % POOL];
      const s = 18;
      const side = steps & 1 ? 1 : -1; // left / right foot
      const px = x + Math.cos(ang + Math.PI / 2) * 7 * side;
      const py = y + Math.sin(ang + Math.PI / 2) * 7 * side;
      el.style.transform = `translate(${(px - s / 2).toFixed(1)}px, ${(py - s / 2).toFixed(1)}px) rotate(${(ang + Math.PI / 2).toFixed(3)}rad)`;
      el.style.width = el.style.height = `${s}px`;
      el.animate(
        [{ opacity: 0 }, { opacity: 0.45, offset: 0.08 }, { opacity: 0.45, offset: 0.5 }, { opacity: 0 }],
        { duration: 2600, easing: "ease-out" },
      );
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = { x: e.pageX, y: e.pageY };
      if (!last) { last = p; return; }
      const dx = p.x - last.x, dy = p.y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 400) { last = p; return; } // jumped (tab switch, leaving the window)
      if (dist < 0.5) return;
      const ang = Math.atan2(dy, dx);
      const before = walked;
      walked += dist;
      const a = Math.floor(before / STEP), b = Math.floor(walked / STEP);
      for (let k = a + 1; k <= Math.min(b, a + 3); k++) {
        const t = (k * STEP - before) / dist;
        queue.push({ x: last.x + dx * t, y: last.y + dy * t, ang });
      }
      last = p;
      // release prints that the cursor has left far enough behind
      while (queue.length && Math.hypot(p.x - queue[0].x, p.y - queue[0].y) >= GAP) {
        const q = queue.shift()!;
        steps++;
        stamp(q.x, q.y, q.ang);
      }
      clearTimeout(idle);
      idle = window.setTimeout(() => (queue = []), 160); // cursor stopped: no print right under it
    };
    const reset = () => { last = null; queue = []; };
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", reset);
    return () => { clearTimeout(idle); removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", reset); };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pup-prints">
      {Array.from({ length: POOL }, (_, i) => (
        <svg key={i} viewBox="0 0 64 64">
          <path d={PAW_D} />
        </svg>
      ))}
    </div>
  );
}
