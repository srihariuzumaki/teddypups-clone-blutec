import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { available } from "../data/puppies";
import PuppiesMarkup from "./markup/PuppiesMarkup";

const WHERE = [
  ["", "Everywhere"],
  ["imported", "Imported"],
  ["korean", "Korean Teacup"],
] as const;
const BREEDS = [
  ["maltipoo", "Maltipoo"],
  ["pomeranian", "Pomeranian"],
  ["poodle", "Poodle"],
  ["cavapoo", "Cavapoo"],
  ["shih-tzu", "Shih Tzu"],
] as const;
const SEX = [
  ["boy", "Boys"],
  ["girl", "Girls"],
] as const;

const bySlug = new Map(available.map((p) => [p.slug, p]));

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={on} className="tp-sticker-chip" onClick={onClick}>
      {children}
    </button>
  );
}

export default function Puppies() {
  usePageMeta();
  const [params, setParams] = useSearchParams();
  const where = params.get("origin") ?? "";
  const breed = params.get("breed") ?? "";
  const sex = params.get("sex") ?? "";
  const listRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    let n = 0;
    root.querySelectorAll<HTMLLIElement>("ul.tp-sketches > li").forEach((li) => {
      const slug = li.querySelector("a")?.getAttribute("href")?.split("/").pop() ?? "";
      const p = bySlug.get(slug);
      const ok =
        !p ||
        ((!where || (where === "imported" ? p.origin === "imported" : p.name.toLowerCase().includes("korean"))) &&
          (!breed || p.breedKey === breed || p.slug.includes(breed)) &&
          (!sex || p.sex.includes(sex)));
      li.hidden = !ok;
      if (ok) n++;
    });
    if (countRef.current) countRef.current.textContent = n ? `${n} ${n === 1 ? "puppy" : "puppies"} looking for a home` : "No matches yet. Try clearing a filter.";
  }, [where, breed, sex]);

  const filters = (
    <>
      <div role="group" aria-label="Filter puppies" className="tp-sketchpad flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">where</span>
          {WHERE.map(([k, l]) => (
            <Chip key={k} on={where === k} onClick={() => set("origin", k)}>{l}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">breed</span>
          {BREEDS.map(([k, l]) => (
            <Chip key={k} on={breed === k} onClick={() => set("breed", k)}>{l}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">boy or girl</span>
          {SEX.map(([k, l]) => (
            <Chip key={k} on={sex === k} onClick={() => set("sex", k)}>{l}</Chip>
          ))}
        </div>
      </div>
      <p ref={countRef} className="font-scrawl mt-10 text-lg text-[var(--ink-soft)]" aria-live="polite">
        {available.length} puppies looking for a home
      </p>
    </>
  );

  return (
    <div ref={listRef}>
      <PuppiesMarkup filters={filters} />
    </div>
  );
}
