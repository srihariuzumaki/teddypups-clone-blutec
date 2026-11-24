# IMPLEMENTATION.md — how it was built, the ideas, the problems and the fixes

Stack: React 18 + Vite + TypeScript, Tailwind v4, React Router 6, Lenis (smooth scroll).
Reference: https://puppy.instabizweb.com/ (a Next.js app).

## 1. The core idea: reuse the reference's markup + CSS, re-wire the behaviour

My first version re-drew every section with my own CSS. It looked similar but the spacing, type and micro-interactions
were off, so the goal became a 1:1 replica. The approach:

1. **CSS**: the reference ships one compiled stylesheet. `scripts/qa/split-css.mjs` splits it into
   `src/styles/original/` — Tailwind v4 theme tokens, base rules, components, and ~4,900 lines of `tp-*` / `pup-*`
   rules and keyframes (kept in the original order and *unlayered*, so they win over Tailwind exactly as before).
2. **Markup**: for static pages the server-rendered HTML is converted to JSX
   (`ssr-section.mjs` → `html2jsx.mjs` → `gen-scene.mjs` / `gen-page.mjs`), swapping Next's `/_next/image` URLs for the
   plain `/media/...` files.
3. **Behaviour**: anything the original did with JavaScript (reveal, pinning, tabs, filters, dialogs, forms) is
   re-implemented by hand in small hooks/components. I read the reference's un-minified JS (Prettier) to copy the
   *logic* and thresholds, then wrote my own code.
4. **Dynamic pages** (puppy detail) are data-driven React components, because the saved HTML for those is a
   streaming template. I dumped the hydrated DOM of several puppies, diffed them to find what varies, and scraped
   the missing per-puppy facts from all 42 live pages.

### Measuring fidelity instead of guessing
`scripts/qa/qa.mjs <path> [--vw 1440]` opens the original and our dev server in headless Chromium, screenshots the
same elements, and pixel-diffs them (pixelmatch). Reduced-motion is on by default so animations don't add noise;
`--motion` turns them on. Other helpers: `css-rules.mjs` (print the original rules for a selector),
`dom.mjs` (hydrated DOM of any element), `probe.mjs` (click/type on the original and print the DOM after).

## 2. Scroll behaviours

### Reveal on scroll (`src/lib/useRevealScope.ts`)
Elements with `data-reveal` are hidden by the CSS only while `data-armed` is set and `data-revealed` is not.
- On mount, elements already in the viewport get `data-revealed` immediately (no flash).
- The rest get `data-armed` and are watched by an IntersectionObserver (`rootMargin: 0 0 -6% 0`, threshold 0.08);
  when seen they get `data-revealed` and are unobserved.
- A MutationObserver re-scans when React renders new elements; reduced-motion reveals everything at once.

### Pinned horizontal "Meet the pups" (`src/lib/useMeetPin.ts`)
The idea: on desktop the section is a tall runway; inside it a sticky 100vh stage stays on screen while the page
scrolls, and the row of doors slides sideways by the same amount.
- Runway height = `100vh + 0.8 × (track width − viewport width)`, so the amount of scrolling needed matches how far
  the doors have to travel.
- Progress = how far the runway has been scrolled (0 → 1). The track is moved with
  `translate3d(-overflow × progress)`.
- The original uses framer-motion's `useScroll` + a spring; I use a `requestAnimationFrame` loop that eases toward the
  target (`current += (target − current) × 0.16`) which gives the same smooth lag without the library.
- The floor texture scrolls with the doors (`--floor-x`), and each door gets `data-open` once it passes 36 % of the
  viewport width, which plays the "door swings open" CSS.
- Door width is computed from the available stage height so doors never get clipped.
- Below 1024 px, or with reduced motion, there is no pinning: the same markup is a normal grid and doors are open.

### Chat scene (`src/lib/useChatSteps.ts`)
An IntersectionObserver with `rootMargin: -28% 0 -62% 0` makes a thin "reading band". The step that enters it becomes
active, the phone header shows "typing…" for 750 ms, then that step's message group is revealed. Mobile/reduced
motion shows all steps.

