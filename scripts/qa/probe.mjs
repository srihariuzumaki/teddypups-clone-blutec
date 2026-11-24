#!/usr/bin/env node
// Drive the ORIGINAL (or ours with --ours) page and print outerHTML (trimmed) before/after actions.
//   node scripts/qa/probe.mjs /faq "click:.tp-note button" "html:.tp-note"  [--ours] [--vw 1440]
import { chromium } from "playwright-core";
const a = process.argv.slice(2); const flags = a.filter((x) => x.startsWith("--")); const [path, ...steps] = a.filter((x, i) => !x.startsWith("--") && a[i - 1] !== "--vw");
const base = flags.includes("--ours") ? "http://127.0.0.1:5173" : "https://puppy.instabizweb.com";
const vi = a.indexOf("--vw"); const vw = vi >= 0 ? +a[vi + 1] : 1440;
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: vw, height: 900 } })).newPage();
await p.goto(base + path, { waitUntil: "networkidle" });
const trim = (h) => h.replace(/ d="[^"]{40}[^"]*"/g, ' d="…"').replace(/ style="[^"]{300,}"/g, ' style="…"').replace(/ (srcset|sizes)="[^"]*"/g, "").slice(0, 6000);
for (const s of steps) {
  const i = s.indexOf(":"), cmd = s.slice(0, i), arg = s.slice(i + 1);
  if (cmd === "click") await p.locator(arg).first().click();
  else if (cmd === "fill") { const [sel, v] = arg.split("=>"); await p.locator(sel).first().fill(v); }
  else if (cmd === "wait") await p.waitForTimeout(+arg);
  else if (cmd === "key") await p.keyboard.press(arg);
  else if (cmd === "html") console.log("--- " + arg + "\n" + trim(await p.locator(arg).first().evaluate((e) => e.outerHTML)));
  else if (cmd === "shot") await p.screenshot({ path: arg });
  else if (cmd === "count") console.log(arg, await p.locator(arg).count());
}
await b.close();
