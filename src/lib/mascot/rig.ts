/**
 * Teddy's procedural rig, ported from the reference site's own (un-minified) logic.
 *
 * A pose is a bag of numbers (body angle, head offset, leg angles, tail, eyes…).
 * `frame()` turns a pose + live state (stride phase, wag, gaze, blink, ear spring) into SVG
 * attribute strings; `Rig` eases between poses every animation frame and writes only the
 * attributes that changed onto the `[data-p="…"]` nodes of one `<svg>`.
 */

export const W = 300; // svg viewBox width
export const H = 240; // svg viewBox height
export const GROUND = 228; // y of the paws' resting line
export const EYE_Y = 98;
export const HEAD_PIVOT: [number, number] = [212, 100];
export const INK = "#2a170e";
export const FUR = "#f2be6b";
export const FUR_DARK = "#e4a352";
export const CREAM = "#fbe3b4";
export const BLUSH = "#f9b9a6";
export const COLLAR = "#a24a1a";

const SHOULDER_N: [number, number] = [186, 194];
const SHOULDER_F: [number, number] = [168, 192];
const HIP_N: [number, number] = [110, 194];
const HIP_F: [number, number] = [94, 192];
const TAIL_BASE: [number, number] = [84, 150];
const EAR_L_PIVOT: [number, number] = [174, 82];
const EAR_R_PIVOT: [number, number] = [250, 82];
const BODY_PIVOT: [number, number] = [196, 206];

export const JOINTS = { shoulderN: SHOULDER_N, shoulderF: SHOULDER_F, hipN: HIP_N, hipF: HIP_F, tailBase: TAIL_BASE };

/** A wobbly "fluffy" closed outline: `n` quadratic bumps around an ellipse. */
function fluff(cx: number, cy: number, rx: number, ry: number, n: number, bump: number, start = -Math.PI / 2, rotDeg = 0) {
  const rot = (rotDeg * Math.PI) / 180;
  const pt = (ang: number, extra: number) => {
    const x = Math.cos(ang) * (rx + extra);
    const y = Math.sin(ang) * (ry + (ry / rx) * extra);
    return `${(cx + x * Math.cos(rot) - y * Math.sin(rot)).toFixed(1)} ${(cy + x * Math.sin(rot) + y * Math.cos(rot)).toFixed(1)}`;
  };
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = start + (i / n) * Math.PI * 2;
    const a1 = start + ((i + 1) / n) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    d += `${i === 0 ? `M${pt(a0, 0)}` : ""}Q${pt(mid, bump * 2.1)} ${pt(a1, 0)}`;
  }
  return `${d}Z`;
}

function leg(width: number, length: number) {
  const h = width / 2;
  return `M${-h} -14 C${-h} 4 -12 ${length - 18} -12 ${length - 9} C-12 ${length - 2} -7 ${length} 0 ${length} C9 ${length} 13 ${length - 3} 13 ${length - 9} C13 ${length - 18} ${h} 4 ${h} -14`;
}

export const SHAPES = {
  body: fluff(140, 170, 64, 36, 15, 3.4, 0.95 * Math.PI),
  chest: fluff(192, 166, 30, 32, 9, 3.2, 0.6 * Math.PI),
  tail: fluff(70, 126, 17, 16, 9, 3.2),
  tailStem: "M86 152 C80 146 76 140 74 136",
  haunch: fluff(110, 204, 30, 24, 10, 3.2, Math.PI),
  haunchPaw: "M112 214 C126 212 142 214 146 221 C148 226 144 229 136 229 L116 229 C108 229 104 224 106 219 Z",
  head: fluff(212, 100, 51, 46, 16, 3.6),
  topknot: fluff(212, 52, 17, 12, 8, 2.9, Math.PI),
  earL: fluff(170, 112, 19, 34, 10, 3.2, -Math.PI / 2, 12),
  earR: fluff(254, 112, 19, 34, 10, 3.2, -Math.PI / 2, -12),
  muzzle: "M188 120 C188 106 200 100 212 100 C224 100 236 106 236 120 C236 133 225 140 212 140 C199 140 188 133 188 120 Z",
  nose: "M204.5 111.5 Q212 107.2 219.5 111.5 Q218.2 118.4 212 120 Q205.8 118.4 204.5 111.5 Z",
  mouth: "M212 120 V124.5 M212 124.5 Q207.2 129.6 202.8 125.2 M212 124.5 Q216.8 129.6 221.2 125.2",
  mouthOpen: "M203 126 Q212 122 221 126 Q219 138 212 139 Q205 138 203 126 Z",
  tongue: "M207.6 127.4 Q212 136.6 216.4 127.4 Z",
  collar: "M178 146 Q212 162 246 146 L246 154 Q212 170 178 154 Z",
  tag: "M212 160 C212 156 206 155 206 159.4 C206 163 212 166.6 212 168.4 C212 166.6 218 163 218 159.4 C218 155 212 156 212 160 Z",
  ledgePaws: "M175 159 C175 148 181 142 190 142 C199 142 205 148 205 159 Z M219 159 C219 148 225 142 234 142 C243 142 249 148 249 159 Z",
  ledgeToes: "M186 153 v-4.5 M194 153 v-4.5 M230 153 v-4.5 M238 153 v-4.5",
  shadow: { cx: 150, cy: 230, rx: 92, ry: 7 },
};

