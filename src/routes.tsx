import type { ComponentType } from "react";

/**
 * Every page except Home is its own chunk. Unlike React.lazy, a page whose chunk has already been loaded renders
 * synchronously, so landing directly on /faq (we preload that chunk before the first render, see main.tsx) never paints an
 * empty <main> with the footer in the wrong place (that scored 0.97 layout shift in Lighthouse).
 */
function page<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let Comp: ComponentType<P> | undefined;
  let pending: Promise<void> | undefined;
  const fetchChunk = () => (pending ??= load().then((m) => { Comp = m.default; }));
  const Page = (props: P) => {
    if (!Comp) throw fetchChunk(); // suspends only if the chunk is not here yet
    return <Comp {...props} />;
  };
  return Object.assign(Page, { load: fetchChunk });
}

export const Puppies = page(() => import("./pages/Puppies"));
export const PuppyDetail = page(() => import("./pages/PuppyDetail"));
export const GoneHome = page(() => import("./pages/GoneHome"));
export const HappyFamilies = page(() => import("./pages/HappyFamilies"));
export const HowItWorks = page(() => import("./pages/HowItWorks"));
export const Faq = page(() => import("./pages/Faq"));
export const Contact = page(() => import("./pages/Contact"));
export const NotFound = page(() => import("./pages/NotFound"));

const all = [Puppies, PuppyDetail, GoneHome, HappyFamilies, HowItWorks, Faq, Contact, NotFound];

/** Warm the route chunks once the first screen is done (idle, or the first pointer/focus move toward a link). */
export function prefetchRoutes() {
  all.forEach((p) => p.load().catch(() => {}));
}

/** Load the chunk for the page the visitor landed on before the first render. */
export function preloadFor(pathname: string): Promise<unknown> {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return Promise.resolve();
  const exact: Record<string, { load: () => Promise<void> }> = {
    "/puppies": Puppies, "/gone-home": GoneHome, "/happy-families": HappyFamilies,
    "/how-it-works": HowItWorks, "/faq": Faq, "/contact": Contact,
  };
  const target = exact[p] ?? (/^\/puppies\/[^/]+$/.test(p) ? PuppyDetail : NotFound);
  return target.load().catch(() => {});
}
