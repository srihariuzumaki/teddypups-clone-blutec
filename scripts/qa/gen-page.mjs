#!/usr/bin/env node
// Convert the <main> content of a saved original page into a TSX component.
//   node scripts/qa/gen-page.mjs reference/pages/faq.html FaqMarkup src/pages/markup/FaqMarkup.tsx
import { parseDocument } from "htmlparser2";
import { findOne } from "domutils";
import render from "dom-serializer";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
const [file, name, out] = process.argv.slice(2);
const doc = parseDocument(readFileSync(file, "utf8"));
const main = findOne((e) => e.type === "tag" && e.attribs.id === "main", doc.children, true);
let html = render(main.children.filter((c) => !(c.type === "tag" && (c.name === "template" || c.name === "script"))), { decodeEntities: false });
html = html.replace(/<img\b[^>]*>/g, (tag) => tag.replace(/\ssrcset="[^"]*"/, "").replace(/\sdata-nimg="[^"]*"/, "").replace(/\sfetchpriority="[^"]*"/, "").replace(/background-image:url\(&quot;data:[^)]*\);?/g, "").replace(/background-size:cover;background-position:[^;"]*;background-repeat:no-repeat;?/g, ""));
html = html.replace(/\/_next\/image\?url=([^&"]+)[^"]*/g, (_, u) => decodeURIComponent(u));
const jsx = execFileSync("node", ["scripts/qa/html2jsx.mjs"], { input: html, maxBuffer: 1 << 28 }).toString().replace(/\n/g, "\n      ");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `/* Generated from the original SSR markup of ${file}; interactivity is layered on in the page component. */
export default function ${name}() {
  return (
    <>
      ${jsx}
    </>
  );
}
`);
console.log(out, jsx.length);
