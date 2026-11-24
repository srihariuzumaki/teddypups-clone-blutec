import { ACTS, POSES, Rig, pickAct, spawnHearts, type ActCtx, type Cue, type PoseName } from "./rig";
import { clock, everyFrame, reducedMotion } from "./loop";

const PEEK_ACTS = ["peekaboo", "woof", "tilt", "sneeze"];
const SNUG_ACTS = ["tilt", "love", "sneeze", "woof"];

let pointer: { x: number; y: number; t: number } | null = null;
let pointerBound = 0;
const onPointer = (e: PointerEvent) => {
  if (e.pointerType === "mouse") pointer = { x: e.clientX, y: e.clientY, t: clock() };
};
export const lastPointer = () => pointer;

/** Make one static `.pup-buddy` come alive: blinking, wagging, looking at the cursor, petting, tricks on click. */
function bringToLife(buddy: HTMLElement): () => void {
  const svg = buddy.querySelector<SVGSVGElement>(":scope > svg");
  const bubble = buddy.querySelector<HTMLElement>(":scope > .pup-bubble");
  if (!svg || !bubble) return () => {};

  const stop = buddy.closest<HTMLElement>(".pup-stop");
  const isStop = !!stop;
  const hasLedge = svg.querySelector("[data-p=ledge]")?.getAttribute("opacity") === "1";
  const pose = ((stop?.dataset.pose ?? buddy.dataset.pose ?? (hasLedge ? "peek" : "sit")) as PoseName);
  const act = stop?.dataset.act ?? "";
  const facing = buddy.dataset.facing === "left" ? -1 : 1;

  const rig = new Rig(svg, pose, facing);
  rig.wag(0.6);
  buddy.dataset.live = "";

  let cues: Cue[] = [];
  let last = clock();
  let sayUntil = 0;
  let idleSince = last;
  let lastAct: string | null = null;
  let clickRun = 0;
  let clickAt = 0;
  let playing = false;
  let playUntil = 0;

  const ctx: ActCtx = {
    d: rig,
    rest: POSES[pose],
    facing,
    say: (text, secs = 1.4) => {
      bubble.textContent = text;
      bubble.dataset.show = "true";
      sayUntil = clock() + secs;
    },
    hearts: () => spawnHearts(buddy, buddy.clientWidth * (facing > 0 ? 0.7 : 0.3), 0.25 * buddy.clientHeight),
  };

  const step = () => {
    const now = clock();
    const dt = Math.min(0.05, now - last);
    last = now;
    while (cues.length && cues[0][0] <= now) cues.shift()![1](now);
    if (playing !== now < playUntil) {
      playing = !playing;
      buddy.toggleAttribute("data-playing", playing);
    }
    rig.lookAt(pointer && now - pointer.t < 3 ? pointer : null);
    if (act === "tilt" && !cues.length) {
      const s = Math.sin(0.9 * now);
      rig.cock(s > 0.35 ? 13 : s < -0.35 ? -10 : 0);
    }
    if (!cues.length && now - idleSince > 9) {
      idleSince = now;
      cues = Math.random() < 0.5 ? ACTS.tilt(ctx, now) : [[now, () => rig.wag(1)], [now + 2.2, () => rig.wag(0.6)]];
    }
    if (bubble.dataset.show === "true" && now > sayUntil) bubble.dataset.show = "false";
    rig.tick(dt, now);
  };

  // Only animate while on screen; while the walking mascot is out, stop-buddies stay hidden and idle.
  let on = false;
  let off = () => {};
  const toggle = (visible: boolean) => {
    if (isStop && document.documentElement.dataset.pup) visible = false;
    if (visible === on) return;
    on = visible;
    if (visible) { last = clock(); off = everyFrame(step); } else off();
  };
  let inView = false;
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; toggle(inView); });
  io.observe(buddy);
  const mo = new MutationObserver(() => toggle(inView));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-pup"] });

  const onClick = () => {
    const now = clock();
    clickRun = now - clickAt < 0.7 ? clickRun + 1 : 1;
    clickAt = now;
    const pool = pose === "peek" ? PEEK_ACTS : pose === "snug" ? SNUG_ACTS : null;
    const choices = pool?.filter((a) => a !== lastAct) ?? [];
    const next = pool ? choices[Math.floor(Math.random() * choices.length)] : pickAct(lastAct, clickRun);
    lastAct = next;
    rig.reset();
    cues = ACTS[next](ctx, now);
    playUntil = cues[cues.length - 1][0] + 0.4;
    idleSince = now;
  };
  const onEnter = (e: PointerEvent) => { if (e.pointerType === "mouse") { rig.petting(true); rig.wag(1); } };
  const onLeave = () => { rig.petting(false); rig.wag(0.6); };
  buddy.addEventListener("click", onClick);
  buddy.addEventListener("pointerenter", onEnter);
  buddy.addEventListener("pointerleave", onLeave);
  if (!pointerBound++) addEventListener("pointermove", onPointer, { passive: true });

  return () => {
    on = false;
    off();
    io.disconnect();
    mo.disconnect();
    buddy.removeAttribute("data-live");
    buddy.removeAttribute("data-playing");
    buddy.removeEventListener("click", onClick);
    buddy.removeEventListener("pointerenter", onEnter);
    buddy.removeEventListener("pointerleave", onLeave);
    if (!--pointerBound) removeEventListener("pointermove", onPointer);
  };
}

/** Bring every `.pup-buddy` under `root` to life (nothing for reduced-motion users). Returns a cleanup. */
export function attachBuddies(root: ParentNode): () => void {
  if (reducedMotion()) return () => {};
  const offs = [...root.querySelectorAll<HTMLElement>(".pup-buddy")].map(bringToLife);
  return () => offs.forEach((f) => f());
}