export const LEGS = {
  front: leg(24, GROUND - SHOULDER_N[1]),
  frontFar: leg(22, GROUND - SHOULDER_F[1]),
  back: leg(30, GROUND - HIP_N[1]),
  backFar: leg(28, GROUND - HIP_F[1]),
};

export const toes = (len: number) => `M-3.5 ${len - 7} v5 M4.5 ${len - 7} v5`;

export interface Pose {
  bodyRot: number; bodyX: number; bodyY: number; stretch: number;
  headX: number; headY: number; headRot: number; earL: number; earR: number; tail: number;
  fn: number; ff: number; bn: number; bf: number;
  sit: number; eyes: number; happy: number; tongue: number; mouth: number; front: number;
}

const NEUTRAL: Pose = {
  bodyRot: 0, bodyX: 0, bodyY: 0, stretch: 1, headX: 0, headY: 0, headRot: 0, earL: 0, earR: 0, tail: 0,
  fn: 0, ff: 0, bn: 0, bf: 0, sit: 0, eyes: 1, happy: 0, tongue: 0, mouth: 0, front: 0,
};

export type PoseName =
  | "stand" | "walk" | "sit" | "peek" | "snug" | "lie" | "sleep" | "settle" | "hop" | "sniff" | "bow" | "beg";

export const POSES: Record<PoseName, Pose> = {
  stand: NEUTRAL,
  walk: { ...NEUTRAL, tail: -6, tongue: 1 },
  sit: { ...NEUTRAL, bodyRot: -24, bodyY: -2, headX: -10, headY: -6, tail: 34, sit: 1, tongue: 1 },
  peek: { ...NEUTRAL, headY: 4, earL: -6, earR: 6, tail: -20, front: 1, tongue: 1 },
  snug: { ...NEUTRAL, headY: 9, headRot: 4, earL: 3, earR: -3, tail: -20, front: 1, tongue: 0 },
  lie: { ...NEUTRAL, bodyRot: -5, bodyY: 22, headX: 12, headY: 40, headRot: 3, fn: -84, ff: -80, sit: 1, tail: 58, tongue: 0 },
  sleep: { ...NEUTRAL, bodyRot: -5, bodyY: 22, headX: 14, headY: 44, headRot: -8, fn: -84, ff: -80, sit: 1, tail: 64, eyes: 0, earL: 4, earR: -4 },
  settle: { ...NEUTRAL, bodyRot: -5, bodyY: 22, headX: 10, headY: 16, fn: -84, ff: -80, sit: 1, tail: 40, tongue: 1 },
  hop: { ...NEUTRAL, bodyRot: -9, stretch: 1.06, headY: -6, fn: -42, ff: -32, bn: 40, bf: 30, earL: -26, earR: 26, tail: -24, tongue: 1 },
  sniff: { ...NEUTRAL, bodyRot: 7, headX: 16, headY: 32, headRot: 9, tail: -14, fn: 6, ff: 4 },
  bow: { ...NEUTRAL, bodyRot: 15, bodyY: 2, headX: 14, headY: 30, fn: -58, ff: -52, tail: -32, happy: 1, tongue: 1 },
  beg: { ...NEUTRAL, bodyRot: -36, bodyY: -6, headX: -18, headY: -18, sit: 1, fn: -70, ff: -64, tail: 30, happy: 1, tongue: 1 },
};

