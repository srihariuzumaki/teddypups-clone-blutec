# TeddyPups U.A.E. — React clone

[![CI](https://github.com/srihariuzumaki/teddypups-clone-blutec/actions/workflows/ci.yml/badge.svg)](https://github.com/srihariuzumaki/teddypups-clone-blutec/actions/workflows/ci.yml)

A page-by-page, 1:1 rebuild of <https://puppy.instabizweb.com/> (originally Next.js) in **React + Vite + TypeScript**,
made for the Blutec.AI technical assignment.

- **Live:** https://teddypups-clone-blutec.vercel.app
- **Repo:** https://github.com/srihariuzumaki/teddypups-clone-blutec
- **How it was built:** [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) · **AI prompts used:** [docs/PROMPTS.md](docs/PROMPTS.md)

## What's in it
- All routes: home (8 scenes), `/puppies` (working filters), `/puppies/:slug` (data-driven, all 42 puppies), `/gone-home`,
  `/happy-families` (photo viewer), `/how-it-works` (tabs), `/faq` (search), `/contact` (letter-posting animation), 404.
- Behaviour re-implemented in React: Lenis smooth scroll, reveal-on-scroll, pinned horizontal "Meet" scroll, chat steps,
  scroll-driven flight plane, `<dialog>` mobile menu, reading-progress ribbon.
- **Teddy the mascot**: an SVG rig with 12 poses and tricks. He walks a Bézier path between sections while you scroll
  and leaves paw prints. Static buddies react to hover, cursor and clicks.
- Loading "curtain" on every load and page switch, hero lineup that swaps puppies with name bubbles, custom paw cursor
  with a paw trail that follows pointer movement.

## Fidelity
Each page was captured from the original and from this app with Playwright and pixel-diffed (`scripts/qa/qa.mjs`).
At 1440 px the home sections differ by 0–0.1 %, inner pages by 0.03–0.5 %, puppy pages by 0.1–0.3 %, with identical page
heights. Known gap: `/happy-families` at 390 px is 8.7 % off (3 px taller). Details are in
[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md#9-known-gaps-honest-list).

## Run it
Requires Node 20+ (CI uses 22).
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check (tsc -b) + production build into dist/
npm run preview    # serve the production build
```
Photos and videos are already committed under `public/`. `npm run assets` re-downloads them and `npm run data`
rebuilds `src/data/puppies.json` from `data/`; you don't need either to run the app.

**Contact form:** mocked unless a key is set. Set `VITE_WEB3FORMS_KEY` (a public Web3Forms access key, enquiries are emailed to the owner) or `VITE_FORM_ENDPOINT` (Formspree or any JSON endpoint) in `.env.local` or in the Vercel project settings. Submissions pass through that third-party service.

## CI
[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on every push to `main` and every pull request:
`npm ci` → `npm run build` (type-check + build) → check that `dist/index.html` exists → upload `dist` as an artifact.
Run the same thing locally with `npm ci && npm run build`.

## Visual QA tooling (local only, not in CI)
Needs Chromium; paths are set for `/usr/bin/chromium` and the dev server on port 5173.
```bash
npm run dev &
node scripts/qa/qa.mjs /faq --vw 390            # screenshot original vs ours, print mismatch % per section
node scripts/qa/mascot.mjs / --n 9              # scroll with motion on, log Teddy's position (add --orig for the reference)
```
Output goes to `qa-out/` (gitignored). `ORIG_URL` / `OURS_URL` override the two sites.

## Project layout
```
src/pages        route components (home scenes in pages/home)
src/components   layout (header, footer, curtain, mascot journey) and ui
src/lib          scroll, reveal, pin, flights and mascot (lib/mascot: rig, buddies, journey)
src/styles       reference CSS split into Tailwind v4 layers + component CSS
src/data         puppies, FAQ, site constants
scripts/qa       visual QA and the HTML→JSX extraction tools used to port the reference markup
docs             PRD, theme, animation notes, prompt log, implementation write-up
reference        raw HTML/CSS/JS of the original (read-only recon material)
```

## Attribution
Copy, photos, videos and the original stylesheet belong to the reference site and its brand. They are reused here only
for this hiring assessment, not for any commercial purpose. The behaviour code (React, mascot engine port, journey,
curtain, lineup) was written for this project with AI assistance, as logged in [docs/PROMPTS.md](docs/PROMPTS.md).

## Planning docs
[PRD](docs/PRD.md) · [Theme](docs/THEME.md) · [Sections](docs/SECTIONS.md) · [Animations](docs/ANIMATIONS.md) ·
[Architecture](docs/ARCHITECTURE.md) · [Tasks](docs/TASKS.md) · [Page copy](docs/content/) · [Screenshots](docs/screenshots/)
