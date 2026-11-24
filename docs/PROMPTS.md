# PROMPTS.md — AI usage log

Blutec asks for the AI tools used and the exact prompts. This is the running log for the TeddyPups U.A.E. clone
(reference: https://puppy.instabizweb.com/). Prompts are quoted as typed (typos kept). Outcomes describe what the AI
produced; the "My part" lines are the things I decided, checked or corrected myself.

> How the tools were used: I describe what I want, Claude Code writes/edits files and runs commands, and I review the
> result in the browser. Every visual claim below was checked by pixel-diffing against the live reference site
> (see [IMPLEMENTATION.md](IMPLEMENTATION.md)), not just by eye.

## Tools used
| Tool | Used for |
|---|---|
| Claude Code (Claude Sonnet 5.5) in VS Code | Planning, recon, code generation, debugging, review |
| Firecrawl CLI | Scraping the reference site to markdown, screenshots, link/image maps |
| Playwright (playwright-core + system Chromium) | Capturing original vs ours, behaviour probes, console-error checks |
| pixelmatch / pngjs | Pixel diff percentage per section and per page |
| curl, jq, python, node scripts | Downloading the reference HTML/CSS/JS, analysing CSS rules and the JS bundles |
| Prettier (npx) | Un-minifying the reference JS so the scroll/reveal/mascot logic is readable |
| Vite, React 18, TypeScript, Tailwind v4, React Router, Lenis | The app itself |
| (to add at the end) GitHub, Vercel, Loom, Lighthouse | Delivery |

## Log (oldest first)

### 1. Planning the assignment
**Prompt:**
> ok so i applied for this role today … (pasted my application email and the assignment email from Blutec) … so according to this how shouyld we proceed with this assignement

**Outcome:** Plan: recon the site, accept to start the 48 h clock, build, deploy, record the Loom, submit by email.
**My part:** I chose to accept and reply (clock started 23 Nov, 6 pm).

### 2. Stack + documentation pack
**Prompt:**
> for the techstack i think we should go with the react and yes scrape the target site and create the markdown files like prd theme and any other usefull files which can make the development process easier

**Outcome:** React + Vite + TypeScript chosen. `docs/` created (PRD, THEME, SECTIONS, ANIMATIONS, ARCHITECTURE, TASKS, cleaned page copy, screenshots), plus `data/` (42 puppies), `reference/` (raw HTML, CSS, JS), an assets manifest and downloader.
**My part:** I picked React over the original's Next.js.

### 3. Tooling setup
**Prompts:**
> first install firecrawl cli i think it si instlaeed no ? if not install it first

> ok i have authenticated now you can go aheasd with the firecrawl

**Outcome:** Firecrawl CLI installed in `~/.local` (global install hit a permissions error); I authenticated because the keyless mode was blocked on my IP. Scraping then ran throttled because of the free-tier rate limit.

### 4. First implementation
**Prompt:**
> ok then can we start the first implementation of the assignment then

**Outcome:** Vite + React app with routing, layout shell, Lenis smooth scroll, data layer, all routes and a first version of the home scenes, built from my own CSS.
**My part:** I reviewed it in the browser and decided it was not close enough (next prompt).

### 5. Switch to a 1:1 replica
**Prompt:**
> there are still lots of improvements needed in the microinteractions animations and overall site itself i need one to one replica of the site you can use the skills however you want and also look up for a skill in the internet which is helpfull for this implemenation we will improvise the site page by page

**Outcome:** The approach changed from "re-draw it" to "reuse the reference's own markup and CSS and re-wire the behaviour":
- split the reference's compiled CSS into Tailwind v4 layers + 4,900 lines of `tp-*`/`pup-*` component CSS;
- built extraction tools (`scripts/qa/dom.mjs`, `html2jsx.mjs`, `ssr-section.mjs`, `gen-scene.mjs`, `gen-page.mjs`);
- built a visual QA harness (`scripts/qa/qa.mjs`) that screenshots original vs ours and prints a mismatch %.
- I declined to install third-party "website cloner" skills I could not review, and only listed them as options.
**My part:** I asked for page-by-page 1:1 fidelity as the standard.

### 6. Continuing after switching Claude accounts
**Prompts:**
> if i change the claude account will i loose this chat ? or how can i continue in this chat after switching to another account ?

> ok now i have switched to diff account so now lets start the implementation so before that what do you suggest like fixing the other pages or refining the home screen to match exactly like the target site

**Outcome:** Chats are stored locally, so they survive an account change. Recommendation: fix the inner pages first, polish the home page animations later.

> no i have repied yesterday at 6 pm so you dont need to worry about that

**Outcome:** Deadline recorded as 25 Nov, 6 pm.

### 7. Shell, home page and all inner pages
(Work done under prompts 5–6; listed here because it is where most of the code came from.)

**Outcome:** Header, `<dialog>` mobile menu, footer, WhatsApp bar; the 8 home scenes; `/puppies` with working filters; `/puppies/:slug` rebuilt as a data-driven page for all 42 puppies; `/gone-home`; `/happy-families` with photo viewer; `/how-it-works` with tabs; `/faq` with search; `/contact` with the letter-posting animation; the 404.
Measured result against the live site (1440 px): header/footer/home sections 0–0.5 %, inner pages 0.03–0.7 %, puppy pages 0.08–0.34 %, with identical page heights.
**My part:** I reviewed the pages and decided the order (inner pages before mascot polish).

### 8. Paw cursor and paw trail
**Prompts (in order):**
> before that change the curosr to the paw and also add the paw trails just like the original

> the trials are wrong it should not apper on the scroll but rather when the cursor is moved and also the cursor is still default it should be paw one see the site carefully record if it it necessay and implement this

> reduce trhe number of paws follwing the cursor add small gap between each follwing paw and the cursor is still black defailt the cursor should be custome paw one

> ok the cursor is now showiung but the trailing paws gap is more reduce it more and now there are only one or two triling when mouse is moved slwoy it should be just a bit more and smooth trialing

**Outcome:**
1. Cursor: copied the original's `paw.svg` / `paw-press.svg`; the CSS already referenced them.
2. Trail v1 followed the scroll. I then recorded the original with a script and read its code: its prints come from the walking mascot while scrolling, and mouse movement only makes the mascot look at the cursor. I told this to the user, who asked for a cursor-driven trail anyway, so v2 follows the mouse (a deliberate difference).
3. Cursor still showed the default arrow for the user: the browser had cached a failed lookup (before the files existed the dev server returned an HTML page for those URLs). Fixed with new file names (`*-v2`), a PNG first choice and the SVG as fallback.
4. Tuned the trail with three constants: pool 16, one print per 38 px of travel, laid 20 px behind the pointer, 2.6 s fade.
**My part:** I did the visual judging ("too many", "gap too big", "too few when slow") and asked for the cursor-based behaviour; the numbers above come from that feedback.

### 9. This documentation
**Prompt:**
> before that modify the @docs/PROMPTS.md to what we have done till now with proper prompting and make another md with how did we implement this like what idea for paw trailing and the horizontal scrolling what issue did we face until now and how we fixed it

**Outcome:** This file and [IMPLEMENTATION.md](IMPLEMENTATION.md).

### 10. Deploy, then the mascot
**Prompts:**
> you can name the github repo accordingly and if possinle push it to the github and check if vercel is connected if not  iw ill connect it

> ok now the github is pushed next

> ok now that done can we move on to the svg animations ?

**Outcome:** Repo `teddypups-clone-blutec` pushed; Vercel project created and deployed (Deployment Protection must be switched off in the dashboard for reviewers). Then the SVG animation work: I read the original's mascot engine (rig, acts, journey) and ported it to `src/lib/mascot/`. Verified by scrolling both sites and comparing Teddy's position at 9 offsets (all identical at 1440 and 390 px).
**My part:** I created the GitHub token/login and the repo, and chose the next priority (mascot after deploy). Found and fixed a bug of mine on the way (truncated SVG paths).

---

## Still to do (as of this log)
- Intro curtain (route transition), hero lineup duck-and-pop.
- Real form endpoint (currently mocked unless `VITE_FORM_ENDPOINT` is set).
- GitHub push, Vercel deploy, README, Loom, submission email.

## Things I should be ready to explain in the Loom
- Why Vite + React instead of the original's Next.js.
- Why I reused the reference's CSS instead of re-drawing it, and the honest trade-off: the result is near-exact but derived from the reference; images and copy belong to the reference site (note in README).
- How the pinned horizontal scroll, reveal-on-scroll and chat steps work (see IMPLEMENTATION.md).
- How I verified fidelity (pixel diffs) and what is still not matched.