const POSE_KEYS = Object.keys(NEUTRAL) as (keyof Pose)[];

export interface Motion {
  phase: number; stride: number; time: number; wag: number;
  gazeX: number; gazeY: number; blink: number; ear: number;
}
const REST: Motion = { phase: 0, stride: 0, time: 0, wag: 0, gazeX: 0, gazeY: 0, blink: 0, ear: 0 };

export const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  const out = { ...a };
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
};

const r2 = (n: number) => Math.round(100 * n) / 100;
const spin = (deg: number, [x, y]: [number, number]) => `rotate(${r2(deg)} ${x} ${y})`;

/** Pose + motion state → the attribute value for every animated part. */
export function frame(pose: Pose, m: Motion = REST) {
  const s1 = Math.sin(m.phase);
  const s2 = Math.sin(m.phase + Math.PI);
  const swing = 20 + 10 * m.stride;
  const bob = (1 - Math.cos(2 * m.phase)) / 2;
  const walking = +(m.stride > 0.01);
  const breathe = Math.sin(2.4 * m.time) * (1 - walking);
  const bodyY = pose.bodyY - bob * (2.5 + 4 * m.stride) * walking + 0.6 * breathe;
  const bodyRot = pose.bodyRot + 1.6 * Math.sin(m.phase) * walking;
  const counter = -pose.bodyRot;
  const wagAmp = 5 + 17 * m.wag;
  const wagHz = 1.2 + 2.6 * m.wag;
  const tail = pose.tail + Math.sin(m.time * wagHz * Math.PI * 2) * wagAmp;
  const headBob = (-(1 - Math.cos(2 * m.phase - 0.7)) / 2) * (2 + 3 * m.stride) * walking + 0.9 * breathe;
  return {
    body: `translate(${r2(pose.bodyX)} ${r2(bodyY)}) ${spin(bodyRot, BODY_PIVOT)} translate(${BODY_PIVOT[0]} 0) scale(${r2(pose.stretch)} 1) translate(${-BODY_PIVOT[0]} 0)`,
    fn: `translate(${SHOULDER_N[0]} ${SHOULDER_N[1]}) rotate(${r2(pose.fn + counter + s1 * swing * walking)})`,
    ff: `translate(${SHOULDER_F[0]} ${SHOULDER_F[1]}) rotate(${r2(pose.ff + counter + s2 * swing * walking)})`,
    bn: `translate(${HIP_N[0]} ${HIP_N[1]}) rotate(${r2(pose.bn + s2 * swing * walking)})`,
    bf: `translate(${HIP_F[0]} ${HIP_F[1]}) rotate(${r2(pose.bf + s1 * swing * walking)})`,
    tail: spin(tail, TAIL_BASE),
    haunch: `translate(0 ${r2(-(0.06 * pose.bodyRot))})`,
    head: `translate(${r2(pose.headX)} ${r2(pose.headY + headBob)}) ${spin(pose.headRot + 1.4 * Math.sin(m.phase) * walking, HEAD_PIVOT)}`,
    earL: spin(pose.earL + m.ear + 4 * Math.sin(2 * m.phase) * walking, EAR_L_PIVOT),
    earR: spin(pose.earR - m.ear - 4 * Math.sin(2 * m.phase) * walking, EAR_R_PIVOT),
    eyes: `translate(${r2(3.4 * m.gazeX)} ${r2(2.6 * m.gazeY)})`,
    blink: `translate(0 ${r2(EYE_Y * m.blink * 0.92)}) scale(1 ${r2(1 - 0.92 * m.blink)})`,
    openEyes: r2(Math.max(0, pose.eyes - pose.happy)),
    happyEyes: r2(Math.min(pose.happy, pose.eyes)),
    shutEyes: r2(1 - pose.eyes),
    tongue: r2(pose.tongue * (1 - pose.mouth)),
    mouth: r2(pose.mouth),
    backLegs: r2(1 - pose.sit),
    haunchOpacity: r2(pose.sit * (1 - pose.front)),
    side: r2(1 - pose.front),
    ledge: r2(pose.front),
    shadow: `translate(${r2(0.6 * pose.bodyX)} 0) scale(${r2(1 - 0.05 * bob * walking)} 1)`,
    shadowOpacity: r2(0.12 * (1 - pose.front)),
  };
}

