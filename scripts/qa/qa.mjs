#!/usr/bin/env node
// Visual QA: capture the ORIGINAL site and OUR site the same way, then pixel-diff them.
//
//   node scripts/qa/qa.mjs <path> [--vw 1440] [--vh 900] [--sel ".tp-hero,.tp-meet"] [--frames] [--motion] [--skip-capture]
//
// Output: qa-out/<page>/<vw>/{orig,ours,diff}/…  + qa-out/<page>/<vw>/report.json (printed as a table).
// - "sections": element screenshots for each --sel selector (default per page below) – best for layout fidelity.
// - "frames":   viewport-sized screenshots every viewport-height (--frames) – good for pinned/animated scenes.
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1]?.startsWith("--") || args[i + 1] === undefined ? true : args[i + 1]; };
const pagePath = args[0]?.startsWith("--") ? "/" : args[0] || "/";
const VW = +flag("vw", 1440), VH = +flag("vh", 900);
const ORIG = process.env.ORIG_URL || "https://puppy.instabizweb.com";
const OURS = process.env.OURS_URL || "http://127.0.0.1:5173";
const motion = flag("motion", false) ? "no-preference" : "reduce";
const slug = pagePath === "/" ? "home" : pagePath.replace(/^\/|\/$/g, "").replace(/[/?=&]/g, "_");
const root = join("qa-out", slug, String(VW));

const DEFAULT_SEL = {
  home: [".tp-header", ".tp-hero", ".tp-meet", ".tp-paths", ".tp-chat", ".tp-passport", ".tp-dusk", ".tp-night", ".tp-home", ".tp-footer"],
};
const sels = (flag("sel", "") || "").split(",").filter(Boolean);
const selectors = sels.length ? sels : DEFAULT_SEL[slug] || [".tp-header", "main", ".tp-footer"];

async function capture(label, base) {
  const dir = join(root, label); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--no-sandbox"] });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, reducedMotion: motion, deviceScaleFactor: 1 });
  await ctx.route(/cloudflareinsights/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(base + pagePath, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  // trigger lazy images / reveals
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(VH / 2)) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(110); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(700);
  const info = { height: await p.evaluate(() => document.documentElement.scrollHeight), sections: {} };

  for (const [i, sel] of selectors.entries()) {
    const el = p.locator(sel).first();
    if (!(await el.count())) { info.sections[sel] = null; continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(350);
    const box = await el.boundingBox();
    info.sections[sel] = { w: Math.round(box.width), h: Math.round(box.height) };
    await el.screenshot({ path: join(dir, `sec-${String(i).padStart(2, "0")}-${sel.replace(/[^\w]+/g, "_")}.png`), animations: "disabled" }).catch(() => {});
  }
  if (flag("frames", false)) {
    for (let n = 0, y = 0; y < info.height; n++, y += VH) {
      await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(400);
      await p.screenshot({ path: join(dir, `frame-${String(n).padStart(2, "0")}.png`) });
    }
  }
  writeFileSync(join(dir, "info.json"), JSON.stringify(info, null, 1));
  await b.close();
  return info;
}

function diffPair(a, b, out) {
  const A = PNG.sync.read(readFileSync(a)), B = PNG.sync.read(readFileSync(b));
  const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
  const crop = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
  const ca = crop(A), cb = crop(B), d = new PNG({ width: w, height: h });
  const n = pixelmatch(ca.data, cb.data, d.data, w, h, { threshold: 0.12, alpha: 0.4 });
  writeFileSync(out, PNG.sync.write(d));
  return { mismatch: +(100 * n / (w * h)).toFixed(2), size: `${A.width}x${A.height} vs ${B.width}x${B.height}` };
}

const skip = flag("skip-capture", false);
let oi, ui;
if (!skip) { oi = await capture("orig", ORIG); ui = await capture("ours", OURS); }
else { oi = JSON.parse(readFileSync(join(root, "orig/info.json"))); ui = JSON.parse(readFileSync(join(root, "ours/info.json"))); }
mkdirSync(join(root, "diff"), { recursive: true });

const { readdirSync } = await import("node:fs");
const rows = [];
for (const f of readdirSync(join(root, "orig")).filter((f) => f.endsWith(".png"))) {
  const o = join(root, "orig", f), u = join(root, "ours", f);
  if (!existsSync(u)) { rows.push({ file: f, note: "missing in ours" }); continue; }
  rows.push({ file: f, ...diffPair(o, u, join(root, "diff", f)) });
}
const summary = { page: pagePath, viewport: `${VW}x${VH}`, pageHeight: { orig: oi.height, ours: ui.height }, sections: { orig: oi.sections, ours: ui.sections }, diffs: rows };
writeFileSync(join(root, "report.json"), JSON.stringify(summary, null, 1));
console.log(`\n${pagePath} @ ${VW}x${VH}  page height: original ${oi.height} | ours ${ui.height}  (Δ ${ui.height - oi.height})`);
console.table(rows.map((r) => ({ file: r.file.slice(0, 34), "mismatch %": r.mismatch ?? "-", sizes: r.size ?? r.note })));
