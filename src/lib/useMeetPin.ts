import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "./useRevealScope";

/**
 * "Meet the pups": on desktop the section is pinned and vertical scroll drives a horizontal treadmill of doors
 * (original: framer-motion useScroll + spring). Here: sticky stage + eased transform on rAF.
 */
export function useMeetPin(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = rootRef.current?.querySelector<HTMLElement>(".tp-meet");
    if (!section) return;
    const range = section.querySelector<HTMLElement>("[data-pin-range]")!;
    const track = section.querySelector<HTMLElement>(".tp-meet__track")!;
    const hall = section.querySelector<HTMLElement>(".tp-meet__hall")!;
    const stage = section.querySelector<HTMLElement>(".tp-meet__stage")!;
    const doors = [...track.children] as HTMLElement[];
    const mqDesktop = matchMedia("(min-width: 1024px)");
    let pinned = false, overflow = 0, target = 0, current = 0, raf = 0;

    const measure = () => {
      pinned = mqDesktop.matches && !prefersReducedMotion();
      if (pinned) {
        section.dataset.pinned = "true";
        const head = stage.querySelector<HTMLElement>(".tp-meet__head");
        const plate = Math.max(64, ...[...track.querySelectorAll<HTMLElement>(".tp-door__plate")].map((e) => e.offsetHeight));
        const floor = hall.querySelector<HTMLElement>(".tp-meet__floor")?.offsetHeight ?? 0;
        const w = Math.max(128, Math.min(256, innerWidth * 0.15, (stage.clientHeight - (head ? head.offsetTop + head.offsetHeight : 0) - floor - plate - 40) / 1.3));
        hall.style.setProperty("--door-w", `${w.toFixed(0)}px`);
      } else {
        delete section.dataset.pinned;
        hall.style.removeProperty("--door-w");
        track.style.transform = "";
        doors.forEach((d) => (d.dataset.open = "true"));
      }
      overflow = Math.max(0, track.scrollWidth - innerWidth);
      range.style.height = pinned ? `calc(100vh + ${Math.round(overflow * 0.8)}px)` : "";
      range.style.setProperty("--pinned", pinned ? "1" : "0");
      const teddy = hall.querySelector<HTMLElement>(".tp-meet__teddy");
      if (teddy) { teddy.dataset.pose = pinned ? "walk" : "sit"; if (pinned) teddy.dataset.act = "treadmill"; else delete teddy.dataset.act; }
      read();
      apply(true);
    };
    const read = () => {
      if (!pinned) return;
      const r = range.getBoundingClientRect();
      const span = Math.max(1, range.offsetHeight - innerHeight);
      target = Math.min(1, Math.max(0, -r.top / span));
    };
    const apply = (snap = false) => {
      if (!pinned) return;
      current = snap ? target : current + (target - current) * 0.16;
      if (Math.abs(target - current) < 0.0004) current = target;
      const x = -overflow * current;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      hall.style.setProperty("--floor-x", `${x.toFixed(1)}px`);
      const edge = innerWidth * 0.36;
      for (const d of doors) {
        const open = d.offsetLeft + x < edge;
        if ((d.dataset.open === "true") !== open) d.dataset.open = String(open);
      }
    };
    const tick = () => {
      read();
      apply();
      raf = requestAnimationFrame(tick);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(stage);
    addEventListener("resize", measure);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("resize", measure);
    };
  }, [rootRef]);
}
