import { tr } from "./index";

const ATTRS = ["aria-label", "alt", "placeholder", "title"];

const PHONE = /^\s*\+\d[\d\s]{6,}\s*$/;

function text(n: Text) {
  const v = n.nodeValue;
  // phone numbers must keep their left-to-right order inside Arabic text
  if (v && PHONE.test(v)) { n.nodeValue = "\u2066" + v.trim() + "\u2069"; return; }
  if (!v || !/[A-Za-z]/.test(v)) return;
  const p = n.parentElement?.tagName;
  if (p === "SCRIPT" || p === "STYLE") return;
  const t = tr(v);
  if (t !== v) n.nodeValue = t;
}
function attrs(e: Element) {
  for (const a of ATTRS) { const v = e.getAttribute(a); if (v && /[A-Za-z]/.test(v)) { const t = tr(v); if (t !== v) e.setAttribute(a, t); } }
}
function walk(root: Node) {
  if (root.nodeType === 3) return text(root as Text);
  if (root.nodeType !== 1) return;
  const el = root as Element;
  attrs(el);
  el.querySelectorAll("[aria-label],[alt],[placeholder],[title]").forEach(attrs);
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) text(n as Text);
}
export function translateTitle() {
  const t = tr(document.title); if (t !== document.title) document.title = t;
  const m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (m) { const d = tr(m.content); if (d !== m.content) m.content = d; }
}

/** Translate everything now and keep translating whatever React renders or updates afterwards. */
export function startTranslator() {
  let queue = new Set<Node>(), raf = 0;
  const flush = () => { raf = 0; const q = queue; queue = new Set(); q.forEach((n) => n.isConnected && walk(n)); translateTitle(); };
  const push = (n: Node) => { queue.add(n); if (!raf) raf = requestAnimationFrame(flush); };
  walk(document.body); translateTitle();
  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") push(m.target);
      else if (m.type === "attributes") push(m.target);
      else m.addedNodes.forEach(push);
    }
    if (document.title && /[A-Za-z]/.test(document.title)) push(document.head);
  });
  mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  mo.observe(document.querySelector("title")!, { childList: true });
  return () => mo.disconnect();
}
