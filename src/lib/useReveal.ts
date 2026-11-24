import { useEffect, useRef } from "react";

/** Adds data-revealed once the element scrolls into view (CSS does the animation). */
export function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("data-armed", "");
    if (!("IntersectionObserver" in window)) {
      el.setAttribute("data-revealed", "");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.setAttribute("data-revealed", "");
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}
