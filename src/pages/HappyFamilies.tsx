import { useCallback, useEffect, useRef, useState } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import THUMBS_RAW from "../data/wall-thumbs.json";
import HappyFamiliesMarkup from "./markup/HappyFamiliesMarkup";

const THUMBS = THUMBS_RAW as [number, number][][];
const ALT = "A happy TeddyPups family with their new puppy";

/** Photo wall + full-screen viewer (native <dialog>, arrows/Escape/swipe). */
export default function HappyFamilies() {
  usePageMeta();
  const wrap = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [at, setAt] = useState(0);
  const drag = useRef<number | null>(null);

  useEffect(() => {
    setPhotos([...wrap.current!.querySelectorAll<HTMLImageElement>(".tp-wall__print img")].map((i) => i.getAttribute("src") || ""));
  }, []);

  // The original serves each wall photo through Next's image optimiser, so the browser's intrinsic ratio is that of a
  // resized thumbnail whose height was rounded to whole pixels (e.g. 175x233, not an exact 3:4). Over 64 photos that
  // drifts ~3px at 390px. We serve the full-size files, so apply the thumbnail ratios recorded from the original
  // (src/data/wall-thumbs.json: per photo, the thumbnail size at 390 / 768 / 1440px wide; only the phone size is needed).
  useEffect(() => {
    const fit = () => {
      const phone = innerWidth < 768; // tablet/desktop already match without it
      wrap.current?.querySelectorAll<HTMLImageElement>(".tp-wall__print img").forEach((img, i) => {
        const d = THUMBS[i]?.[0];
        if (phone && d) img.style.aspectRatio = `${d[0]} / ${d[1]}`;
        else img.style.removeProperty("aspect-ratio");
      });
    };
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);

  const go = useCallback((d: number) => setAt((a) => (a + d + photos.length) % photos.length), [photos.length]);

  const open = (i: number) => {
    setAt(i);
    dialog.current?.showModal();
    window.__lenis?.stop();
  };
  const close = () => dialog.current?.close();

  useEffect(() => {
    const d = dialog.current!;
    const onClose = () => window.__lenis?.start();
    const onKey = (e: KeyboardEvent) => {
      if (!d.open) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const onBackdrop = (e: MouseEvent) => e.target === d && d.close();
    d.addEventListener("close", onClose);
    d.addEventListener("click", onBackdrop);
    addEventListener("keydown", onKey);
    return () => { d.removeEventListener("close", onClose); d.removeEventListener("click", onBackdrop); removeEventListener("keydown", onKey); };
  }, [go]);

  useEffect(() => {
    const root = wrap.current!;
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(".tp-wall__print");
      if (!b) return;
      const all = [...root.querySelectorAll(".tp-wall__print")];
      open(all.indexOf(b));
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  const src = photos[at];
  const near = photos.length ? [photos[(at + 1) % photos.length], photos[(at - 1 + photos.length) % photos.length]] : [];

  return (
    <div ref={wrap}>
      <HappyFamiliesMarkup />
      <dialog
        ref={dialog}
        aria-label="Photo viewer"
        data-lenis-prevent="true"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="font-scrawl text-lg">{at + 1} / {photos.length}</p>
            <button type="button" className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa" onClick={close}>Close</button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div
              className="absolute inset-0 touch-pan-y"
              style={{ userSelect: "none", touchAction: "pan-y" }}
              onPointerDown={(e) => (drag.current = e.clientX)}
              onPointerUp={(e) => {
                if (drag.current == null) return;
                const dx = e.clientX - drag.current;
                drag.current = null;
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
              }}
            >
              {src && <img key={src} alt={ALT} src={src} loading="eager" decoding="async" className="tp-viewer__sharp object-contain" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />}
            </div>
            <span aria-hidden="true" className="sr-only">
              {near.map((s) => <img key={s} alt="" src={s} loading="eager" />)}
            </span>
          </div>
          <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button type="button" className="h-12 rounded-full border-2 border-milk px-6 font-semibold" onClick={() => go(-1)}>Previous</button>
            <button type="button" className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa" onClick={() => go(1)}>Next</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
