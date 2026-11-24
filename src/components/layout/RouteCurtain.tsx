import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { PAW_D } from "./pawPath";
import { BLUSH, COLLAR, CREAM, FUR, FUR_DARK, GROUND, H, INK, JOINTS, LEGS, SHAPES, W, toes } from "../../lib/mascot/rig";
import { introTime } from "../../lib/curtain";
import { reducedMotion } from "../../lib/mascot/loop";

const line = { stroke: INK, strokeWidth: 3.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const open = { ...line, fill: "none" } as const;

function Leg({ cls, at, d, len, fill }: { cls: string; at: [number, number]; d: string; len: number; fill: string }) {
  return (
    <g className={`tp-runner__leg ${cls}`} style={{ transformOrigin: `${at[0]}px ${at[1]}px` }}>
      <g transform={`translate(${at[0]} ${at[1]})`}>
        <path d={`${d}Z`} fill={fill} />
        <path d={d} {...open} />
        <path d={toes(len)} {...open} strokeWidth={2.4} />
      </g>
    </g>
  );
}

/** The little Teddy that runs across the curtain (legs, tail and ears are animated in CSS). */
function Runner() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="tp-runner" aria-hidden="true" focusable="false" style={{ overflow: "visible" }}>
      <ellipse cx={150} cy={GROUND + 2} rx={86} ry={7} fill={INK} opacity={0.12} className="tp-runner__shadow" />
      <g className="tp-runner__body">
        <Leg cls="tp-runner__leg--bf" at={JOINTS.hipF} d={LEGS.backFar} len={GROUND - 192} fill={FUR_DARK} />
        <Leg cls="tp-runner__leg--ff" at={JOINTS.shoulderF} d={LEGS.frontFar} len={GROUND - 192} fill={FUR_DARK} />
        <g className="tp-runner__tail" style={{ transformOrigin: `${JOINTS.tailBase[0]}px ${JOINTS.tailBase[1]}px` }}>
          <path d={SHAPES.tailStem} {...open} strokeWidth={9} />
          <path d={SHAPES.tailStem} stroke={FUR} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={SHAPES.tail} fill={FUR} {...line} />
        </g>
        <Leg cls="tp-runner__leg--bn" at={JOINTS.hipN} d={LEGS.back} len={GROUND - 194} fill={FUR} />
        <path d={SHAPES.body} fill={FUR} {...line} />
        <path d={SHAPES.chest} fill={FUR} {...line} />
        <Leg cls="tp-runner__leg--fn" at={JOINTS.shoulderN} d={LEGS.front} len={GROUND - 194} fill={FUR} />
        <g className="tp-runner__head">
          <path d={SHAPES.collar} fill={COLLAR} {...line} strokeWidth={3} />
          <path d={SHAPES.tag} fill={CREAM} {...line} strokeWidth={2.4} />
          <path d={SHAPES.earL} fill={FUR_DARK} {...line} className="tp-runner__ear" style={{ transformOrigin: "174px 82px" }} />
          <path d={SHAPES.earR} fill={FUR_DARK} {...line} className="tp-runner__ear tp-runner__ear--r" style={{ transformOrigin: "250px 82px" }} />
          <path d={SHAPES.head} fill={FUR} {...line} />
          <path d={SHAPES.topknot} fill={FUR} {...line} strokeWidth={3} />
          <path d={SHAPES.muzzle} fill={CREAM} />
          <circle cx={181} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <path d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101" {...open} />
          <path d={SHAPES.nose} fill={INK} />
          <path d={SHAPES.mouth} {...open} strokeWidth={3} />
          <path d={SHAPES.tongue} fill="#e98c8c" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

const PRINTS: [number, number, number][] = [[18, 6, -76], [27, -4, -84], [36, 7, -72], [45, -3, -86], [54, 6, -74]];

type State = "intro" | "idle" | "covering" | "covered" | "snap" | "lifting";

/**
 * The loading curtain: a scalloped blanket with Teddy running across it. It plays on every page load
 * (intro), and covers the page when you follow an internal link, lifting once the next page is ready.
 */
export default function RouteCurtain() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;
  const el = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const target = useRef<string | null>(null);
  const covered = useRef(0);
  const path = useRef(pathname);
  const focusMain = useRef(false);
  const lift = useRef(() => {});

  useEffect(() => {
    const node = el.current!;
    const html = document.documentElement;
    const set = (s: State) => {
      node.dataset.state = s;
      if (s === "idle") delete html.dataset.curtain;
      else html.dataset.curtain = s;
    };
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

    const finish = () => {
      const s = node.dataset.state;
      if (s === "idle" || s === "lifting") return;
      clear();
      target.current = null;
      set("lifting");
      dispatchEvent(new Event("tp:arrived"));
      if (focusMain.current) { focusMain.current = false; document.getElementById("main")?.focus({ preventScroll: true }); }
      later(() => set("idle"), 460);
    };
    lift.current = finish;

    const go = (href: string) => {
      const u = new URL(href, location.href);
      if (u.pathname === location.pathname && u.search === location.search) {
        target.current = null;
        scrollTo({ top: 0, behavior: "instant" });
        later(finish, 120);
        return;
      }
      navRef.current(u.pathname + u.search + u.hash);
      later(finish, 6000); // never leave the visitor stuck behind the curtain
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.dataset.noCurtain !== undefined) return;
      const u = new URL(a.href, location.href);
      const external = u.origin !== location.origin || /^\/(admin|api|media|_next)(\/|$)/.test(u.pathname);
      if (external) return;
      if (u.pathname === location.pathname && (u.hash || u.search !== location.search)) return; // in-page anchor
      if (reducedMotion()) return;
      e.preventDefault();
      e.stopPropagation();
      focusMain.current = e.detail === 0;
      dispatchEvent(new Event("tp:navigate"));
      target.current = u.href;
      const s = node.dataset.state;
      if (s === "covered" || s === "snap") go(u.href);
      else if (s === "covering") return;
      else {
        clear();
        if (s === "intro" && introTime() < 1080) { set("covered"); covered.current = performance.now(); go(u.href); }
        else {
          set("covering");
          later(() => { set("covered"); covered.current = performance.now(); if (target.current) go(target.current); }, 300);
        }
      }
    };
    const onPop = () => {
      if (reducedMotion() || location.pathname === path.current) return;
      clear();
      set("snap");
      covered.current = performance.now();
      later(finish, 1400);
    };
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) { clear(); set("idle"); } };

    if (node.dataset.state === "intro") {
      const t = introTime();
      later(() => dispatchEvent(new Event("tp:arrived")), Math.max(0, 560 - t));
      later(() => node.dataset.state === "intro" && set("idle"), Math.max(0, 1080 - t));
    }
    if (reducedMotion()) set("idle");
    addEventListener("click", onClick, true);
    addEventListener("popstate", onPop);
    addEventListener("pageshow", onShow);
    return () => {
      clear();
      delete html.dataset.curtain;
      removeEventListener("click", onClick, true);
      removeEventListener("popstate", onPop);
      removeEventListener("pageshow", onShow);
    };
  }, []);

  // The new page has rendered: lift the curtain (after it has been fully down for a moment).
  useEffect(() => {
    if (pathname === path.current) return;
    path.current = pathname;
    const s = el.current?.dataset.state;
    if (s !== "covered" && s !== "snap" && s !== "covering") return;
    const wait = Math.max(0, 140 - (performance.now() - covered.current));
    const t = window.setTimeout(() => requestAnimationFrame(() => lift.current()), s === "covering" ? 340 : wait);
    return () => clearTimeout(t);
  }, [pathname]);

  return createPortal(
    <div ref={el} className="tp-curtain" data-state="intro" aria-hidden="true">
      <div className="tp-curtain__blanket">
        <svg className="tp-curtain__edge tp-curtain__edge--top" width="100%" height="40" preserveAspectRatio="none">
          <defs>
            <pattern id="tp-curtain-scallop" width="76" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40V27A38 25 0 0 1 76 27V40Z" fill="#fbe3b4" />
              <path d="M0 27A38 25 0 0 1 76 27" fill="none" stroke="#2a170e" strokeWidth="3" />
              <path d="M11 33A27 19 0 0 1 65 33" fill="none" stroke="#2a170e" strokeWidth="1.6" strokeDasharray="3.5 5.5" strokeLinecap="round" opacity=".42" />
            </pattern>
          </defs>
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
        <div className="tp-curtain__stage">
          <div className="tp-curtain__prints">
            {PRINTS.map(([left, top, rot], i) => (
              <svg key={i} viewBox="0 0 64 64" className="tp-curtain__print" style={{ left: `${left}%`, top: `${top}px`, rotate: `${rot + 90}deg`, animationDelay: `${0.16 + 0.12 * i}s` }}>
                <path d={PAW_D} />
              </svg>
            ))}
          </div>
          <div className="tp-curtain__runner"><Runner /></div>
          <p className="tp-curtain__note font-scrawl">every puppy is family</p>
        </div>
        <svg className="tp-curtain__edge tp-curtain__edge--bottom" width="100%" height="40" preserveAspectRatio="none">
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
      </div>
    </div>,
    document.body,
  );
}