type Frame = ReturnType<typeof frame>;

/** [data-p, attribute, key in frame()] — every node the rig animates. */
const BINDINGS: [string, string, keyof Frame | "root"][] = [
  ["root", "transform", "root"],
  ["shadow", "transform", "shadow"],
  ["shadow", "opacity", "shadowOpacity"],
  ["body", "transform", "body"],
  ["body", "opacity", "side"],
  ["bf", "transform", "bf"],
  ["bf", "opacity", "backLegs"],
  ["bn", "transform", "bn"],
  ["bn", "opacity", "backLegs"],
  ["ff", "transform", "ff"],
  ["fn", "transform", "fn"],
  ["tail", "transform", "tail"],
  ["haunch", "transform", "haunch"],
  ["haunch", "opacity", "haunchOpacity"],
  ["head", "transform", "head"],
  ["earL", "transform", "earL"],
  ["earR", "transform", "earR"],
  ["eyes", "transform", "eyes"],
  ["open", "opacity", "openEyes"],
  ["blink", "transform", "blink"],
  ["happy", "opacity", "happyEyes"],
  ["shut", "opacity", "shutEyes"],
  ["tongue", "opacity", "tongue"],
  ["mouth", "opacity", "mouth"],
  ["ledge", "opacity", "ledge"],
];

/** Frame-rate independent smoothing factor. */
const ease = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);
const clamp = (n: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, n));

export class Rig {
  private els = new Map<string, Element>();
  private written = new Map<string, string>();
  pose: Pose;
  private target: Pose;
  private m: Motion = { ...REST };
  private facing: number;
  private facingTarget: number;
  private strideTarget = 0;
  private wagTarget = 0.35;
  private gazeTarget = { x: 0, y: 0 };
  private tilt = 0;
  private tiltTarget = 0;
  private earV = 0;
  private nextBlink = 1.2;
  private blinkAt = -1;
  private woofUntil = 0;
  private bounce = 0;
  private bounceV = 0;
  private offset = 0;
  private offsetTarget = 0;
  private pet = 0;
  private petTarget = 0;
  private turn = 0.07;
  private lean = 0;

  constructor(private svg: SVGSVGElement, pose: PoseName = "sit", facing = 1) {
    svg.querySelectorAll<SVGElement>("[data-p]").forEach((el) => this.els.set(el.dataset.p!, el));
    this.pose = { ...POSES[pose] };
    this.target = this.pose;
    this.facing = this.facingTarget = facing;
  }

  setPose(p: PoseName | Pose) { this.target = typeof p === "string" ? POSES[p] : p; }
  face(dir: number, turn = 0.07) { this.facingTarget = dir; this.turn = turn; }
  get facingDir() { return this.facingTarget; }
  stride(v: number) { this.strideTarget = clamp(v, 0, 1); }
  walkedTo(px: number) { this.m.phase = (px / 46) * Math.PI; }
  wag(v: number) { this.wagTarget = clamp(v, 0, 1); }
  cock(deg: number) { this.tiltTarget = deg; }
  woof(now: number) { this.woofUntil = now + 0.34; this.bounceV = -150; this.earV += 260; }
  jolt(k = 1) { this.earV += 220 * k; }
  hop(k = 1) { this.bounceV = -230 * k; this.earV += 200 * k; }
  yawn(now: number, secs = 0.9) { this.woofUntil = now + secs; }
  dash(px: number) { this.offsetTarget = px; }
  petting(on: boolean) { this.petTarget = on ? 1 : 0; }
  reset() { this.offsetTarget = 0; this.tiltTarget = 0; this.petTarget = 0; }

