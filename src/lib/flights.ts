import { reducedMotion } from "./mascot/loop";

/**
 * Scroll-driven plane. The route path is drawn in the SVG; as you scroll the plane slides along it,
 * tilts to the path's direction, and fades in over the first stretch (same maths as the original:
 * progress runs from "top of the card at 95% of the viewport" to "bottom of the card at 25%").
 */
function fly(box: HTMLElement) {
  const route = box.querySelector<SVGPathElement>(".tp-flight__route");
  const plane = box.querySelector<SVGGElement>("svg > g[transform]");
  if (!route || !plane) return () => {};
  const len = route.getTotalLength();
  const set = (p: number) => {
    const at = Math.min(len, Math.max(0, p * len));
    const a = route.getPointAtLength(Math.max(0, at - 1));
    const b = route.getPointAtLength(Math.min(len, at + 1));
    const c = route.getPointAtLength(at);
    const deg = (180 * Math.atan2(b.y - a.y, b.x - a.x)) / Math.PI;
    plane.setAttribute("transform", `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${deg.toFixed(1)})`);
    plane.style.opacity = String(Math.min(1, Math.max(0, (p - 0.11) / 0.06)));
  };
  if (reducedMotion()) { set(0.62); return () => {}; }
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = box.getBoundingClientRect();
    const vh = innerHeight;
    set(Math.min(1, Math.max(0, (0.95 * vh - r.top) / (0.7 * vh + r.height))));
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  update();
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  return () => { cancelAnimationFrame(raf); removeEventListener("scroll", queue); removeEventListener("resize", queue); };
}

/** Wire up every `.tp-flight` under `root`. */
export function attachFlights(root: ParentNode): () => void {
  const offs = [...root.querySelectorAll<HTMLElement>(".tp-flight")].map(fly);
  return () => offs.forEach((f) => f());
}