### Smooth scroll
Lenis drives the smooth scroll; it is paused while a modal `<dialog>` (menu, photo viewer) is open and resumed on close.

## 3. Interactions

| Piece | How |
|---|---|
| Mobile menu | A real `<dialog>` with `showModal()`; closing sets `data-closing` so the reverse clip-path animation (420 ms) plays before `close()`. |
| `/puppies` filters | Chips write `?origin=&breed=&sex=` to the URL; an effect hides non-matching cards and updates the live count. |
| `/how-it-works` tabs | `role="tablist"`; selecting sets `aria-selected`, moves the thumb through `--at`, toggles panel `hidden`; arrow keys / Home / End supported. |
| `/faq` | One note open at a time (`data-unfolded`, `inert` on closed answers); search filters live with "N notes found" and an empty-state note. |
| Photo viewer | Native `<dialog>`, arrows / Escape / swipe, neighbours preloaded. |
| Contact letter | Validate → "Sealing the envelope…" → envelope/mailbox scene → "Message received!". Phases mirror the original (writing → sealing 0 ms → posting 750 ms → sent 1750 ms). Honeypot field "Website" silently succeeds for bots. |
| Forms backend | `src/lib/submitEnquiry.ts` posts JSON to `VITE_FORM_ENDPOINT` if set (Formspree/Web3Forms); otherwise it is a mock. |
| Puppy page ribbon | A bar at the left of the page scales with scroll: `scaleY = 0.1037 + 0.8963 × progress`, formula fitted from the live site at several scroll positions. |

## 4. Paw cursor and paw trail

**Cursor.** The original sets `cursor: url(paw.svg) 9 6` on the page and `paw-press.svg` over links/buttons, only for
a mouse (`hover:hover` + `pointer:fine`) with motion allowed. Text fields keep the I-beam. I use the same rules.

**Trail idea.** A fixed pool of paw SVGs (`.pup-prints`, absolutely positioned, non-interactive) is reused
round-robin; no DOM is created while moving.
1. On `pointermove` (mouse only) measure how far the pointer travelled since the last event.
2. Every `STEP` px of travel add a footprint to a *queue* at that exact point on the path, with the direction of
   travel.
3. A footprint is only *stamped* once the cursor is `GAP` px beyond it. That creates the small gap behind the pointer
   and means a print is never under the cursor; if the pointer stops, the unreleased queue is dropped after 160 ms.
4. Stamping sets `transform: translate(...) rotate(...)` (rotated to the travel direction, offset ±7 px
   perpendicular to the path for left/right feet) and plays a Web Animation: opacity 0 → 0.45 → 0.45 → 0 over 2.6 s.
5. Current tuning: pool 16, `STEP` 38 px, `GAP` 20 px.

**Important difference from the original** (found by recording it): there the prints are laid by the walking mascot
while the page scrolls, and mouse movement only makes the mascot look at the cursor. The trail here follows the mouse
because that was requested. When the walking mascot is built, the same print pool can be fed from its steps.

**Mascot trail (built):** the cursor trail is kept *and* the walking mascot now lays prints like the original: one per
34 stride-units walked, alternating left/right foot, rotated to his heading, from a pool of 24 (see section 5).

## 5. The mascot "Teddy" (SVG rig + walking journey)

Files: `src/lib/mascot/{rig,buddies,journey,loop}.ts`, `src/components/ui/TeddySvg.tsx`, `src/components/layout/PupJourney.tsx`.
Everything was ported from the reference's un-minified JS (same numbers), then verified against the live site.

- **Rig (`rig.ts`).** A *pose* is 20 numbers (body angle, head offset, leg angles, tail, eyes, tongue...). `frame()` turns a
  pose plus live state (stride phase, wag, gaze, blink, ear spring) into SVG `transform`/`opacity` strings for 25 named
  parts (`data-p="head"`, `"tail"`, ...). `Rig.tick()` eases toward the target pose every frame (time constants like
  0.16 s) and only writes attributes whose value changed. 12 poses: stand, walk, sit, peek, snug, lie, sleep, settle,
  hop, sniff, bow, beg. The SVG itself is generated from the same path data (`TeddySvg.tsx`), so every pose renders
  from one source.
