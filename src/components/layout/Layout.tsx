import { useEffect, useRef } from "react";
import { useRevealScope } from "../../lib/useRevealScope";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppBar from "./WhatsAppBar";
import PawPrints from "./PawPrints";
import SmoothScroll from "../../lib/SmoothScroll";

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
  return (
    <div className="relative">
      <SmoothScroll />
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full">Skip to content</a>
      <Header />
      <main ref={mainRef} id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
        <Outlet />
      </main>
      <PawPrints />
      <Footer />
      <WhatsAppBar />
    </div>
  );
}
