import { useEffect, useRef } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { WA_LINK } from "../data/site";
import FaqMarkup from "./markup/FaqMarkup";

/** Cork-board FAQ: one note unfolds at a time; the search box filters notes live. */
export default function Faq() {
  usePageMeta();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const board = root?.querySelector<HTMLElement>(".tp-notes");
    const list = root?.querySelector<HTMLElement>(".tp-notes__list");
    const input = root?.querySelector<HTMLInputElement>('input[type="search"]');
    const count = root?.querySelector<HTMLElement>(".tp-notes__count");
    const boardWrap = root?.querySelector<HTMLElement>(".tp-notes__board");
    if (!board || !list || !input || !count || !boardWrap) return;
    const notes = [...list.querySelectorAll<HTMLElement>(".tp-note")];

    const empty = document.createElement("div");
    empty.className = "tp-note tp-note--empty";
    empty.hidden = true;
    boardWrap.appendChild(empty);

    const setOpen = (note: HTMLElement | null) => {
      notes.forEach((n) => {
        const open = n === note;
        n.toggleAttribute("data-unfolded", open);
        n.querySelector("button")?.setAttribute("aria-expanded", String(open));
        n.querySelector(".tp-note__answer")?.toggleAttribute("inert", !open);
      });
      board.toggleAttribute("data-open", !!note);
    };
    setOpen(null);

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest(".tp-note__q button");
      if (!btn) return;
      const note = btn.closest<HTMLElement>(".tp-note")!;
      setOpen(note.hasAttribute("data-unfolded") ? null : note);
    };
    list.addEventListener("click", onClick);

    const onInput = () => {
      const q = input.value.trim().toLowerCase();
      let n = 0;
      notes.forEach((note) => {
        const hit = !q || (note.textContent ?? "").toLowerCase().includes(q);
        note.hidden = !hit;
        if (hit) n++;
      });
      if (board.hasAttribute("data-open") && notes.every((x) => x.hidden || !x.hasAttribute("data-unfolded"))) setOpen(null);
      count.textContent = q ? `${n} ${n === 1 ? "note" : "notes"} found` : `${notes.length} notes on the board`;
      empty.hidden = n > 0;
      if (!n) {
        empty.innerHTML = `<span aria-hidden="true" class="tp-note__pin"></span><p class="font-plush-text text-[1.2rem] font-bold"></p><p class="mt-2"><a href="${WA_LINK}" target="_blank" rel="noopener noreferrer" class="link-ink">Ask us on WhatsApp</a> and we'll answer.</p>`;
        empty.querySelector("p")!.textContent = `No note about “${input.value.trim()}” yet.`;
      }
    };
    input.addEventListener("input", onInput);
    return () => {
      list.removeEventListener("click", onClick);
      input.removeEventListener("input", onInput);
      empty.remove();
    };
  }, []);

  return (
    <div ref={ref}>
      <FaqMarkup />
    </div>
  );
}
