#!/usr/bin/env node
// Print the SSR (pre-hydration) outerHTML of the first element with the given class from a saved page.
//   node scripts/qa/ssr-section.mjs reference/index.html tp-hero > hero.html
import { parseDocument } from "htmlparser2";
import { findOne } from "domutils";
import render from "dom-serializer";
import { readFileSync } from "node:fs";
const [file, cls] = process.argv.slice(2);
const doc = parseDocument(readFileSync(file, "utf8"));
const el = findOne((e) => e.type === "tag" && (e.attribs.class || "").split(/\s+/).includes(cls), doc.children, true);
if (!el) { console.error("not found: " + cls); process.exit(1); }
process.stdout.write(render(el, { decodeEntities: false }));
