#!/usr/bin/env node
// Reads the reference's compiled CSS and emits readable, per-layer source files into src/styles/original/.
//   theme.css       -> @theme tokens (custom colors, fonts, easing)
//   base.css        -> custom base rules (:root, html, body, focus…)
//   components.css  -> all tp-*/pup-*/btn* component rules + keyframes, original order, grouped with headings
import postcss from "postcss";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
mkdirSync("src/styles/original", { recursive: true });
const file = readdirSync("reference/css").map((f) => `reference/css/${f}`).sort((a, b) => readFileSync(b).length - readFileSync(a).length)[0];
const root = postcss.parse(readFileSync(file, "utf8"));
const layers = {}; root.walkAtRules("layer", (l) => { if (l.nodes && !l.parent.parent?.type?.includes("atrule")) layers[l.params] = l; });

// --- theme: keep only custom tokens (colors/fonts/easings/radius), Tailwind supplies the rest
const keep = /^--(color-(toffee|honey|cocoa|milk|sky|blush)|font-(display|hand)|ease-(pounce|silk|snap))/;
const theme = [];
layers.theme.walkDecls((d) => { if (keep.test(d.prop) && !theme.some((t) => t.startsWith(d.prop + ":"))) theme.push(`${d.prop}: ${d.value};`); });
writeFileSync("src/styles/original/theme.css", `/* Custom tokens extracted from the reference (Tailwind v4 @theme). */\n@theme {\n  ${theme.join("\n  ")}\n  --font-sans: var(--font-figtree), ui-sans-serif, system-ui, sans-serif;\n}\n`);

// --- helpers to pretty print
const fmt = (n, ind = "") => {
  if (n.type === "rule") return `${ind}${n.selector.replace(/\s*,\s*/g, ",\n" + ind)} {\n${n.nodes.map((d) => d.type === "decl" ? `${ind}  ${d.prop}: ${d.value}${d.important ? " !important" : ""};` : fmt(d, ind + "  ")).join("\n")}\n${ind}}`;
  if (n.type === "atrule") return n.nodes ? `${ind}@${n.name} ${n.params} {\n${n.nodes.map((c) => fmt(c, ind + "  ")).join("\n")}\n${ind}}` : `${ind}@${n.name} ${n.params};`;
  return "";
};
// --- base: drop preflight (Tailwind provides it), keep custom bits (starting at :root{--lightningcss…)
const baseNodes = layers.base.nodes; const idx = baseNodes.findIndex((n) => n.type === "rule" && n.selector === ":root" && n.toString().includes("--gutter"));
writeFileSync("src/styles/original/base.css", `/* Custom base rules extracted from the reference (after Tailwind preflight). */\n@layer base {\n${baseNodes.slice(idx).map((n) => fmt(n, "  ")).join("\n\n")}\n}\n`);

// --- components: group consecutive rules by their block (tp-<block>__…)
const blockOf = (sel) => (sel.match(/\.(tp|pup)-([a-z0-9]+)/) || [, , "misc"])[1] ? ((sel.match(/\.(?:tp|pup)-([a-z0-9]+)/) || [, "misc"])[1]) : "misc";
let out = "/* Component CSS extracted from the reference's @layer components, original cascade order, grouped by block. */\n@layer components {\n", last = "";
for (const n of layers.components.nodes) {
  const sel = n.type === "rule" ? n.selector : n.type === "atrule" ? (n.name === "keyframes" ? "kf" : n.toString()) : "";
  const k = n.type === "rule" ? blockOf(n.selector) : n.name === "keyframes" ? "keyframes" : n.name === "media" ? ((n.toString().match(/\.(?:tp|pup)-([a-z0-9]+)/) || [, "responsive"])[1]) : "misc";
  if (k !== last) { out += `\n  /* ───── ${k} ───── */\n`; last = k; }
  out += fmt(n, "  ") + "\n";
}
writeFileSync("src/styles/original/components.css", out + "}\n");
// --- unlayered rules (the bulk: tp-*, pup-*, keyframes). Must stay UNLAYERED so they win over Tailwind utilities like in the reference.
let tp = "/* Unlayered component CSS extracted from the reference: tp-* / pup-* blocks, responsive rules and keyframes (original order). */\n", lastK = "";
for (const n of root.nodes) {
  if (n.type === "comment" || (n.type === "atrule" && (n.name === "layer" || n.name === "property" || n.name === "charset"))) continue;
  const m = n.toString().match(/\.(?:tp|pup)-([a-z0-9]+)/);
  const k = n.type === "atrule" && n.name === "keyframes" ? "keyframes" : m ? m[1] : "misc";
  if (k !== lastK) { tp += `\n/* ───── ${k} ───── */\n`; lastK = k; }
  tp += fmt(n, "") + "\n";
}
writeFileSync("src/styles/original/tp.css", tp);
console.log("theme tokens:", theme.length, "| base nodes:", baseNodes.length - idx, "| component nodes:", layers.components.nodes.length);
