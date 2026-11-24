import { useEffect, type RefObject } from "react";
import { curtainDown } from "./curtain";

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Port of the original <RevealScope>: elements with [data-reveal] already in view are revealed at once,
 * the rest are "armed" (hidden by CSS) and revealed when they scroll into view.
 */
export function useRevealScope(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pending = "[data-reveal]:not([data-revealed])";
    if (prefersReducedMotion()) {
      const all = () => root.querySelectorAll<HTMLElement>(pending).forEach((e) => (e.dataset.revealed = "true"));
      all();
      const mo = new MutationObserver(all);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    // While the loading curtain covers the page, things that scroll into view wait and are revealed as it lifts.
    const held = new Set<HTMLElement>();
    const show = (el: HTMLElement) => {
      el.dataset.revealed = "true";
      io.unobserve(el);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const el = en.target as HTMLElement;
          curtainDown() ? held.add(el) : show(el);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    const arm = (el: HTMLElement) => {
      if (el.dataset.armed) return io.observe(el);
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && !curtainDown()) {
        el.dataset.revealed = "true";
        return;
      }
      el.dataset.armed = "true";
      io.observe(el);
    };
    const scan = () => root.querySelectorAll<HTMLElement>(pending).forEach(arm);
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    const release = () => { held.forEach(show); held.clear(); };
    addEventListener("tp:arrived", release);
    // Safety net: if the curtain event is missed, release once it is no longer down.
    let t = 0;
    const poll = () => (curtainDown() ? (t = window.setTimeout(poll, 400)) : release());
    t = window.setTimeout(poll, 1600);
    return () => {
      clearTimeout(t);
      io.disconnect();
      mo.disconnect();
      removeEventListener("tp:arrived", release);
    };
  }, [ref]);
}
