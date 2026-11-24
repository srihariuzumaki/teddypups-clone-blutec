#!/usr/bin/env node
// Print every rule from the ORIGINAL compiled CSS whose selector matches a pattern, with its @media/@supports wrappers.
//   node scripts/qa/css-rules.mjs "tp-header" [--keyframes] [--raw]
import postcss from "postcss";
import { readFileSync, readdirSync } from "node:fs";
const pat = process.argv[2]; if (!pat) { console.error("usage: css-rules.mjs <substring|regex>"); process.exit(1); }
const re = new RegExp(pat);
const files = readdirSync("reference/css").filter((f) => f.endsWith(".css")).map((f) => `reference/css/${f}`);
const out = [];
const wrap = (node) => { const w = []; for (let p = node.parent; p && p.type !== "root"; p = p.parent) if (p.type === "atrule") w.unshift(`@${p.name} ${p.params}`); return w; };
for (const f of files) {
  postcss.parse(readFileSync(f, "utf8")).walk((n) => {
    if (n.type === "rule" && re.test(n.selector)) out.push({ w: wrap(n), s: n.selector, d: n.nodes.map((d) => `${d.prop}:${d.value}`).join(";") });
    if (n.type === "atrule" && n.name === "keyframes" && re.test(n.params)) out.push({ w: [], s: `@keyframes ${n.params}`, d: n.nodes.map((k) => `${k.selector}{${k.nodes.map((d) => `${d.prop}:${d.value}`).join(";")}}`).join(" ") });
  });
}
let last = "";
for (const r of out) { const key = r.w.join(" > "); if (key !== last) { console.log(key ? `\n/* ${key} */` : "\n/* base */"); last = key; } console.log(`${r.s} { ${r.d} }`); }
console.error(`\n${out.length} rules`);
