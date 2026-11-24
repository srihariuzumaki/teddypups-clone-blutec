import variants from "../data/media-variants.json";

/**
 * Responsive images for the ported markup. The pages reference full-size originals (`/media/...`, some are 3000+ px);
 * `scripts/make-variants.mjs` writes resized WebP copies at build time, and this adds a `srcset` to every such <img>
 * so the browser downloads the one that fits. The original stays in `src` (the photo viewer reads it).
 * Only active in production builds, where the variants exist. Watches the DOM so lazily loaded routes, the hero lineup's
 * swapped photos and anything React renders later are covered too.
 */
const MAP = variants as Record<string, number[]>;

function apply(img: HTMLImageElement) {
  const src = img.getAttribute("src") || "";
  const widths = MAP[src];
  if (!widths) { if (img.hasAttribute("srcset") && img.dataset.opt) { img.removeAttribute("srcset"); delete img.dataset.opt; } return; }
  if (img.dataset.opt === src) return;
  const base = src.replace(/^\/media\//, "").replace(/\.[^.]+$/, "");
  img.srcset = widths.map((w) => `/media-opt/${base}-${w}.webp ${w}w`).join(", ");
  if (!img.getAttribute("sizes")) {
    // no hint from the markup: use the rendered width (or the viewport if it is not laid out yet)
    const w = Math.round(img.getBoundingClientRect().width);
    img.sizes = w > 40 ? `${w}px` : "100vw";
  }
  img.dataset.opt = src;
}

const scan = (n: Node) => {
  if (n.nodeType !== 1) return;
  const el = n as Element;
  if (el.tagName === "IMG") apply(el as HTMLImageElement);
  el.querySelectorAll?.("img[src^='/media/']").forEach((i) => apply(i as HTMLImageElement));
};

export function optimizeImages() {
  if (!import.meta.env.PROD) return;
  scan(document.body);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "attributes") apply(m.target as HTMLImageElement);
      else m.addedNodes.forEach(scan);
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
}
