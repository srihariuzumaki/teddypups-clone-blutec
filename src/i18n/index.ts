import { UI } from "./ar-ui";
import { PAGES } from "./ar-pages";
import { RULES, compose, setLookup } from "./ar-puppies";

import { registerTr } from "./lang";
export { getLang, setLang, isRtl, tx } from "./lang";

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
registerTr(tr);
