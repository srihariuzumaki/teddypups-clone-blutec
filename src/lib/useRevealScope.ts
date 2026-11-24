import { useEffect, type RefObject } from "react";

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
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          (en.target as HTMLElement).dataset.revealed = "true";
          io.unobserve(en.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    const arm = (el: HTMLElement) => {
      if (el.dataset.armed) return io.observe(el);
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
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
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [ref]);
}
