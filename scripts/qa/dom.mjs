#!/usr/bin/env node
// Dump the cleaned rendered DOM of a selector from the ORIGINAL site (what the browser actually shows after hydration).
//   node scripts/qa/dom.mjs <path> <selector> [--vw 1440] [--max 20000]
import { chromium } from "playwright-core";
const [path, sel] = process.argv.slice(2);
const opt = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : +process.argv[i + 1]; };
const vw = opt("vw", 1440), max = opt("max", 40000);
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: vw, height: 900 }, reducedMotion: "reduce" })).newPage();
await p.route(/cloudflareinsights/, (r) => r.abort());
await p.goto((process.env.ORIG_URL || "https://puppy.instabizweb.com") + path, { waitUntil: "networkidle" });
const html = await p.evaluate((sel) => {
  const el = document.querySelector(sel); if (!el) return "NOT FOUND";
  const c = el.cloneNode(true);
  c.querySelectorAll("script,style").forEach((n) => n.remove());
  c.querySelectorAll("img").forEach((i) => { const s = i.getAttribute("src") || ""; const m = decodeURIComponent(s).match(/url=([^&]+)/); i.setAttribute("src", m ? m[1] : s); i.removeAttribute("srcset"); i.removeAttribute("sizes"); i.removeAttribute("data-nimg"); i.removeAttribute("style"); });
  c.querySelectorAll("path[d]").forEach((n) => { const d = n.getAttribute("d"); if (d.length > 120) n.setAttribute("d", d.slice(0, 60) + "…[" + d.length + "]"); });
  return c.outerHTML.replace(/ class=""/g, "").replace(/ style=""/g, "");
}, sel);
console.log(html.length > max ? html.slice(0, max) + `\n…[truncated ${html.length - max} chars]` : html);
await b.close();
