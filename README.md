# TeddyPups clone — planning workspace (Blutec.AI technical assignment)

Reference: https://puppy.instabizweb.com/ · Stack: React + Vite + TypeScript

Everything here was produced by recon of the reference site so the build can start immediately.

| Path | What it is |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Product requirements, routes, functional + non-functional specs, acceptance checklist |
| [docs/THEME.md](docs/THEME.md) · [docs/tokens.css](docs/tokens.css) | Fonts, palette, scene gradients, buttons/cards spec, ready-to-use CSS variables |
| [docs/SECTIONS.md](docs/SECTIONS.md) | Page-by-page / scene-by-scene build spec |
| [docs/ANIMATIONS.md](docs/ANIMATIONS.md) | How scroll, reveals, pinning and the mascot work (Lenis + IO + CSS; no GSAP) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Proposed folder structure, tech choices, data model |
| [docs/TASKS.md](docs/TASKS.md) | Ordered task list with time estimates, risks, submission checklist |
| [docs/PROMPTS.md](docs/PROMPTS.md) | AI prompt log template (required for the Loom) |
| [docs/content/](docs/content) | Cleaned copy for every page (markdown) |
| [docs/screenshots/](docs/screenshots) | Full-page desktop screenshots (Firecrawl) |
| [docs/reference-keyframes.css](docs/reference-keyframes.css), [docs/reference-mascot-rig.txt](docs/reference-mascot-rig.txt), [docs/reference-svg/](docs/reference-svg) | Original keyframes, mascot pose data, mascot SVG — *reference only* |
| [docs/assets-manifest.json](docs/assets-manifest.json) + `scripts/download-assets.sh` | All image/video URLs → `public/` |
| [data/puppies.json](data/puppies.json) | 42 puppies (15 available + 27 gone home): breed, sex, age, origin, gallery, videos, titles |
| `reference/` | Raw HTML, CSS, JS of the reference (untrusted downloads — read only) |
| `.firecrawl/` | Raw Firecrawl output (gitignored) |

> Copy, photos and videos belong to the reference site/brand and are used here only for this hiring assessment.

## Run the app
```bash
npm install
npm run assets   # downloads photos/videos into public/ (not committed if large)
npm run data     # regenerates src/data/puppies.json from data/*.json
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```
Stack: React 18, Vite, TypeScript, React Router 6, Lenis. Deploy: Vercel (`vercel.json` has the SPA rewrite).