  /** Head/eyes follow a point in client coordinates (or look straight ahead for null). */
  lookAt(p: { x: number; y: number } | null) {
    if (!p) { this.gazeTarget = { x: 0, y: 0 }; return; }
    const box = this.svg.getBoundingClientRect();
    const ex = this.facingTarget > 0 ? HEAD_PIVOT[0] : W - HEAD_PIVOT[0];
    const cx = box.left + (ex / W) * box.width;
    const cy = box.top + (EYE_Y / H) * box.height;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, dist / 160);
    this.gazeTarget = { x: (dx / dist) * k * this.facingTarget, y: (dy / dist) * k };
  }

  /** Advance one frame. `dt` seconds since the last frame, `now` the clock in seconds. */
  tick(dt: number, now: number) {
    dt = Math.min(dt, 0.05);
    const m = this.m;
    m.time = now;
    this.pose = lerpPose(this.pose, this.target, ease(dt, 0.16));
    this.facing += (this.facingTarget - this.facing) * ease(dt, this.turn);
    m.stride += (this.strideTarget - m.stride) * ease(dt, 0.12);
    if (m.stride < 0.012 && this.strideTarget === 0) m.stride = 0;
    m.wag += (this.wagTarget - m.wag) * ease(dt, 0.4);
    m.gazeX += (this.gazeTarget.x - m.gazeX) * ease(dt, 0.07);
    m.gazeY += (this.gazeTarget.y - m.gazeY) * ease(dt, 0.07);
    this.tilt += (this.tiltTarget + 3 * m.gazeX - this.tilt) * ease(dt, 0.18);
    this.earV += (-150 * m.ear - 10 * this.earV) * dt;
    m.ear = clamp(m.ear + this.earV * dt, -28, 28);
    this.bounceV += (-260 * this.bounce - 16 * this.bounceV) * dt;
    this.bounce += this.bounceV * dt;

    const before = this.offset;
    this.offset += (this.offsetTarget - this.offset) * ease(dt, 0.2);
    if (Math.abs(this.offsetTarget - this.offset) < 0.05) this.offset = this.offsetTarget;
    const moved = Math.abs(this.offset - before);
    if (moved) m.phase += (moved / 46) * Math.PI;
    const dashStride = dt > 0 ? Math.min(1, moved / dt / 180) : 0;

    this.pet += (this.petTarget - this.pet) * ease(dt, 0.15);
    if (now > this.nextBlink && this.pose.eyes > 0.6) {
      this.blinkAt = now;
      this.nextBlink = now + 2.2 + 3.8 * Math.random();
      if (Math.random() < 0.18) this.nextBlink = now + 0.32;
    }
    const b = (now - this.blinkAt) / 0.15;
    m.blink = b >= 0 && b <= 1 ? Math.sin(b * Math.PI) : 0;

    const shown: Pose = {
      ...this.pose,
      headRot: this.pose.headRot + this.tilt,
      bodyRot: this.pose.bodyRot + this.lean,
      bodyY: this.pose.bodyY + this.bounce,
      headY: this.pose.headY + 1.15 * this.bounce,
      mouth: now < this.woofUntil ? 1 : this.pose.mouth,
      happy: Math.max(this.pose.happy, this.pet),
    };
    const f = frame(shown, dashStride > m.stride ? { ...m, stride: dashStride } : m);
    const sx = Math.abs(this.facing) < 0.02 ? 0.02 * Math.sign(this.facing || 1) : this.facing;
    const root = `translate(${this.offset.toFixed(1)} 0) translate(${W / 2} 0) scale(${sx.toFixed(3)} 1) translate(${-W / 2} 0)`;
    for (const [part, attr, key] of BINDINGS) {
      const el = this.els.get(part);
      if (!el) continue;
      const v = key === "root" ? root : String(f[key]);
      const id = `${part}:${attr}`;
      if (this.written.get(id) !== v) { el.setAttribute(attr, v); this.written.set(id, v); }
    }
  }
}

/* ───────────────────────────── acts (tricks) ───────────────────────────── */

export interface ActCtx {
  d: Rig;
  rest: Pose;
  facing: number;
  say: (text: string, secs?: number) => void;
  hearts: () => void;
}
export type Cue = [at: number, run: (now: number) => void];
const flip = (f: number) => (f === 1 ? -1 : 1);

