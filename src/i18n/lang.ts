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
let trFn: ((s: string) => string) | null = null;
/** index.ts registers the translator when it is loaded (Arabic only), so English never downloads the dictionaries. */
export const registerTr = (fn: (s: string) => string) => { trFn = fn; };
export const tx = (en: string) => (isRtl() && trFn ? trFn(en) : en);

export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* private mode */ }
  const u = new URL(location.href); u.searchParams.delete("lang");
  location.href = u.toString();
}

