/**
 * The walking mascot ("journey").
 *
 * One Teddy lives in a fixed layer above the page. Every `[data-pup-stop]` on the page is a
 * place he can sit; as you scroll he walks a curved path from the stop you left to the next one,
 * leaves paw prints behind him, then holds still and plays that stop's idle behaviour.
 *
 * This is a port of the reference site's own algorithm (read from its un-minified bundle):
 *   measure()  → where every stop is on the page, how far you must scroll to be "at" it
 *   place()    → given a scroll offset, where Teddy is (a Bézier between two stops, eased)
 *   tick()     → every frame: place him, pick pose/stride/facing, lay prints, move the DOM
 */
import { ACTS, POSES, Rig, W, pickAct, spawnHearts, type ActCtx, type Cue, type PoseName } from "./rig";
import { clock, everyFrame, reducedMotion } from "./loop";

type Pt = { x: number; y: number };
type Box = [number, number, number, number];
type Track =
  | { kind: "page"; top: number }
  | { kind: "screen"; top: number }
  | { kind: "pin"; top: number; from: number; to: number };
interface Stop { x: number; track: Track; s: number; behind: boolean; sink: number; box: Box }
interface Meta { scene: HTMLElement | null; pose: PoseName; facing: number; act: string; looks: HTMLElement[]; track: HTMLElement | null }
interface Safe { left: number; top: number; right: number; bottom: number }
interface Model { docH: number; lane: boolean; stops: Stop[]; meta: Meta[]; holds: [number, number][]; blend: number; mainTop: number }
interface Placed { x: number; y: number; s: number; front: boolean; airborne: boolean; k: number; t: number; walked: number }

const ANCHOR = { x: 150, y: 228 }; // the point of Teddy that sits on the stop (between his paws)
const BOX: Box = [48, 30, 288, 236]; // his extent in svg units when walking
const BOXES: Record<string, Box> = {
  sit: [50, 26, 284, 234],
  peek: [148, 34, 280, 163],
  snug: [148, 40, 280, 163],
  bow: [58, 56, 292, 236],
};
const boxOf = (pose: string) => BOXES[pose] ?? BOX;
const SINK = ANCHOR.y - 159; // how far "peeking" stops are buried
const BAND_MOBILE: [number, number] = [0.6, 0.86];
const BAND_DESKTOP: [number, number] = [0.42, 0.78];
const CLICK_ACTS = ["jump", "woof", "love", "sneeze"];

const rand = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (n: number) => n * n * (3 - 2 * n);
const ramp = (a: number, b: number, v: number) => (b === a ? +(v >= b) : smooth(clamp01((v - a) / (b - a))));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const softMax = (v: number, lo: number, k: number) => { const s = (v - lo) / k; return s > 20 ? v : lo + k * Math.log1p(Math.exp(s)); };
const softMin = (v: number, hi: number, k: number) => -softMax(-v, -hi, k);
const lerpBox = (a: Box, b: Box, t: number): Box => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
const bezier = (p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return { x: a * p0.x + b * c1.x + c * c2.x + d * p1.x, y: a * p0.y + b * c1.y + c * c2.y + d * p1.y };
};

/** Viewport position of a stop's anchor at a given scroll offset. */
function anchorAt(s: Stop, scroll: number): Pt {
  const tr = s.track;
  const top =
    tr.kind === "page" ? tr.top - scroll
    : tr.kind === "screen" ? tr.top
    : scroll < tr.from ? tr.top - (scroll - tr.from)
    : scroll > tr.to ? tr.top - (scroll - tr.to)
    : tr.top;
  return { x: s.x + ANCHOR.x * s.s, y: top + ANCHOR.y * s.s };
}

/** Which gap between stops we're in (`k`) and how far through it (`t`, 0 = holding at stop k). */
function segment(holds: [number, number][], scroll: number) {
  if (!holds.length || scroll <= holds[0][1]) return { k: 0, t: 0 };
  for (let i = 0; i < holds.length - 1; i++) {
    const end = holds[i][1];
    const next = holds[i + 1][0];
    if (scroll < next) return { k: i, t: clamp01((scroll - end) / Math.max(1, next - end)) };
    if (scroll <= holds[i + 1][1]) return { k: i + 1, t: 0 };
  }
  return { k: holds.length - 1, t: 0 };
}

/** Keep a Teddy-sized box inside the safe rectangle (softly, so it glides instead of snapping). */
function keepInside(x: number, y: number, scale: number, box: Box, safe: Safe, soft = 8): Pt {
  const l = (ANCHOR.x - box[0]) * scale;
  const r = (box[2] - ANCHOR.x) * scale;
  const u = (ANCHOR.y - box[1]) * scale;
  const d = (box[3] - ANCHOR.y) * scale;
  return {
    x: safe.right - safe.left > l + r ? softMin(softMax(x, safe.left + l, soft), safe.right - r, soft) : (safe.left + safe.right) / 2 - (r - l) / 2,
    y: safe.bottom - safe.top > u + d ? softMin(softMax(y, safe.top + u, soft), safe.bottom - d, soft) : safe.bottom - d,
  };
}

