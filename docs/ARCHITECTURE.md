# ARCHITECTURE — proposed project structure

```
teddypups/                      (the repo we submit; this planning folder can live in /docs)
├─ public/
│  ├─ brand/logo.png            ← scripts/download-assets.sh
│  ├─ media/**                  ← original photos/videos (same paths as reference)
│  ├─ icon.png  apple-icon.png  robots.txt  sitemap.xml
│  └─ _redirects | vercel.json  (SPA fallback)
├─ src/
│  ├─ main.tsx                  router + providers + global CSS
│  ├─ styles/ tokens.css (docs/tokens.css) · base.css · scenes.css · animations.css
│  ├─ data/ puppies.ts (from docs/../data/puppies.json) · faq.ts · families.ts · site.ts (phone, wa link, nav)
│  ├─ lib/ whatsapp.ts · useReveal.ts · useHeaderState.ts · useLenis.ts · usePinProgress.ts · seo.ts
│  ├─ components/
│  │  ├─ layout/ Header · MobileMenu · Footer · WhatsAppBar · SkipLink · Layout
│  │  ├─ ui/ Button · Reveal · Chip · SketchCard · Ticket · Note · Lightbox · Stamp
│  │  ├─ mascot/ Teddy.tsx (SVG) · poses.ts · MascotLayer.tsx (stretch)
│  │  ├─ forms/ EnquiryForm · LetterForm
│  │  └─ illustrations/ Quilt · Door · Flight · Book · House · Basket · Cork
│  ├─ pages/
│  │  ├─ Home/ (Hero · Meet · Paths · Chat · Passport · Dusk · Night · HomeCta)
│  │  ├─ Puppies · PuppyDetail · GoneHome · HappyFamilies · HowItWorks · Faq · Contact · NotFound
│  └─ App.tsx (routes)
├─ docs/ …                      this planning pack
├─ PROMPTS.md                   AI prompt log (required for the Loom)
└─ README.md
```

## Key choices
- **Vite + React 18 + TS + React Router v6** (`createBrowserRouter`). Scroll restoration + `#hash` support (`/how-it-works#delivery`). Query params for filters via `useSearchParams`.
- **Styling:** CSS variables from tokens.css + CSS Modules or one global stylesheet per area. Tailwind v4 is optional (the original uses it, utilities like `fixed inset-x-0 top-0 z-50`), but the scene art needs custom CSS either way — pick Tailwind only if you're faster with it.
- **Fonts:** `@fontsource-variable/fraunces`, `figtree`, `shantell-sans` (self-hosted; matches the original CSP).
- **Animation:** Lenis + IntersectionObserver + CSS (ANIMATIONS.md). Optional `motion` lib for the lightbox/menu.
- **Data:** static TS modules from `data/*.json`. `Puppy = { slug, name?, breed, sex: 'boy'|'girl'|'boy & girl', age, origin: 'local'|'imported', status: 'available'|'gone', image, gallery[], video?, homeType?: 'TeddyPups home'|'Dubai showroom home', altText }`.
- **Forms:** no backend in the original we can reuse → submit to **Formspree / Web3Forms** (free, static-friendly) or a Vercel serverless function; fall back to opening `wa.me` with prefilled text. Honeypot field `website`. Validation with plain JS (or `react-hook-form` + `zod` if you want to talk about it in the Loom).
- **SEO:** `react-helmet-async` or document.title effects per route; static `index.html` meta/OG; sitemap generated from data.
- **Images:** `<img loading="lazy" decoding="async" width height srcSet>`; optionally pre-generate 640/1080/1920 widths with `sharp` in a script. Keep AVIF/WebP originals.
- **Deploy:** Vercel (`vercel.json` rewrites `/(.*) → /index.html`), preview on every push.
- **Testing:** Playwright smoke (all routes 200, no console errors, form validation), manual side-by-side at 375/768/1440, Lighthouse.

## Routing table
```
/                 Home
/puppies          Puppies          ?breed=&origin=
/puppies/:slug    PuppyDetail
/gone-home        GoneHome
/happy-families   HappyFamilies
/how-it-works     HowItWorks       #delivery
/faq              Faq
/contact          Contact
*                 NotFound
```