export const ACTS: Record<string, (c: ActCtx, t: number) => Cue[]> = {
  woof: ({ d, say }, t) => [
    [t, (n) => { d.woof(n); say("woof!"); }],
    [t + 0.42, (n) => { d.woof(n); say("woof woof!"); }],
  ],
  spin: ({ d, rest, facing, say }, t) => [
    [t, () => { d.setPose("stand"); d.hop(0.5); }],
    [t + 0.14, () => d.face(flip(facing))],
    [t + 0.38, () => d.face(facing)],
    [t + 0.62, () => d.face(flip(facing))],
    [t + 0.86, () => { d.face(facing); say("wheee!"); }],
    [t + 1.3, () => d.setPose(rest)],
  ],
  beg: ({ d, rest, say }, t) => [
    [t, () => { d.setPose("beg"); d.wag(1); say("treat, please?", 1.7); }],
    [t + 1.9, () => { d.setPose(rest); d.wag(0.7); }],
  ],
  bow: ({ d, rest, say }, t) => [
    [t, () => { d.setPose("bow"); d.wag(1); say("play with me!"); }],
    [t + 0.55, () => d.hop(0.45)],
    [t + 1.7, () => { d.setPose(rest); d.wag(0.7); }],
  ],
  hop: ({ d, rest, say }, t) => [
    [t, () => { d.setPose("hop"); d.hop(1.1); say("boing!"); }],
    [t + 0.36, () => d.setPose(rest)],
    [t + 0.62, () => { d.setPose("hop"); d.hop(0.8); }],
    [t + 0.98, () => d.setPose(rest)],
  ],
  love: ({ d, rest, say, hearts }, t) => [
    [t, () => { d.setPose({ ...rest, happy: 1, tongue: 1 }); d.wag(1); hearts(); say("I like you!", 1.5); }],
    [t + 1.9, () => { d.setPose(rest); d.wag(0.7); }],
  ],
  tilt: ({ d, say }, t) => [
    [t, () => { d.cock(-14); say("hm?"); }],
    [t + 0.8, () => d.cock(12)],
    [t + 1.6, () => d.cock(0)],
  ],
  sneeze: ({ d, say }, t) => [
    [t, () => d.cock(-8)],
    [t + 0.32, (n) => { d.cock(10); d.jolt(1.4); d.hop(0.35); d.yawn(n, 0.22); say("achoo!"); }],
    [t + 0.8, () => d.cock(0)],
  ],
  zoomies: ({ d, rest, facing, say }, t) => [
    [t, () => { d.setPose("walk"); d.wag(1); say("zoomies!", 2); }],
    [t + 0.05, () => { d.face(1); d.dash(70); }],
    [t + 0.5, () => { d.face(-1); d.dash(-70); }],
    [t + 0.98, () => { d.face(1); d.dash(50); }],
    [t + 1.4, () => { d.face(-1); d.dash(-30); }],
    [t + 1.78, () => { d.face(1); d.dash(0); }],
    [t + 2.25, () => { d.face(facing); d.setPose(rest); d.wag(0.7); }],
  ],
  peekaboo: ({ d, say }, t) => [
    [t, () => d.setPose({ ...POSES.peek, headY: 120 })],
    [t + 0.55, () => { d.setPose("peek"); d.jolt(1.2); say("peekaboo!"); }],
  ],
  wake: ({ d, rest, say }, t) => [
    [t, (n) => { d.setPose("settle"); d.yawn(n, 0.9); say("*yaaawn*"); }],
    [t + 1.25, () => { d.setPose({ ...POSES.settle, happy: 1 }); d.wag(0.8); say("five more minutes…", 1.6); }],
    [t + 3.1, () => { d.setPose(rest); d.wag(0); say("zzz", 2); }],
  ],
};

/** Hearts that float up from (x, y) inside `host`. */
export function spawnHearts(host: HTMLElement, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    const s = document.createElement("span");
    s.className = "pup-heart";
    s.textContent = "♥";
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    host.append(s);
    const dx = (Math.random() - 0.5) * 90;
    const dy = -70 - 60 * Math.random();
    s.animate(
      [
        { transform: "translate(-50%, 0) scale(0.4)", opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: `translate(calc(-50% + ${dx.toFixed(0)}px), ${dy.toFixed(0)}px) scale(1.1)`, opacity: 0 },
      ],
      { duration: 1150 + 110 * i, delay: 80 * i, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" },
    ).finished.then(() => s.remove(), () => s.remove());
  }
}

const RANDOM_ACTS = ["woof", "spin", "beg", "bow", "hop", "love", "tilt", "sneeze"];
let bag: string[] = [];
/** Random next trick; mashing (4+ clicks in quick succession) triggers zoomies. */
export function pickAct(prev: string | null, mash: number) {
  if (mash >= 4) return "zoomies";
  if (!bag.length) bag = RANDOM_ACTS.filter((a) => a !== prev).sort(() => Math.random() - 0.5);
  return bag.pop()!;
}
