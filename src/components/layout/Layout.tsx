import { Suspense, useEffect, useRef } from "react";
import { useRevealScope } from "../../lib/useRevealScope";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppBar from "./WhatsAppBar";
import PawPrints from "./PawPrints";
import PupJourney from "./PupJourney";
import { attachBuddies } from "../../lib/mascot/buddies";
import { attachFlights } from "../../lib/flights";
import RouteCurtain from "./RouteCurtain";
import SmoothScroll from "../../lib/SmoothScroll";
import { prefetchRoutes } from "../../routes";

/** Scroll to top on route change, or to the #hash target. */
function useScrollRestoration() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const go = (y: number | HTMLElement) => {
      const lenis = window.__lenis;
      if (lenis) lenis.scrollTo(y as never, { immediate: true, offset: typeof y === "number" ? 0 : -80 });
      else if (typeof y === "number") window.scrollTo(0, y);
      else y.scrollIntoView();
    };
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void requestAnimationFrame(() => go(el));
    }
    go(0);
  }, [pathname, hash]);
}

/** Footer/markup ported verbatim uses plain <a href="/…">; route those client-side. */
function useInternalLinks() {
  const navigate = useNavigate();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);
}

export default function Layout() {
  useScrollRestoration();
  useInternalLinks();
  const mainRef = useRef<HTMLElement>(null);
  useRevealScope(mainRef);
  const { pathname } = useLocation();
  // Bring every Teddy on the page to life (blink, wag, tricks on click); the walking mascot takes over the stops.
  useEffect(() => attachBuddies(document), [pathname]);
  useEffect(() => attachFlights(document), [pathname]);
  // Fetch the other routes' chunks once the first screen is done (or as soon as the pointer/focus heads for a link).
  useEffect(() => {
    const idle = (window as any).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1200));
    const t = idle(prefetchRoutes, { timeout: 4000 });
    const eager = () => { prefetchRoutes(); removeEventListener("pointerover", eager); removeEventListener("focusin", eager); };
    addEventListener("pointerover", eager, { once: true });
    addEventListener("focusin", eager, { once: true });
    return () => { (window as any).cancelIdleCallback?.(t); removeEventListener("pointerover", eager); removeEventListener("focusin", eager); };
  }, []);
  return (
    <div className="relative">
      <RouteCurtain />
      <SmoothScroll />
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full">Skip to content</a>
      <Header />
      <main ref={mainRef} id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
        <PupJourney routeKey={pathname} />
      </main>
      <PawPrints />
      <Footer />
      <WhatsAppBar />
    </div>
  );
}
