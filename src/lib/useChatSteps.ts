import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "./useRevealScope";

/**
 * "How it works" WhatsApp scene: on desktop, the step in the reading band becomes active, the phone shows
 * "typing…" for 750ms and then reveals that step's message group. Mobile / reduced motion: everything is shown.
 */
export function useChatSteps(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const chat = rootRef.current?.querySelector<HTMLElement>(".tp-chat");
    if (!chat) return;
    const steps = chat.querySelector<HTMLElement>(".tp-chat__steps");
    const status = chat.querySelector<HTMLElement>(".tp-phone__status");
    const groups = [...chat.querySelectorAll<HTMLElement>(".tp-msg-group")];
    const items = steps ? ([...steps.children] as HTMLElement[]) : [];
    const mq = matchMedia("(min-width: 1024px)");
    let active = -1, timer = 0, io: IntersectionObserver | undefined;

    const paint = (r: number, typing: boolean) => {
      items.forEach((li, i) => {
        li.toggleAttribute("data-active", i === r);
        li.toggleAttribute("data-done", i < r);
      });
      groups.forEach((g, i) => (g.dataset.show = i < r || (i === r && !typing) ? "true" : "false"));
      if (status) status.textContent = typing ? "typing…" : "online";
    };
    const setup = () => {
      io?.disconnect();
      clearTimeout(timer);
      if (prefersReducedMotion() || !mq.matches) {
        paint(items.length - 1, false);
        return;
      }
      active = -1;
      paint(-1, false);
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const k = items.indexOf(e.target as HTMLElement);
            if (k <= active) continue;
            active = k;
            paint(k, true);
            clearTimeout(timer);
            timer = window.setTimeout(() => paint(k, false), 750);
          }
        },
        { rootMargin: "-28% 0px -62% 0px" },
      );
      items.forEach((li) => io!.observe(li));
    };
    setup();
    mq.addEventListener("change", setup);
    return () => {
      io?.disconnect();
      clearTimeout(timer);
      mq.removeEventListener("change", setup);
    };
  }, [rootRef]);
}