- **Tricks.** `ACTS` are timelines of `[seconds, fn]` cues (woof, spin, beg, bow, hop, love with hearts, tilt, sneeze,
  zoomies, peekaboo, wake). Clicking him picks a random trick; mashing him 4 times in 0.7 s triggers zoomies.
- **Static buddies (`buddies.ts`).** Every `.pup-buddy` in the page (scene stops, 404, puppy page, FAQ...) is attached to
  a rig: blinks, wags, looks at the cursor, gets petted on hover, plays tricks on click and an idle trick every 9 s.
  They only animate while on screen (IntersectionObserver) and not at all for reduced-motion users.
- **Journey (`journey.ts`).** One fixed-position Teddy walks between the page's `[data-pup-stop]` spots as you scroll.
  `measure()` finds each stop and the scroll range during which he should sit there (sticky/pinned scenes handled);
  `place()` maps a scroll offset to a position along a cubic Bezier between the two stops, eased with smootherstep,
  kept inside the safe area with soft clamps, hopping over "behind" stops; `tick()` sets pose/stride/facing, lays paw
  prints, and moves the DOM. When scrolling stops mid-way he drifts on to the nearer stop. On phones a smaller Teddy
  peeks in from alternate sides between scenes. While he is out, the static buddies in the stops are hidden
  (`html[data-pup]`).
- **Verification.** `scripts/qa/mascot.mjs` scrolls a page with motion on and prints his position, hold state and layer
  order at 9 scroll offsets on both sites: **all 9 match exactly at 1440 px and at 390 px**, page heights equal, and the
  number of simultaneous paw prints is 19 on both.

## 6. Loading curtain and the flight plane