const waTop = () => {
  const bar = document.querySelector<HTMLElement>("[data-whatsapp-bar]");
  const rect = bar?.getClientRects().length ? bar.getBoundingClientRect() : null;
  return rect && rect.height ? rect.top : innerHeight - 6;
};
const headerH = () => document.getElementById("site-header")?.offsetHeight ?? 76;

function safeRect(lane: boolean): Safe {
  const w = document.documentElement.clientWidth;
  const top = headerH() + 10;
  if (lane) return { left: 10, top, right: w - 10, bottom: waTop() + 40 };
  const bar = document.querySelector<HTMLElement>("[data-whatsapp-bar]");
  const barTop = bar?.getClientRects().length ? bar.getBoundingClientRect().top : innerHeight;
  return { left: 10, top, right: w - 10, bottom: Math.min(innerHeight, barTop) - 10 };
}

/** Walk up to the nearest sticky ancestor and work out how a stop moves while it is pinned. */
function trackOf(el: HTMLElement, rect: DOMRect): Track {
  let sticky: HTMLElement | null = null;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (getComputedStyle(p).position === "sticky") { sticky = p; break; }
  }
  if (!sticky) return { kind: "page", top: rect.top + scrollY };
  const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
  const inside = rect.top - sticky.getBoundingClientRect().top;
  const prev = sticky.style.position;
  sticky.style.position = "relative";
  const sr = sticky.getBoundingClientRect();
  const parent = sticky.parentElement!;
  const parentBottom = parent.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(parent).paddingBottom) || 0);
  sticky.style.position = prev;
  const from = sr.top + scrollY - stickyTop;
  const to = parentBottom + scrollY - sr.height - stickyTop;
  return to <= from ? { kind: "page", top: sr.top + scrollY + inside } : { kind: "pin", top: stickyTop + inside, from, to };
}

/** Resolve overlaps between hold ranges and enforce a minimum scroll distance for each walk. */
function resolveHolds(ranges: [number, number][], minGap: number[], maxScroll: number) {
  const n = ranges.map((r) => (r[0] <= r[1] ? [r[0], r[1]] : [(r[0] + r[1]) / 2, (r[0] + r[1]) / 2]) as [number, number]);
  if (!n.length) return n;
  n[0][0] = -Infinity;
  const last = n[n.length - 1];
  last[1] = Infinity;
  last[0] = Math.min(last[0], maxScroll - 1);
  for (let i = 0; i < n.length - 1; i++) {
    const a = n[i];
    const b = n[i + 1];
    if (b[0] < a[1]) {
      const mid = (a[1] + b[0]) / 2;
      a[1] = Math.max(a[0], mid);
      b[0] = Math.min(b[1], mid);
      if (b[0] < a[1]) b[0] = a[1];
    }
    let need = (minGap[i] ?? 0) - (b[0] - a[1]);
    if (need > 0) {
      const ca = Math.min(need / 2, a[1] - a[0]);
      const cb = Math.min(need / 2, b[1] - b[0]);
      a[1] -= ca;
      b[0] += cb;
      need -= ca + cb;
      const more = Math.min(need, b[1] - b[0]);
      b[0] += more;
      need -= more;
      if (need > 0) a[1] -= Math.min(need, a[1] - a[0]);
    }
  }
  // The minimum-walk spacing can push the last hold past the end of the page (a short footer); he must still arrive.
  const end = n[n.length - 1], before = n[n.length - 2];
  if (end[0] > maxScroll - 1) {
    end[0] = maxScroll - 1;
    if (before) { before[1] = Math.min(before[1], end[0]); before[0] = Math.min(before[0], before[1]); }
  }
  for (const r of n) if (r[1] < r[0]) r[1] = r[0];
  return n;
}

