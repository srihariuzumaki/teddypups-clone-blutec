#!/usr/bin/env node
// Crawl our app (English) and collect every user-visible string (text nodes + aria-label/alt/placeholder/title).
// usage: node scripts/i18n/extract.mjs            -> scripts/i18n/strings.json  (every English string)
//        LANG_AR=1 node scripts/i18n/extract.mjs   -> scripts/i18n/untranslated.json (strings still in English in Arabic mode)
import { chromium } from "playwright-core";
import fs from "node:fs";
const BASE = process.env.OURS_URL || "http://localhost:5173";
const pages = ["/", "/puppies", "/gone-home", "/happy-families", "/how-it-works", "/faq", "/contact", "/nope-404"];
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
if (process.env.LANG_AR) await ctx.addInitScript(() => localStorage.setItem("tp-lang", "ar"));
const p = await ctx.newPage();
const seen = new Map();
const add = (s, where) => { s = s.replace(/\s+/g, " ").trim(); if (!s || !/[A-Za-z]/.test(s)) return; (seen.get(s) ?? seen.set(s, new Set()).get(s)).add(where); };
async function grab(where) {
  const list = await p.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode()); ) { const t = n.parentElement?.tagName; if (t === "SCRIPT" || t === "STYLE" || t === "NOSCRIPT") continue; out.push(n.nodeValue); }
    document.querySelectorAll("[aria-label],[alt],[placeholder],[title]").forEach((e) => ["aria-label", "alt", "placeholder", "title"].forEach((a) => e.getAttribute(a) && out.push(e.getAttribute(a))));
    out.push(document.title, document.querySelector('meta[name=description]')?.content || "");
    return out;
  });
  list.forEach((s) => add(s, where));
}
let puppySlugs = [];
for (const path of pages) {
  await p.goto(BASE + path, { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
  await grab(path);
  if (path === "/puppies") puppySlugs = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/puppies/"]')].map((a) => a.getAttribute("href")))]);
}
for (const s of puppySlugs.slice(0, 40)) { await p.goto(BASE + s, { waitUntil: "networkidle" }); await p.waitForTimeout(600); await grab(s); }
await b.close();
const o = Object.fromEntries([...seen].map(([k, v]) => [k, [...v].slice(0, 3)]));
fs.writeFileSync(process.env.LANG_AR ? "scripts/i18n/untranslated.json" : "scripts/i18n/strings.json", JSON.stringify(o, null, 1));
console.log(Object.keys(o).length, "strings from", pages.length + puppySlugs.length, "pages");
