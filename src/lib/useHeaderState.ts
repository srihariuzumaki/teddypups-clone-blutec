import { useEffect, useState } from "react";

/** scrolled: past the top; hidden: scrolling down beyond the header height. */
export function useHeaderState(disabled: boolean) {
  const [state, setState] = useState({ scrolled: false, hidden: false });
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      setState((s) => {
        const scrolled = y > 8;
        let hidden = s.hidden;
        if (disabled || y < 120) hidden = false;
        else if (delta > 6) hidden = true;
        else if (delta < -6) hidden = false;
        return scrolled === s.scrolled && hidden === s.hidden ? s : { scrolled, hidden };
      });
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [disabled]);
  return state;
}