/** Measure the page: where each stop sits and the scroll range during which Teddy "holds" there. */
function measure(probe: HTMLElement): Model {
  const mobile = matchMedia("(max-width: 767px), (pointer: coarse) and (max-height: 519px)").matches;
  const vw = document.documentElement.clientWidth;
  const vh = probe.getBoundingClientRect().height || innerHeight;
  const bar = document.querySelector<HTMLElement>("[data-whatsapp-bar]");
  const safe: Safe = {
    left: 10,
    top: headerH() + 10,
    right: vw - 10,
    bottom: vh - 10 - (bar?.getClientRects().length ? bar.getBoundingClientRect().height : 0),
  };
  const main = document.getElementById("main");
  const stops: Stop[] = [];
  const meta: Meta[] = [];
  const ranges: [number, number][] = [];

  const addStop = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const pose = (el.dataset.pose || "sit") as PoseName;
    const act = el.dataset.act ?? "";
    const base = rect.width / 300;
    const scale = act === "basket" || mobile ? base : 1.12 * base;
    const anchor = pose === "peek" ? { x: ANCHOR.x, y: 159 } : ANCHOR;
    const track = trackOf(el, rect);
    if (track.kind !== "screen") track.top += anchor.y * (base - scale);
    const stop: Stop = { x: rect.left + anchor.x * (base - scale), track, s: scale, behind: el.dataset.behind === "true", sink: 0, box: boxOf(pose) };
    const scene = el.closest<HTMLElement>("[data-pup-scene]");
    stops.push(stop);
    meta.push({
      scene,
      pose,
      facing: el.dataset.facing === "left" ? -1 : 1,
      act,
      looks: scene ? [...scene.querySelectorAll<HTMLElement>("[data-pup-look]")] : [],
      track: act === "treadmill" ? (scene?.querySelector<HTMLElement>("[data-treadmill]") ?? null) : null,
    });

    // The scroll range over which this stop sits comfortably inside the safe area.
    const band = mobile ? BAND_MOBILE : BAND_DESKTOP;
    let range: [number, number];
    if (track.kind === "pin") range = [track.from, track.to];
    else {
      const top = track.top;
      const bTop = top + stop.box[1] * stop.s;
      const bBot = top + stop.box[3] * stop.s;
      const mid = (bTop + bBot) / 2;
      const h = safe.bottom - safe.top;
      let a = mid - (safe.top + band[1] * h);
      let b = mid - (safe.top + band[0] * h);
      a = Math.max(a, bBot - safe.bottom);
      b = Math.min(b, bTop - safe.top);
      if (a > b) a = b = mid - (safe.top + h / 2);
      range = [a, b];
    }
    if (!mobile && scene && track.kind === "page" && act !== "basket" && act !== "peekaboo") {
      const h = safe.bottom - safe.top;
      const sceneTop = scene.getBoundingClientRect().top + scrollY - safe.top + 0.08 * h;
      const floor = track.top + stop.box[3] * stop.s - safe.bottom;
      if (range[1] > sceneTop) {
        const hi = Math.max(sceneTop, floor + 0.12 * h);
        range = [Math.max(floor, hi - Math.max(range[1] - range[0], 0.2 * h)), hi];
      }
    }
    ranges.push(range);
  };

  const all = [...document.querySelectorAll<HTMLElement>("[data-pup-stop]")].filter((e) => e.getClientRects().length);
  if (mobile) {
    // Phones: one lane stop at the top, one at the bottom, and a little Teddy peeking in from the side between scenes.
    const lane = all.filter((e) => e.dataset.lane === "true");
    const first = lane[0];
    const last = lane.length > 1 ? lane[lane.length - 1] : undefined;
    if (first) addStop(first);
    const firstScene = meta[0]?.scene ?? null;
    const scenes = [...document.querySelectorAll<HTMLElement>("#main [data-pup-scene]")].filter((e) => e !== firstScene && e.getClientRects().length);
    const scale = Math.min(0.62, Math.max(0.5, vw / 650));
    const box = boxOf("peek");
    scenes.forEach((scene, i) => {
      const left = i % 2 === 0;
      stops.push({
        x: left ? safe.left + 2 - box[0] * scale : safe.right - 2 - box[2] * scale,
        track: { kind: "screen", top: 0 },
        s: scale,
        behind: false,
        sink: SINK,
        box,
      });
      meta.push({ scene, pose: "peek", facing: left ? 1 : -1, act: "lane", looks: [], track: null });
      const r = scene.getBoundingClientRect();
      const a = r.top + scrollY - 0.42 * vh;
      const b = r.bottom + scrollY - 0.58 * vh;
      ranges.push(a <= b ? [a, b] : [(a + b) / 2, (a + b) / 2]);
    });
    if (last) addStop(last);
  } else all.forEach(addStop);

  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const minGaps = stops.slice(1).map((s, i) => {
    const prev = stops[i];
    const vertical = (BAND_DESKTOP[1] - BAND_DESKTOP[0]) * vh;
    const floor = (mobile ? 0.32 : 0.5) * vh;
    const dx = Math.abs(s.x + ANCHOR.x * s.s - (prev.x + ANCHOR.x * prev.s));
    return Math.min(1.4 * vh, Math.max(floor, 1.15 * Math.hypot(dx, vertical)));
  });
  return {
    docH: document.documentElement.scrollHeight,
    lane: mobile,
    stops,
    meta,
    holds: resolveHolds(ranges, minGaps, maxScroll),
    blend: 0.12 * vh,
    mainTop: main ? main.getBoundingClientRect().top + scrollY : 0,
  };
}

