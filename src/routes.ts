import { lazy } from "react";

// Home loads with the shell; every other route is its own chunk, fetched when the browser is idle (or on hover/focus
// of a link, see Layout) so the loading curtain never waits for it.
const loaders = {
  puppies: () => import("./pages/Puppies"),
  puppy: () => import("./pages/PuppyDetail"),
  gone: () => import("./pages/GoneHome"),
  families: () => import("./pages/HappyFamilies"),
  how: () => import("./pages/HowItWorks"),
  faq: () => import("./pages/Faq"),
  contact: () => import("./pages/Contact"),
  notFound: () => import("./pages/NotFound"),
};
export const Puppies = lazy(loaders.puppies);
export const PuppyDetail = lazy(loaders.puppy);
export const GoneHome = lazy(loaders.gone);
export const HappyFamilies = lazy(loaders.families);
export const HowItWorks = lazy(loaders.how);
export const Faq = lazy(loaders.faq);
export const Contact = lazy(loaders.contact);
export const NotFound = lazy(loaders.notFound);

/** Warm the route chunks once the first screen is done. */
export function prefetchRoutes() {
  Object.values(loaders).forEach((load) => load().catch(() => {}));
}

