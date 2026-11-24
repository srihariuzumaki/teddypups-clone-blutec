import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NAV, PHONE_DISPLAY, WA_LINK } from "../../data/site";
import { useHeaderState } from "../../lib/useHeaderState";
import Paw from "./Paw";
import { getLang, setLang } from "../../i18n";

function LangToggle({ className = "" }: { className?: string }) {
  const ar = getLang() === "ar";
  return (
    <button
      type="button"
      lang={ar ? "en" : "ar"}
      className={`tp-lang ${className}`.trim()}
      aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
      onClick={() => setLang(ar ? "en" : "ar")}
    >
      {ar ? "EN" : "عربي"}
    </button>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const { scrolled, hidden } = useHeaderState(open);

  const isActive = (to: string) => (to === "/" ? isHome : pathname === to || pathname.startsWith(to + "/"));

  const openMenu = () => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    d.removeAttribute("data-closing");
    d.showModal();
    setOpen(true);
    window.__lenis?.stop();
  };
  const closeMenu = () => {
    const d = dialogRef.current;
    if (!d || !d.open || d.hasAttribute("data-closing")) return;
    d.setAttribute("data-closing", "");
    const done = () => {
      d.removeAttribute("data-closing");
      d.close();
    };
    const ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420;
    window.setTimeout(done, ms);
  };

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => { setOpen(false); window.__lenis?.start(); };
    const onCancel = (e: Event) => { e.preventDefault(); closeMenu(); };
    d.addEventListener("close", onClose);
    d.addEventListener("cancel", onCancel);
    return () => { d.removeEventListener("close", onClose); d.removeEventListener("cancel", onCancel); };
  }, []);

  useEffect(() => { if (dialogRef.current?.open) closeMenu(); }, [pathname]);

  return (
    <header
      id="site-header"
      data-scrolled={scrolled}
      data-hidden={hidden}
      data-home={isHome}
      className="tp-header fixed inset-x-0 top-0 z-50"
    >
      <div className="tp-header__bar gutter">
        <Link className="tp-header__brand" aria-label="TeddyPups U.A.E. — home" to="/">
          <img alt="" width={56} height={56} decoding="async" className="tp-header__logo" src="/brand/logo.png" />
          <span className="font-plush tp-header__name">TeddyPups</span>
        </Link>
        <nav aria-label="Main" className="tp-header__nav">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className="tp-nav-link"
                  data-active={isActive(n.to)}
                  aria-current={isActive(n.to) ? "page" : undefined}
                >
                  <span>{n.label}</span>
                  <Paw />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="tp-header__end">
          <LangToggle />
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp tp-header__wa">
            WhatsApp us
          </a>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-cocoa bg-milk px-4 text-[0.95rem] font-semibold lg:hidden"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={openMenu}
          >
            <Paw className="size-4" />
            Menu
          </button>
          <dialog
            ref={dialogRef}
            aria-label="Site menu"
            className="tp-menu m-0 h-dvh max-h-none w-screen max-w-none bg-honey p-0 text-cocoa backdrop:bg-cocoa/40"
          >
            <div className="flex h-full flex-col gutter pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
              <div className="flex items-center justify-between">
                <span className="font-scrawl text-lg">where to, friend?</span>
                <button type="button" className="h-11 rounded-full bg-cocoa px-5 font-semibold text-milk" onClick={closeMenu}>
                  Close
                </button>
              </div>
              <nav aria-label="Mobile" className="mt-10 flex-1">
                <ul className="space-y-1">
                  {NAV.map((n) => (
                    <li key={n.to}>
                      <Link
                        to={n.to}
                        data-active={isActive(n.to)}
                        aria-current={isActive(n.to) ? "page" : undefined}
                        className="tp-menu-link font-plush block py-2 text-[clamp(2.4rem,11vw,3.4rem)]"
                      >
                        <span>{n.label}</span>
                        <Paw />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="space-y-3">
                <a href={WA_LINK} className="btn btn-whatsapp w-full" target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>
                <p className="text-center text-sm font-medium">{PHONE_DISPLAY}</p>
                <LangToggle className="tp-lang--menu" />
              </div>
            </div>
          </dialog>
        </div>
      </div>
      <svg aria-hidden="true" className="tp-header__hem" width="100%" height="14" preserveAspectRatio="none">
        <defs>
          <pattern id="tp-hem" width="44" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 0H44V2A22 11 0 0 1 0 2Z" className="tp-header__hem-fill" />
            <path d="M0 2A22 11 0 0 0 44 2" className="tp-header__hem-line" />
          </pattern>
        </defs>
        <rect width="100%" height="14" fill="url(#tp-hem)" />
      </svg>
    </header>
  );
}