/** A smooth path between two stops (cubic Bézier that bows sideways when the stops line up). */
function pathBetween(a: Pt, b: Pt, safe: Safe) {
  const dx = b.x - a.x;
  const width = safe.right - safe.left;
  const pull = Math.max(0.45 * Math.abs(dx), 0);
  const dir = dx >= 0 ? 1 : -1;
  let c1 = { x: a.x + dir * pull, y: a.y };
  let c2 = { x: b.x - dir * pull, y: b.y };
  const minBow = 0.14 * width;
  if (Math.abs(dx) < minBow) {
    const side = ((a.x + b.x) / 2 < (safe.left + safe.right) / 2 ? 1 : -1) * (minBow - Math.abs(dx)) * 0.9;
    c1 = { x: c1.x + side, y: lerp(a.y, b.y, 0.2) };
    c2 = { x: c2.x + side, y: lerp(a.y, b.y, 0.8) };
  }
  const keep = (p: Pt) => ({ x: Math.min(safe.right, Math.max(safe.left, p.x)), y: Math.min(safe.bottom, Math.max(safe.top, p.y)) });
  return { p0: a, c1: keep(c1), c2: keep(c2), p1: b };
}

/** Where is Teddy at this scroll offset? */
function place(model: Model, scroll: number): Placed {
  const { stops, holds, blend, lane } = model;
  const safe = safeRect(lane);
  if (lane) {
    const t = waTop();
    for (const s of stops) if (s.track.kind === "screen") s.track.top = t - 159 * s.s;
  }
  const { k, t } = segment(holds, scroll);
  if (t <= 0 || k >= stops.length - 1) {
    const s = stops[k];
    const a = anchorAt(s, scroll);
    const p = keepInside(a.x, a.y, s.s, s.box, safe);
    return { x: p.x, y: p.y, s: s.s, front: !s.behind, airborne: false, k, t: 0, walked: 0 };
  }
  const from = stops[k];
  const to = stops[k + 1];
  const leave = holds[k][1];
  const arrive = holds[k + 1][0];
  const span = Math.max(1, arrive - leave);
  const v = clamp01((scroll - leave) / span);
  const a0 = anchorAt(from, leave);
  const a1 = anchorAt(to, arrive);
  const path = pathBetween({ x: a0.x, y: a0.y - from.sink * from.s }, { x: a1.x, y: a1.y - to.sink * to.s }, safe);
  const eased = v * v * v * (v * (6 * v - 15) + 10);
  const pos = bezier(path.p0, path.c1, path.c2, path.p1, eased);
  const scale = lerp(from.s, to.s, smooth(clamp01(v / 0.65)));
  const fb = Math.min(0.3, Math.max(0.06, blend / span));
  const wFrom = 1 - ramp(0, fb, v);
  const wTo = ramp(1 - fb, 1, v);
  // Follow the pages' own scroll a little at both ends so he doesn't slide against his stop.
  let y = pos.y + wFrom * (anchorAt(from, scroll).y - a0.y) + wTo * (anchorAt(to, scroll).y - a1.y);
  const x = pos.x;
  y += from.sink * from.s * (1 - ramp(0, 0.22, v)) + to.sink * to.s * ramp(0.78, 1, v);
  let airborne = false;
  if (from.behind && v < 0.36) { y -= Math.sin((v / 0.36) * Math.PI) * Math.min(64 * from.s, 72); airborne = v < 0.32; }
  if (to.behind && v > 0.68) { y -= Math.sin(((v - 0.68) / 0.32) * Math.PI) * Math.min(56 * to.s, 60); airborne = true; }
  if (from.sink && v < 0.2) airborne = true;
  const front = !((from.behind && v < 0.12) || (to.behind && v > 0.92));
  const box = v < 0.5
    ? lerpBox(from.box, BOX, ramp(0, from.sink ? 0.22 : from.behind ? 0.36 : 0.06, v))
    : lerpBox(BOX, to.box, ramp(to.sink ? 0.78 : to.behind ? 0.68 : 0.94, 1, v));
  const p = keepInside(x, y, scale, box, safe);
  // Distance walked along the curve so far (drives his stride phase and paw print spacing).
  let walked = 0;
  let prev = path.p0;
  const n = Math.max(1, Math.ceil(32 * clamp01(eased)));
  for (let i = 1; i <= n; i++) {
    const q = bezier(path.p0, path.c1, path.c2, path.p1, (i / n) * clamp01(eased));
    walked += Math.hypot(q.x - prev.x, q.y - prev.y);
    prev = q;
  }
  return { x: p.x, y: p.y, s: scale, front, airborne, k, t: v, walked };
}

