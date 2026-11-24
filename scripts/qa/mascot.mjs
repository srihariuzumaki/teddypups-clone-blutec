// Scroll a page with motion enabled and screenshot the walking mascot at several offsets.
// usage: node scripts/qa/mascot.mjs /path [--orig] [--vw 1440 --vh 900] [--n 8] [--out dir]
import { chromium } from "playwright-core";
import fs from "node:fs";
const a = process.argv.slice(2);
const arg = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
const path = a[0] ?? "/";
const orig = a.includes("--orig");
const vw = +arg("--vw", 1440), vh = +arg("--vh", 900), n = +arg("--n", 8);
const out = arg("--out", "qa-out/mascot");
fs.mkdirSync(out, { recursive: true });
const base = orig ? "https://puppy.instabizweb.com" : "http://127.0.0.1:5173";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
await page.goto(base + path, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
console.log("scrollable", total, "data-pup:", await page.evaluate(() => document.documentElement.dataset.pup));
const tag = orig ? "o" : "u";
for (let i = 0; i <= n; i++) {
  const y = Math.round((total * i) / n);
  await page.mouse.wheel(0, 0);
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
  await page.waitForTimeout(1600);
  const info = await page.evaluate(() => {
    const l = document.querySelector(".pup-layer");
    const r = l && !l.hidden ? document.querySelector(".pup-actor")?.getBoundingClientRect() : null;
    return { hidden: l?.hidden, holding: document.querySelector(".pup-actor")?.dataset.holding, front: l?.dataset.front, at: r && [Math.round(r.left), Math.round(r.top), Math.round(r.width)] };
  });
  console.log(i, y, JSON.stringify(info));
  await page.screenshot({ path: `${out}/${tag}-${path.replace(/\W+/g, "_")}-${String(i).padStart(2, "0")}.png` });
}
console.log("errors:", errors.length ? errors.slice(0, 6) : "none");
await browser.close();
