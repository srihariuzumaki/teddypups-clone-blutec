import { UI } from "./ar-ui";
import { PAGES } from "./ar-pages";
import { RULES, compose, setLookup } from "./ar-puppies";

export type Lang = "en" | "ar";
const KEY = "tp-lang";

/** The language is decided once per load (the toggle reloads), and index.html applies lang/dir before first paint. */
export function getLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "ar" || q === "en") { localStorage.setItem(KEY, q); return q; }
    return localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch { return "en"; }
}
export const isRtl = () => document.documentElement.dir === "rtl";
/** Translate text that is written by code (prefilled messages, links) rather than rendered into the DOM. */
export const tx = (en: string) => (isRtl() ? tr(en) : en);

export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* private mode */ }
  const u = new URL(location.href); u.searchParams.delete("lang");
  location.href = u.toString();
}

const EXACT = new Map<string, string>(Object.entries({ ...UI, ...PAGES }));
const cache = new Map<string, string | null>();

/** English → Arabic. Returns the input unchanged when there is no translation (so untranslated copy still shows). */
export function tr(en: string): string {
  const key = en.replace(/\s+/g, " ").trim();
  if (!key || !/[A-Za-z]/.test(key)) return en;
  let hit = cache.get(key);
  if (hit === undefined) {
    hit = EXACT.get(key) ?? null;
    if (hit == null) for (const [re, fn] of RULES) { const m = key.match(re); if (m) { const r = fn(m); if (r && !/undefined|null/.test(r)) { hit = r; break; } } }
    if (hit == null) hit = compose(key) /* composite phrases like "girl · 2 months" */?.replace(/ · /g, " · ") ?? null;
    cache.set(key, hit);
  }
  if (hit == null) return en;
  return (en.match(/^\s*/)?.[0] ?? "") + hit + (en.match(/\s*$/)?.[0] ?? "");
}

setLookup(tr);
