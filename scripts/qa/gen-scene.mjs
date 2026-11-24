#!/usr/bin/env node
// Generate a React component (TSX) from a section of the original SSR HTML.
//   node scripts/qa/gen-scene.mjs <class> <ComponentName> [outFile]   (source: reference/index.html)
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
const [cls, name, out = `src/pages/home/scenes/${name}.tsx`, src = "reference/index.html"] = process.argv.slice(2);
let html = execFileSync("node", ["scripts/qa/ssr-section.mjs", src, cls], { maxBuffer: 1 << 28 }).toString();

// next/image -> plain <img>: use the original /media path, drop srcset/blur placeholders.
html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const m = tag.match(/\ssrc="\/_next\/image\?url=([^&"]+)[^"]*"/);
  if (!m) return tag;
  const real = decodeURIComponent(m[1]);
  return tag
    .replace(/\ssrcset="[^"]*"/, "")
    .replace(/\ssrc="[^"]*"/, ` src="${real}"`)
    .replace(/\sdata-nimg="[^"]*"/, "")
    .replace(/background-image:url\(&quot;data:[^)]*\);?/g, "")
    .replace(/background-size:cover;background-position:[^;"]*;background-repeat:no-repeat;?/g, "");
});
html = html.replace(/\/_next\/image\?url=([^&"]+)[^"]*/g, (_, u) => decodeURIComponent(u));
const jsx = execFileSync("node", ["scripts/qa/html2jsx.mjs"], { input: html, maxBuffer: 1 << 28 }).toString().replace(/\n/g, "\n    ");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `/* Generated from the original SSR markup (.${cls}); behaviours are layered on in the page component. */
export default function ${name}() {
  return (
    ${jsx}
  );
}
`);
console.log(out, jsx.length);