- **Curtain (`RouteCurtain.tsx`, `lib/curtain.ts`).** A scalloped blanket with a running Teddy, portalled to `<body>` (the
  original's CSS expects it there). States: `intro -> idle` on every full load; on an internal link click `covering` (300 ms)
  `-> covered ->` route changes `-> lifting` (460 ms) `-> idle`. A capture-phase click handler intercepts same-origin links,
  skips anchors, new tabs, downloads and modified clicks; back/forward uses a `snap` state; a 6 s timeout means a visitor
  can never get stuck behind it. It also sets `html[data-curtain]` (locks scroll) and fires `tp:arrived` when it lifts.
  `useRevealScope` holds scroll reveals while `curtainDown()` is true and releases them on `tp:arrived`, so content animates
  in as the curtain lifts. Hidden for reduced motion. State timings were logged on both sites and match.
- **Flight plane (`lib/flights.ts`).** The route is an SVG path. Progress = `(0.95*vh - top) / (0.7*vh + height)` of the card
  (framer's `["start 95%", "end 25%"]`); the plane sits at `getPointAtLength(progress * length)`, rotated to the path
  tangent (two points 1 px either side), opacity `(p - 0.11) / 0.06`. Reduced motion pins it at 0.62. Used on the home
  "paths" scene and on `/how-it-works`; positions agree with the original to about 0.3 px at six scroll points.
- **How it works.** The original sets `data-ready` on `.tp-journeys` after mount, which turns on the step cards' pop-in
  (`tp-step-in`, staggered by `--i`); the postcard plane's bob is CSS. Both now work, including after switching tabs.

## 7. Hero lineup: puppies that duck, swap and pop with a name bubble

`src/pages/home/HeroLineup.tsx` (ported from the original's `HeroLineup`). The hero shows 6 seats of puppies over the quilt; the
showroom has 15 available puppies, so the rest rotate in.
- After the entrance animation (`tp-peek`) finishes, a loop picks a random visible seat (never the same one twice in a row),
  sets `data-state="duck"` (CSS slides the photo down, 340 ms), then at 360 ms swaps in the next puppy from a shuffled queue
  (sending the old one to the back), sets `data-state="pop"` (CSS `tp-pop-up`) and shows that seat's name bubble for 1.8 s.
  The gap to the next one cycles through 1.9/2.5/1.7/2.3/2.0/2.8/1.8 s so it doesn't feel metronomic.
- It only acts when the tab is visible, the hero is at least 35 % on screen, you haven't scrolled/clicked/hovered in the last
  1.2 s, and the hero is the scene Teddy is at (`data-here`). The *next* photo is kept in a hidden "wings" element and
  `decode()`d first, so a swapped-in puppy never pops up half-loaded (it waits up to 6 s, then skips that puppy).
- Hover/focus on a puppy shows its bubble too (a second "tags" list sits above the photos so bubbles are never clipped).
- Reduced motion: static six, no loop. Static render still matches the original (0.1 % diff); a 16 s behaviour log of both
  sites shows the same sequence of duck, swap, pop, bubble.

## 8. Problems met and how they were fixed

| # | Problem | Cause | Fix |
|---|---|---|---|
| 1 | Global npm install of Firecrawl failed (EACCES) | System prefix not writable | Installed with `--prefix ~/.local`. |
| 2 | Firecrawl blocked, then rate-limited | Keyless mode blocked on my IP; free tier ≈10 req/min | Authenticated; throttled script with sleeps. |
| 3 | A `pkill -f` pattern killed my own shell | Pattern matched the shell command line | Stop using broad pkill patterns; use task IDs. |
| 4 | Python `urllib` hung on page fetches | Server behaviour with that client | Used `curl` + `xargs -P`. |
| 5 | Full-page screenshots in a very tall window broke `100svh` sections | Viewport units scale with window height | Playwright with a real viewport and scrolling. |
| 6 | Polaroid photos stretched/unfilled | My CSS splitter **dropped all 67 `!important` flags** | Fixed `split-css.mjs` to keep `d.important`; regenerated; diff fell from 25 % to 0 %. |
| 7 | Paw icon threw `<path> attribute d` errors | Path copied from a truncated debug dump (`…[757]`) | Took the full path from the raw server HTML. |
| 8 | Text like "Sarah M., Dubai" got extra spaces; some words glued together | `html2jsx` didn't merge text nodes split by React comment markers | Rewrote text handling: merge adjacent text, drop comments, keep edge spaces. |
| 9 | Several classes did nothing (`text-giant`, `text-lede`, `measure`, `gutter`) | Custom Tailwind utilities in the reference weren't ported | Found them by scanning generated markup for classes missing from built CSS; added `@utility` rules. |
| 10 | React warnings on generated markup (`novalidate`, `inputmode`, `inert`, numeric attrs, `value=""`, `selected`) | HTML attributes vs JSX names/types | Mapped them in the converter; `defaultValue`; typed `inert`; selection via value. |
| 11 | TypeScript rejected CSS custom properties in `style` | `CSSProperties` lacks `--x` keys | Augmented `CSSProperties` in `vite-env.d.ts`. |
| 12 | `/puppies` page was 342 px shorter and had no filter panel | Server HTML lacks the client-rendered filters | Dumped the hydrated DOM, built the filter bar in React; mismatch 43 % → 0.03 %. |
| 13 | `/how-it-works` was 820 px too tall | Server HTML renders both tab panels | Implemented the tab switch that hides the inactive panel. |
| 14 | Cloudflare e-mail obfuscation ("[email protected]") in the saved contact page | Scraped HTML | Replaced with the plain address. |
| 15 | Puppy gallery counts were off by the video posters | A video's poster frame is also in the photo list | Drop the gallery image whose filename starts with the video's name. |
| 16 | Puppy pages 2–3 % off | Per-photo crop focal points missing | Scraped `object-position` for all photos into `focal.json`. |
| 17 | Contact page's JS (form logic) wasn't in my reference folder | I only downloaded the home page chunks | Fetched the page's chunks and read the form code. |
| 18 | `rm` blocked a command chain | `rm` is aliased to interactive mode | Use `rm -f`. |
| 19 | Dev server died after the session restart; QA failed with ERR_CONNECTION_REFUSED | Background process was gone | Restarted Vite in the background. |
| 20 | Paw cursor still the default arrow | Before the files existed Vite returned an HTML page (200) for those URLs, which browsers cached | New file names (`*-v2`), PNG first + SVG fallback; told the user to hard-reload. |
| 21 | Paw trail followed scroll instead of the mouse | I copied the original's scroll-driven stamping without the mascot | Recorded the original, confirmed the mechanism, then (as requested) switched to pointer-driven stamping with queue + gap. |
| 23 | Teddy's SVG paths were cut off (`...[210]`) on the puppy page and the 404 | The DOM-dump helper truncates attribute values at 70 characters, and I pasted its output | Generate the SVG from the rig's own path functions (`TeddySvg`); 404 diff fell from 0.69 % to 0.08 %. |
| 24 | Puppy page Teddy sat instead of peeking | Default pose used | `pose="peek"` (read from the original DOM). |
| 25 | How-it-works steps didn't animate | `data-ready` flag missing; found by diffing live DOM attributes of both sites | Set it after mount. |
| 22 | Trail "gap too big" / "only 1–2 paws when slow" | Gap 90 px, step 78 px | Tuned to gap 20, step 38, pool 16 and checked with scripted slow/medium mouse paths. |
| 26 | `/happy-families` 3 px shorter than the original at 390 px (8.7 % diff, whole page shifted) | Traced with a script that diffs element tops/heights of both sites: the photo wall was 1.1 px taller/shorter in total. The original serves photos through Next's image optimiser, so each `<img height:auto>` takes the intrinsic ratio of a thumbnail with a *rounded* height (175×233, not an exact 3:4). Our full-size files have exact ratios, and 64 rows of 0.4 px add up | Recorded the original's thumbnail sizes (`src/data/wall-thumbs.json`) and apply them as `aspect-ratio` on phones only. Main height now identical (31040 px), diff 8.7 % → 6.3 %, the rest is image sharpness at photo edges, not layout. Applying it at 768/1440 made those worse, so it is phone-only. |
| 27 | Contact form emails were plain ("Hello, a new form has been submitted") | Web3Forms' free plan has a fixed template | Moved to EmailJS with my own HTML template (`docs/email/enquiry.html`: cream/cocoa/honey palette, puppy card, WhatsApp and call buttons). Web3Forms stays as the automatic fallback. EmailJS first failed with `Gmail_API: Not found the sessional location`: the Gmail service needed to be reconnected with the "send on your behalf" permission. |
| 28 | Puppy shown as a raw UUID in the email | The select posts the puppy id | Read the selected option's text before sending (`data.puppy`); empty fields become "Not given". |
| 29 | Footer showed `[email protected]` (English too) | I had copied Cloudflare's email-obfuscation markup from the original (`data-cfemail`), which is only decoded by their script | Plain `mailto:info@instabizweb.com`. Footer diff 0.06 % → 0 %. |
| 30 | Meet-the-pups treadmill empty / misplaced in RTL | Track is `left:0` and sized by `scrollWidth`, which ignores leftward overflow in RTL | Anchor right, size from `getBoundingClientRect`, mirror the translate sign and the door-open test. |
| 31 | Segmented switch showed a blank pill in RTL | Thumb is `left:.4rem` + `translate: +N*100%` | Mirrored in `rtl.css`. |
| 32 | "1 / 2" shown as "2 / 1" and phone numbers backwards in Arabic | Neutral characters take the paragraph direction | `<bdi dir="ltr">` and Unicode isolates. |
| 33 | Teddy hovered ~115 px above the footer basket in Arabic (found by the user) | Debugged by logging the journey model: in Arabic the footer is shorter, so the minimum-walk spacing in `resolveHolds` pushed the last hold range to start *past the end of the page*; at max scroll he settled to a scroll position the page can't reach | Clamp the last hold to `maxScroll - 1` after spacing is applied (this was a latent bug for any short page or window size, not an Arabic-only one), plus a watchdog that re-measures if the document height changes after the last resize. English parity re-checked with `mascot.mjs` against the original: identical. |
| 34 | Home chunk 1 MB, photos up to 4 MB each, `/robots.txt` returned HTML | Everything imported eagerly; originals served as-is; SPA rewrite catches every path | See 8d: route chunks with idle prefetch, build-time WebP variants + runtime `srcset`, static robots/sitemap. |

## 8b. CI and the contact email
- **CI** (`.github/workflows/ci.yml`): on every push to `main` and every PR, GitHub installs with `npm ci`, runs `npm run build` (type-check + production build), checks `dist/index.html` exists and uploads `dist`. It catches errors that only show on a clean machine. The visual QA needs Chromium and the live reference, so it stays a local tool.
- **Contact email**: `submitEnquiry.ts` tries EmailJS (REST call from the browser, our HTML template) and falls back to Web3Forms. All keys are public by design and only allow sending to the owner's registered address; restrict allowed domains in their dashboards.

## 8c. Arabic / RTL (extra, not in the original)
The brief was a 1:1 clone, so this is deliberately additive: English renders exactly as before and Arabic is opt-in (header toggle, `?lang=ar`, remembered in `localStorage`).

**How it works**
- **Direction and language** are set on `<html>` by a tiny inline script in `index.html` before first paint (no flash). The toggle saves the choice and reloads, which keeps the mascot, pinned scroll and reveal code simple (they measure once per load).
- **Translation without rewriting 8,000 lines of ported markup.** `src/i18n/dom.ts` translates the rendered DOM (text nodes plus `aria-label`, `alt`, `placeholder`, `title`, and the document title/description) and keeps a `MutationObserver` running, so strings written by scripts (puppy counts, FAQ search messages, Teddy's speech bubbles, the contact "sent" state) are translated too. `tr()` in `src/i18n/index.ts` resolves a string in three steps: exact dictionary hit (`ar-ui.ts`, `ar-pages.ts`), templated rules (`ar-puppies.ts`: "photo N of M", "Ask about X on WhatsApp", the meta descriptions), then token composition for card labels such as "Maltipoo, boy, 3 months" (breeds, sexes and ages are translated word by word, with Arabic month plurals: شهران, 3 أشهر, 11 شهرًا). Strings with no translation stay in English instead of breaking.
- **Finding the gaps:** `scripts/i18n/extract.mjs` crawls every route (and 20 puppy pages) and lists each string; `LANG_AR=1 node scripts/i18n/extract.mjs` lists whatever is still English in Arabic mode. The last run left only puppy names, the "EN" toggle and the email address.
- **Layout:** most of the page flips for free because the reference CSS uses flex/grid and logical properties. `src/styles/rtl.css` (all rules scoped to `html[dir="rtl"]`) fixes the physical ones: the Arabic font stack (Readex Pro, loaded only in Arabic; Latin keeps Fraunces/Figtree), `letter-spacing: 0` (tracking breaks Arabic letter joining), taller line-height for the display type, the segmented switch thumb, the signposts (tips point away from the post), the reading ribbon.
- **Pinned "Meet the pups" treadmill** (`useMeetPin.ts`): runs the other way in RTL (translate sign flipped, doors open as they pass the right edge, Teddy faces left). `scrollWidth` ignores overflow to the left in RTL, so the track width comes from `getBoundingClientRect()` instead.
- **Bidi traps:** counters like "1 / 2" and phone numbers render reversed in RTL, so they are wrapped in `<bdi dir="ltr">` or Unicode isolates (`dom.ts` isolates any `+971 …` text node).

**Honest limits:** the Arabic was written by the AI and has not been reviewed by a native speaker; puppy names stay in Latin script; the curtain's running Teddy and the plane still travel left to right; the wall of 64 photos and long copy are translated but the originals' tone is approximated.

## 8d. Performance pass
Lighthouse (mobile, throttled) on the live site was already 93 to 97 on the best pages. The weak spots were a single 1 MB JavaScript bundle, multi-megabyte photos and a broken `robots.txt` (the SPA rewrite answered it with the HTML shell, 29 "errors").

- **Route code splitting** (`src/routes.ts`): only the shell and the home page are in the first bundle; every other route is a `React.lazy` chunk. Chunks are prefetched when the browser is idle or the pointer/focus first moves toward a link, so the loading curtain never waits on the network (`Suspense fallback={null}` is only a safety net). Main bundle 1004 KB to 239 KB (gzip 197 to 46 KB).
- **English no longer ships the Arabic dictionaries**: the language helpers moved to a tiny `i18n/lang.ts`; the dictionaries and translator are dynamic imports, loaded before first render only in Arabic.
- **Responsive WebP variants** (`scripts/make-variants.mjs`, runs as part of `npm run build`, about 17 s): every photo in `public/media` (some 3120x4160 px) gets 320 to 1600 px WebP copies in `public/media-opt` (gitignored, rebuilt on Vercel/CI). `src/lib/images.ts` adds a `srcset` to each `/media/` image, including ones React renders later (a MutationObserver), so I did not have to touch 8,000 lines of ported markup. The original stays in `src` for the full-screen viewer. Image bytes per page, before to after (1440 px): home 3.6 MB to 0.9 MB, /puppies 2.5 MB to 0.3 MB, /happy-families 15.2 MB to 1.4 MB, puppy page 565 KB to 102 KB. Pixel-diff against the original did not get worse (home sections 0 to 0.12 %, /happy-families at 390 px 6.3 % to 5.8 %).
- **Logo and favicon** were 800 px and 512 px PNGs for a 56 px image: now a 7 KB WebP and a 96 px icon.
- **`robots.txt` and `sitemap.xml`** (`npm run sitemap`) as real static files.
**Lighthouse results** (mobile, simulated throttling, live site; performance / accessibility / best practices / SEO):

| Page | Before | After |
|---|---|---|
| Home | 69 to 93 (noisy) / 100 / 100 / 92 | 95 / 100 / 100 / 100 |
| /puppies | 88 / 100 / 100 / 92 | 96 / 100 / 100 / 100 |
| Puppy page | 91 / 100 / 100 / 92 | 83 / 100 / 100 / 100 |
| /happy-families | 90 (4.5 MB) / 100 / 100 / 92 | 96 (1.0 MB) / 100 / 100 / 100 |
| /how-it-works | 92 / 100 / 100 / 92 | 98 / 100 / 100 / 100 |
| /faq | 92 / 100 / 100 / 92 | 98 / 100 / 100 / 100 |
| /contact | 97 / 100 / 100 / 92 | 99 / 100 / 100 / 100 |

Two things I got wrong on the way and fixed: (1) with plain `React.lazy`, landing directly on e.g. /faq painted the footer before the page arrived, a layout shift of 0.97 on every inner page. Fix: a small `page()` wrapper that renders synchronously once its chunk is loaded, and the landing route's chunk is loaded before the first render. (2) The puppy page is the one score that went down (91 to 83): its main photo now appears a little later because the route chunk has to arrive first. Not fixed, noted.
- Not changed on purpose: the intro curtain (it is part of the original's behaviour and delays first contentful paint by about a second), and the full-axis display fonts the design depends on.

## 9. Known gaps (honest list)
- `/happy-families` at 390 px: layout now matches (height Δ 1 px); 6.3 % remains from image sharpness (we show full-size photos, the original shows blurred 175 px thumbnails). At 768 px the page is 26 px shorter (not traced).
- Mobile footer (390 px) is ~9 % off the original (layout identical; not traced, likely the animated stars/moon).
- Arabic has not been reviewed by a native speaker (see 8c).
- The contact form is mocked unless EmailJS / Web3Forms variables are set; the live site has them (EmailJS themed email, Web3Forms fallback).
- Deployed on Vercel (Deployment Protection must be off for reviewers) and pushed to GitHub.
- Mascot trail uses its own 24-print pool; the cursor trail has a separate 16-print pool (both are `.pup-prints`).
- Images, copy and CSS originate from the reference site; they are used here only for this assessment.