/** If scrolling has stopped part-way between two stops, which scroll offset should we settle to? */
function settleScroll(model: Model, scroll: number) {
  const { k, t } = segment(model.holds, scroll);
  if (t <= 0 || k >= model.stops.length - 1) return scroll;
  const a = model.stops[k];
  const b = model.stops[k + 1];
  const lo = a.sink ? 0.22 : 0.36 * +!!a.behind;
  const hi = b.sink ? 0.78 : b.behind ? 0.68 : 1;
  let d = t;
  if (t < lo) d = t < lo / 2 ? 0 : lo;
  else if (t > hi) d = t > (1 + hi) / 2 ? 1 : hi;
  return d === t ? scroll : model.holds[k][1] + d * (model.holds[k + 1][0] - model.holds[k][1]);
}

export interface JourneyEls {
  probe: HTMLElement;
  prints: HTMLElement;
  layer: HTMLElement;
  actor: HTMLElement;
  body: HTMLElement;
  bubbleAt: HTMLElement;
  bubble: HTMLElement;
}

const setData = (el: HTMLElement, key: string, v: string) => el.dataset[key] !== v && (el.dataset[key] = v);

/** Start the walking mascot. Returns a function that tears it all down. */
export function startJourney(els: JourneyEls): () => void {
  const { probe, prints, layer, actor, body, bubbleAt, bubble } = els;
  const svg = body.querySelector("svg") as SVGSVGElement;
  const root = document.documentElement;
  const pool = [...prints.children] as HTMLElement[];

  let model: Model | null = null;
  let rig: Rig | null = null;
  let running = false;
  let stopFrames = () => {};
  let remeasureTimer = 0;

  let sayUntil = 0;
  const say = (text: string, now: number, secs = 1.4) => { bubble.textContent = text; bubble.dataset.show = "true"; sayUntil = now + secs; };

  let pointer: { x: number; y: number; t: number } | null = null;
  let look: { el: Element; until: number } | null = null;
  const onPointerMove = (e: PointerEvent) => { if (e.pointerType === "mouse") pointer = { x: e.clientX, y: e.clientY, t: clock() }; };
  const onCue = (e: Event) => {
    const d = (e as CustomEvent).detail as { look?: Element; say?: string; secs?: number };
    const scene = cur >= 0 ? model?.meta[cur]?.scene : null;
    if (!scene || (d.look && !scene.contains(d.look))) return;
    const now = clock();
    if (d.look) look = { el: d.look, until: now + (d.secs ?? 1.6) };
    if (d.say) say(d.say, now);
  };
  const onFocus = (e: FocusEvent) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.matches("a, button, input, textarea, select, summary")) look = { el: t, until: clock() + 1.4 };
  };

  let lastT = clock();
  let lastScroll = scrollY;
  let prev: Pt | null = null; // where he was drawn last frame
  let spring = { x: 0, y: 0, s: 0 }; // offset that decays to 0 after a re-measure or snap
  let snapped = false;
  let cur = -1; // stop he is currently "at" (or -1 while walking)
  let arrivedAt = 0;
  let activityAt = 0;
  let cues: Cue[] = [];
  let lookIdx = -1;
  let lookAt = 0;
  let treadX: number | null = null;
  let treadIdle = 0;
  let lastScrollAt = clock();
  let scrollDir = 1;
  let stillFor = 0;
  let printSeg = -1;
  let printStep = 0;
  let printIdx = 0;
  let basketAt = 0;
  let laneEase: Pt | null = null;
  let lastBarTop = 0;
  let walkedLane = 0;
  let layerTop = 0;
  let last: (Placed & { x: number; y: number }) | null = null;
  let clicks = 0;
  let clickAt = 0;
  let lastTrick: string | null = null;

  const actCtx = (m: Meta): ActCtx => ({
    d: rig!,
    rest: POSES[m.pose],
    facing: m.facing,
    say: (t, secs) => say(t, clock(), secs),
    hearts: () => last && spawnHearts(layer, last.x - ANCHOR.x * last.s + (rig!.facingDir > 0 ? 212 : W - 212) * last.s, last.y - (ANCHOR.y - 40) * last.s - layerTop),
  });

  const layPrint = (px: number, py: number, s: number, step: number, dx: number, dy: number, mainTop: number, facingDir: number) => {
    const foot = step & 1;
    const xOff = foot ? 186 : 110;
    const left = px - ANCHOR.x * s;
    const top = py - ANCHOR.y * s;
    const cx = left + (facingDir > 0 ? xOff : W - xOff) * s;
    const cy = top + 226 * s + scrollY - mainTop + (foot ? -4 : 4) * s;
    const ang = Math.atan2(dy, dx) + Math.PI / 2;
    const size = 14 * Math.max(0.75, 1.5 * s);
    const p = pool[printIdx++ % pool.length];
    p.style.transform = `translate(${(cx - size / 2).toFixed(1)}px, ${(cy - size / 2).toFixed(1)}px) rotate(${ang.toFixed(3)}rad)`;
    p.style.width = p.style.height = `${size.toFixed(1)}px`;
    p.animate(
      [{ opacity: 0 }, { opacity: 0.45, offset: 0.08 }, { opacity: 0.45, offset: 0.5 }, { opacity: 0 }],
      { duration: 2600, easing: "ease-out" },
    );
  };

  const tick = () => {
    if (!model || !rig) return;
    const m = model;
    const f = rig;
    const now = clock();
    const dt = Math.min(0.05, now - lastT);
    lastT = now;
    // Layout can settle after the last resize event (late fonts, translated text): the hold ranges would then point past the page end.
    if (!remeasureTimer && Math.abs(document.documentElement.scrollHeight - m.docH) > 2) remeasure();
    const sc = scrollY;
    const dScroll = sc - lastScroll;
    lastScroll = sc;
    if (Math.abs(dScroll) > 0.5) { lastScrollAt = now; scrollDir = dScroll > 0 ? 1 : -1; }

    while (cues.length && cues[0][0] <= now) cues.shift()![1](now);

    // Once scrolling stops between two stops, drift on to whichever end is nearer.
    const eff = now - lastScrollAt > 0.25 ? settleScroll(m, sc) : sc;
    const p = place(m, eff);
    const screenLane = m.lane && (() => {
      const a = m.stops[p.k];
      const b = p.t > 0 ? m.stops[p.k + 1] : a;
      return a.track.kind === "screen" && b?.track.kind === "screen";
    })();

    const decay = Math.exp(-dt / 0.28);
    spring.x *= decay; spring.y *= decay; spring.s *= decay;
    if (Math.abs(spring.x) < 0.05 && Math.abs(spring.y) < 0.05) spring.x = spring.y = 0;
    const isSnap = eff !== sc;
    if (isSnap !== snapped && prev && !screenLane) { spring.x = prev.x - p.x; spring.y = prev.y - p.y; }
    snapped = isSnap;

    const scale = p.s + spring.s;
    let x = p.x + spring.x;
    let y = p.y + spring.y;
    const barTop = m.lane ? waTop() : 0;
    let arrived = true;
    if (screenLane) {
      laneEase ||= prev ? { x: prev.x, y: prev.y - lastBarTop } : { x: x, y: y - barTop };
      const k = 1 - Math.exp(-dt / 0.14);
      laneEase.x += (x - laneEase.x) * k;
      laneEase.y += (y - barTop - laneEase.y) * k;
      arrived = Math.hypot(x - laneEase.x, y - barTop - laneEase.y) < 1.5;
      x = laneEase.x;
      y = barTop + laneEase.y;
    } else if (laneEase) {
      spring.x = (prev?.x ?? x) - p.x;
      spring.y = (prev?.y ?? y) - p.y;
      x = p.x + spring.x;
      y = p.y + spring.y;
      laneEase = null;
    }
    lastBarTop = barTop;
    last = { ...p, x, y, s: scale };
    setData(layer, "anchor", screenLane ? "bottom" : "top");
    layerTop = screenLane ? layer.getBoundingClientRect().top : 0;

    const holding = p.t === 0 && arrived;
    const k = p.k;
    if (holding) {
      const meta = m.meta[k];
      if (cur !== k) {
        cues = []; look = null; cur = k; arrivedAt = now; activityAt = now; treadX = null;
        f.reset(); f.setPose(meta.pose); f.face(meta.facing, 0.14); f.stride(0);
        f.wag(meta.act === "basket" ? 0.3 : 0.7); f.jolt(0.4);
        basketAt = now + 2.4;
      }
      if (meta.track && !cues.length) {
        // A treadmill: he walks on the spot while the belt scrolls.
        const left = meta.track.getBoundingClientRect().left;
        const d = treadX === null ? 0 : left - treadX;
        treadX = left;
        f.walkedTo(-left / scale);
        if (Math.abs(d) > 0.15) { treadIdle = 0; f.setPose("walk"); f.stride(1); f.face(d < 0 ? 1 : -1, 0.16); }
        else if ((treadIdle += dt) > 0.25) { f.setPose("stand"); f.stride(0); }
      }
      if (meta.act === "tilt" && !cues.length && now - arrivedAt > 1.2) {
        const s = Math.sin(0.9 * now);
        f.cock(s > 0.35 ? 13 : s < -0.35 ? -10 : 0);
      }
      if (meta.act === "basket" && !cues.length && now > basketAt) {
        basketAt = now + 4.5 + 3 * Math.random();
        Math.random() < 0.7 ? f.jolt(0.55) : f.yawn(now, 0.7);
      }
      const busy = (look && look.until > now) || (pointer && now - pointer.t < 2.5);
      if (meta.looks.length && !busy && now - arrivedAt > 0.8 && now - lookAt > 1.7) {
        lookAt = now;
        lookIdx = (lookIdx + 1) % (meta.looks.length + 1);
        if (lookIdx < meta.looks.length) look = { el: meta.looks[lookIdx], until: now + 1.4 };
      }
      if (Math.abs(dScroll) > 0.5) activityAt = now;
      if (!cues.length && !meta.track && meta.act !== "basket" && now - activityAt > 9) {
        activityAt = now;
        cues = Math.random() < 0.55 ? ACTS.tilt(actCtx(meta), now) : [[now, () => f.wag(1)], [now + 2.4, () => f.wag(0.7)]];
      }
    } else {
      if (cur !== -1) { cur = -1; cues = []; f.reset(); }
      const moved = prev ? Math.hypot(x - prev.x, y - prev.y) : 0;
      stillFor = moved > 0.25 ? 0 : stillFor + dt;
      let air = p.airborne;
      if (m.lane && p.t > 0) {
        const a = m.stops[k];
        const b = m.stops[k + 1];
        if (a.sink && p.t < 0.22) air = scrollDir > 0;
        else if (b?.sink && p.t > 0.78) air = scrollDir < 0;
      }
      if (air) { f.setPose("hop"); f.stride(0); }
      else if (stillFor > 0.3) {
        f.setPose("stand"); f.stride(0);
        if (stillFor > 2.6 && stillFor - dt <= 2.6) say("coming?", now);
      } else { f.setPose("walk"); f.stride(1); }
      f.walkedTo((screenLane ? (walkedLane += moved) : p.walked) / Math.max(0.05, scale));
      if (prev) {
        const dx = x - prev.x;
        if (Math.abs(dx) > 0.6 && Math.abs(dx) > 0.35 * Math.abs(y - prev.y)) f.face(dx > 0 ? 1 : -1, 0.16);
      }
      if (!m.lane) {
        const step = Math.floor(p.walked / (34 * scale));
        if (printSeg === k && step !== printStep && !p.airborne && prev) {
          layPrint(x, y, scale, step, x - prev.x, y - prev.y + dScroll, m.mainTop, f.facingDir);
        }
        printSeg = k;
        printStep = step;
      }
    }
    prev = { x, y };

    m.meta.forEach((meta, i) => {
      if (!meta.scene) return;
      setData(meta.scene, "here", String(holding && i === k));
      setData(meta.scene, "visited", String(i <= k || (i === k + 1 && p.t > 0.92)));
    });

    if (look && look.until > now) {
      const r = look.el.getBoundingClientRect();
      f.lookAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    } else if (pointer && now - pointer.t < 2.5) f.lookAt(pointer);
    else f.lookAt(null);

    actor.style.transform = `translate3d(${(x - ANCHOR.x * scale).toFixed(2)}px, ${(y - ANCHOR.y * scale - layerTop).toFixed(2)}px, 0)`;
    body.style.transform = `scale(${scale.toFixed(4)})`;
    setData(layer, "front", String(p.front));
    setData(actor, "holding", String(holding));
    if (bubble.dataset.show === "true") {
      if (now > sayUntil) bubble.dataset.show = "false";
      const bx = (f.facingDir > 0 ? 214 : W - 214) * scale;
      bubbleAt.style.transform = `translate(${bx.toFixed(1)}px, ${(30 * scale).toFixed(1)}px)`;
    }
    f.tick(dt, now);
  };

  /* clicking / petting him */
  const onClick = () => {
    if (!rig || !model) return;
    const f = rig;
    const now = clock();
    clicks = now - clickAt < 0.7 ? clicks + 1 : 1;
    clickAt = now;
    activityAt = now;
    if (cur < 0) {
      const meta = model.meta[Math.max(0, last?.k ?? 0)];
      const pick = rand(CLICK_ACTS.filter((a) => a !== lastTrick));
      lastTrick = pick;
      const ctx = actCtx(meta);
      cues =
        pick === "jump" ? [[now, () => { f.hop(1.35); ctx.say(["wheee!", "boing!", "yip!"][Math.floor(Math.random() * 3)]); }], [now + 0.5, () => f.hop(0.7)]]
        : pick === "woof" ? [[now, (n) => { f.woof(n); ctx.say("woof!"); }], [now + 0.4, (n) => f.woof(n)]]
        : pick === "love" ? [[now, () => { f.wag(1); f.hop(0.5); ctx.hearts(); ctx.say("I like you!"); }]]
        : [[now, (n) => { f.jolt(1.4); f.hop(0.4); f.yawn(n, 0.22); ctx.say("achoo!"); }]];
      return;
    }
    const meta = model.meta[cur];
    const others = (list: string[]) => rand(list.filter((a) => a !== lastTrick));
    let pick: string;
    if (meta.track) pick = others(["woof", "hop", "love"]);
    else if (meta.act === "basket") pick = others(["tilt", "love", "sneeze", "woof"]);
    else if (meta.pose === "peek") pick = others(["peekaboo", "woof", "tilt", "sneeze"]);
    else { pick = pickAct(lastTrick, clicks); if (pick === "zoomies") pick = "spin"; }
    if (pick === "peekaboo" && cues.length) return;
    lastTrick = pick;
    f.reset();
    cues = ACTS[pick](actCtx(meta), now);
  };
  const onEnter = (e: PointerEvent) => { if (e.pointerType === "mouse" && rig && cur >= 0) { rig.petting(true); rig.wag(1); } };
  const onLeave = () => { if (rig) { rig.petting(false); if (cur >= 0) rig.wag(model?.meta[cur]?.act === "basket" ? 0.3 : 0.7); } };

  const begin = () => {
    if (running || reducedMotion()) return;
    const next = measure(probe);
    if (next.stops.length < 2) return;
    model = next;
    running = true;
    root.dataset.pup = next.lane ? "lane" : "live";
    layer.hidden = false;
    const first = next.meta[0];
    rig = new Rig(svg, first.pose, first.facing);
    lastScroll = scrollY;
    prev = null;
    lastT = lastScrollAt = clock();
    snapped = false;
    laneEase = null;
    const start = place(next, scrollY);
    if (start.k === 0 && start.t === 0 && first.act === "peekaboo") {
      // Arriving on the home page: Teddy pops up from behind the hero.
      const now = lastT;
      cur = 0; arrivedAt = now;
      const friends = first.scene?.querySelectorAll<HTMLElement>("[data-pup-friend]") ?? [];
      const a = friends[0];
      const b = friends[friends.length - 1];
      cues = [
        [now + 0.1, () => rig!.setPose({ ...POSES.peek, headY: 120 })],
        [now + 0.7, (n) => { rig!.setPose("peek"); rig!.jolt(1.2); say("peekaboo!", n, 1.6); }],
        [now + 1.5, (n) => { if (a) look = { el: a, until: n + 0.8 }; }],
        [now + 2.3, (n) => { if (b) look = { el: b, until: n + 0.8 }; }],
        [now + 3.1, () => { look = null; rig!.wag(1); }],
      ];
    } else cur = -1;
    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pup:cue", onCue);
    addEventListener("focusin", onFocus);
    actor.addEventListener("click", onClick);
    actor.addEventListener("pointerenter", onEnter);
    actor.addEventListener("pointerleave", onLeave);
    stopFrames = everyFrame(tick);
  };

  const end = () => {
    if (!running) return;
    running = false;
    stopFrames();
    delete root.dataset.pup;
    layer.hidden = true;
    delete layer.dataset.anchor;
    layerTop = 0;
    model?.meta.forEach((m) => { if (m.scene) { delete m.scene.dataset.here; delete m.scene.dataset.visited; } });
    model = null; rig = null; cur = -1;
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("pup:cue", onCue);
    removeEventListener("focusin", onFocus);
    actor.removeEventListener("click", onClick);
    actor.removeEventListener("pointerenter", onEnter);
    actor.removeEventListener("pointerleave", onLeave);
  };

  /** Layout changed (resize, fonts, images): re-measure and keep him where he is, easing to the new spot. */
  const remeasure = () => {
    clearTimeout(remeasureTimer);
    remeasureTimer = window.setTimeout(() => {
      remeasureTimer = 0;
      if (!running || !model) return;
      const next = measure(probe);
      if (next.stops.length < 2) return end();
      const was = last;
      const laneChanged = next.lane !== model.lane;
      model = next;
      root.dataset.pup = next.lane ? "lane" : "live";
      if (laneChanged) cur = -1;
      if (was) {
        const now = place(next, scrollY);
        spring = { x: was.x - now.x, y: was.y - now.y, s: was.s - now.s };
      }
    }, 120);
  };

  const ro = new ResizeObserver(remeasure);
  ro.observe(document.body);
  addEventListener("resize", remeasure);
  addEventListener("load", remeasure);
  const rm = matchMedia("(prefers-reduced-motion: reduce)");
  const onMotionChange = () => (reducedMotion() ? end() : begin());
  rm.addEventListener("change", onMotionChange);
  begin();
  document.fonts?.ready.then(remeasure);

  return () => {
    end();
    clearTimeout(remeasureTimer);
    ro.disconnect();
    removeEventListener("resize", remeasure);
    removeEventListener("load", remeasure);
    rm.removeEventListener("change", onMotionChange);
  };
}

/** Let any component make Teddy look at something or say a line, e.g. cuePup({ look: input, say: "ooh" }). */
export function cuePup(detail: { look?: Element; say?: string; secs?: number }) {
  dispatchEvent(new CustomEvent("pup:cue", { detail }));
}
