#!/usr/bin/env node
// Convert an HTML fragment (stdin or file) to JSX text. Handles class, style, SVG attrs, void/empty elements.
//   node scripts/qa/dom.mjs / ".tp-hero" | node scripts/qa/html2jsx.mjs > out.jsx
import { parseDocument } from "htmlparser2";
import { readFileSync } from "node:fs";
const src = process.argv[2] && !process.argv[2].startsWith("-") ? readFileSync(process.argv[2], "utf8") : readFileSync(0, "utf8");
const SVG = new Set(["svg","g","path","circle","ellipse","rect","line","polyline","polygon","defs","pattern","clipPath","mask","linearGradient","radialGradient","stop","use","filter","feGaussianBlur","feOffset","feMerge","feMergeNode","text","tspan","symbol","image","title","desc","feColorMatrix","feDropShadow"]);
const VOID = new Set(["img","br","input","hr","meta","link","source","track","wbr"]);
const NUM = new Set(["rows","cols","maxlength","minlength","tabindex","colspan","rowspan","size"]);
const ATTR = { novalidate: "noValidate", inputmode: "inputMode", minlength: "minLength", rowspan: "rowSpan", class: "className", for: "htmlFor", tabindex: "tabIndex", viewbox: "viewBox", preserveaspectratio: "preserveAspectRatio", srcset: "srcSet", crossorigin: "crossOrigin", autocomplete: "autoComplete", maxlength: "maxLength", readonly: "readOnly", colspan: "colSpan", playsinline: "playsInline", "accept-charset": "acceptCharset" };
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const BOOL = new Set(["hidden","disabled","checked","required","readonly","autofocus","multiple","open","controls","muted","loop","playsinline","selected","novalidate","inert"]);
function styleObj(s) {
  const parts = s.split(";").map((x) => x.trim()).filter(Boolean).map((d) => { const i = d.indexOf(":"); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });
  return "{{ " + parts.map(([k, v]) => `${k.startsWith("--") ? JSON.stringify(k) : camel(k)}: ${/^-?[\d.]+$/.test(v) && !k.startsWith("--") && !/(opacity|z-index|flex|line-height|scale|order)/.test(k) ? JSON.stringify(v) : JSON.stringify(v)}`).join(", ") + " }}";
}
function attrs(el) {
  return Object.entries(el.attribs || {}).map(([k, v]) => {
    if (k === "style") return `style=${styleObj(v)}`;
    if (k.startsWith("on")) return "";
    let name = ATTR[k] ?? (k.startsWith("data-") || k.startsWith("aria-") ? k : SVG.has(el.name) || /^(stroke|fill|clip|font|text|stop|flood|marker|shape|vector|color|dominant|baseline|letter|word|writing|paint|pointer|rendering|glyph|unicode|enable)-/.test(k) || ["xlink:href", "xml:space", "gradientunits", "patternunits", "gradienttransform", "patterntransform", "clippathunits"].includes(k) ? camel(k).replace("gradientunits", "gradientUnits").replace("patternunits", "patternUnits").replace("gradienttransform", "gradientTransform").replace("patterntransform", "patternTransform") : k);
    if (name === "xlink:href") name = "xlinkHref";
    if (BOOL.has(k) && (v === "" || v === k)) return name;
    if (NUM.has(k) && /^-?\d+$/.test(v)) return `${name}={${v}}`;
    if (k === "value" && (el.name === "input" || el.name === "textarea")) return `defaultValue=${JSON.stringify(v)}`;
    if (k === "inert") return "inert={true as never}";
    if (v === "") return `${name}=""`;
    return `${name}=${/[{}"]/.test(v) ? `{${JSON.stringify(v)}}` : `"${v}"`}`;
  }).filter(Boolean).join(" ");
}
function kidsOut(n, ind) {
  // merge adjacent text nodes (comments between them are dropped), keep meaningful edge whitespace
  const ch = []; for (const c of n.children) { if (c.type === "comment") continue; if (c.type === "text" && ch.length && ch[ch.length - 1].type === "text") ch[ch.length - 1] = { type: "text", data: ch[ch.length - 1].data + c.data }; else ch.push(c); }
  return ch.map((c, i) => {
    if (c.type === "text") {
      const t = c.data.replace(/\s+/g, " "); if (!t.trim()) return (i > 0 && i < ch.length - 1 && ch[i - 1].type === "tag" && ch[i + 1].type === "tag" && t.includes(" ") && !/\n/.test(c.data)) ? `${ind}{" "}\n` : "";
      let body = t.trim().replace(/[{}<>]/g, (x) => `{'${x}'}`);
      if (/^\s/.test(t) && i > 0) body = `{" "}${body}`;
      if (/\s$/.test(t) && i < ch.length - 1) body = `${body}{" "}`;
      return ind + body + "\n";
    }
    return out(c, ind);
  }).join("");
}
function out(n, ind = "") {
  if (n.type !== "tag") return "";
  const a = attrs(n); const open = `<${n.name}${a ? " " + a : ""}`;
  const kids = kidsOut(n, ind + "  ");
  if (!kids.trim() || VOID.has(n.name)) return `${ind}${open} />\n`;
  return `${ind}${open}>\n${kids}${ind}</${n.name}>\n`;
}
const doc = parseDocument(src, { lowerCaseAttributeNames: false, lowerCaseTags: false, recognizeSelfClosing: true });
process.stdout.write(kidsOut(doc, ""));
