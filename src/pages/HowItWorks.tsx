import { useEffect, useRef } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import HowItWorksMarkup from "./markup/HowItWorksMarkup";

/** "Two ways home" tab switch: one journey panel visible at a time. */
export default function HowItWorks() {
  usePageMeta();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const list = root?.querySelector<HTMLElement>('[role="tablist"]');
    if (!root || !list) return;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((t) => root.querySelector<HTMLElement>("#" + t.getAttribute("aria-controls")))
    const select = (i: number, focus = false) => {
      tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", String(k === i));
        t.tabIndex = k === i ? 0 : -1;
        panels[k]?.toggleAttribute("hidden", k !== i);
      });
      list.style.setProperty("--at", String(i));
      if (focus) tabs[i].focus();
    };
    select(tabs.findIndex((t) => t.getAttribute("aria-selected") === "true") || 0);
    const click = (e: Event) => {
      const i = tabs.indexOf((e.target as HTMLElement).closest('[role="tab"]') as HTMLButtonElement);
      if (i >= 0) select(i);
    };
    const key = (e: KeyboardEvent) => {
      const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); select((i + 1) % tabs.length, true); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      if (e.key === "Home") { e.preventDefault(); select(0, true); }
      if (e.key === "End") { e.preventDefault(); select(tabs.length - 1, true); }
    };
    list.addEventListener("click", click);
    list.addEventListener("keydown", key);
    return () => { list.removeEventListener("click", click); list.removeEventListener("keydown", key); };
  }, []);

  return (
    <div ref={ref}>
      <HowItWorksMarkup />
    </div>
  );
}
