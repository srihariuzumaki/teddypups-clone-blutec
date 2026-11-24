/** One shared requestAnimationFrame loop for every mascot (the original used framer-motion's frame loop). */
type Tick = (now: number) => void;

const ticks = new Set<Tick>();
let raf = 0;

function run() {
  raf = 0;
  const now = performance.now();
  for (const t of [...ticks]) t(now);
  if (ticks.size) raf = requestAnimationFrame(run);
}

/** Run `fn` every frame until the returned function is called. */
export function everyFrame(fn: Tick) {
  ticks.add(fn);
  if (!raf) raf = requestAnimationFrame(run);
  return () => {
    ticks.delete(fn);
    if (!ticks.size && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const clock = () => performance.now() / 1000;
