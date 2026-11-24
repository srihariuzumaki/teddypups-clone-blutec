# PRD — TeddyPups U.A.E. clone (Blutec.AI technical assignment)

**Reference:** https://puppy.instabizweb.com/ (a Next.js app, Insta Biz Web demo for "TeddyPups U.A.E.")
**Goal:** pixel- and behaviour-faithful clone, deployed, with GitHub repo + Loom walkthrough.
**Stack (decided):** React 18 + Vite + TypeScript, React Router, plain CSS (ported design tokens) or Tailwind v4, Lenis for smooth scroll. No GSAP needed (see ANIMATIONS.md).
**Deadline:** 48 h from the moment we reply to the Blutec email accepting.

## 1. What the site is
A single-brand marketing/catalogue site for a Dubai teacup-puppy seller. Hand-drawn, storybook look: a teddy-bear mascot, scroll-driven "scenes" that go from morning (cream) to night (dark brown), sketch-style puppy cards, ticket-style "gone home" cards, notes-board FAQ, a letter-style contact form. Conversion goal = WhatsApp enquiry (`wa.me` link) or enquiry form.

## 2. Routes (7 static + 1 dynamic family)
| Route | Purpose | Source of truth |
|---|---|---|
| `/` | Home: 8 scroll scenes + footer | docs/content/home.md, SECTIONS.md |
| `/puppies` | Catalogue, filters via `?breed=` and `?origin=` | docs/content/puppies.md |
| `/puppies/:slug` | Puppy profile (gallery, facts, "what comes with", journey, enquiry form, prev/next pup) | docs/content/puppies_copper-male.md, data/puppies.json |
| `/gone-home` | 27 "tickets home" for adopted puppies | docs/content/gone-home.md |
| `/happy-families` | Testimonial + photo wall ("64 moments") with lightbox | docs/content/happy-families.md |
| `/how-it-works` | 4 chapters: two ways home, promise, delivery (`#delivery`), why us | docs/content/how-it-works.md |
| `/faq` | 9 expandable "notes" | docs/content/faq.md |
| `/contact` | Madlib-style letter form + showroom block | docs/content/contact.md |
| 404 | Not found (check original behaviour) | — |

Also: `/sitemap.xml`, `/robots.txt`, favicon (`icon.png`, `apple-icon.png`), OG image (`/brand/logo.png`).

## 3. Functional requirements
1. **Header** (fixed): logo + "TeddyPups", nav (Home, Puppies, Happy families, How it works, FAQ, Visit & contact), WhatsApp CTA, mobile "Menu" overlay ("where to, friend?"). Transparent on home at top → cream bar after scroll (`data-scrolled`); hides on scroll down, shows on scroll up (`data-hidden`). Active link state + paw hover icon.
2. **Mobile bottom bar** (`--bar-h` = 4rem + safe-area): "WhatsApp us" + "Call" (`tel:+971500000000`), shown ≤767px.
3. **Smooth scrolling** via Lenis; respect `prefers-reduced-motion`.
4. **Home scenes** (see SECTIONS.md): hero (arched-window lineup) → meet the pups (pinned arched doors) → two ways (signpost) → journey/WhatsApp chat → puppy passport → happy families (dusk polaroids) → FAQ list (night) → "welcome home" CTA → footer.
5. **Catalogue filters:** `?breed=maltipoo|pomeranian|poodle|cavapoo|shih-tzu`, `?origin=local|imported`; chips on the home chat scene link to these.
6. **Puppy profile:** breed / boy-or-girl / age / where (Local showroom vs Imported for you); video badge where a video exists; WhatsApp deep link; enquiry form anchored `#enquire-<slug>`; prev/next pup links.
7. **Forms (contact + per-puppy):** name*, phone/WhatsApp*, email, area, puppy-of-interest select, message; honeypot field "Website" (anti-spam); client-side validation; success state ("letter posted" animation). Original posts to its own backend — we mock (see TASKS.md for options: Formspree/EmailJS/serverless fn or localStorage stub).
8. **FAQ:** cork-board of 9 notes, live search filter ("sniff out a question") with count, expand/collapse, keyboard accessible.
9. **Happy families:** masonry/grid of photos, click → lightbox, testimonial quote (Sarah M., Dubai).
10. **SEO/meta:** title `TeddyPups U.A.E. — Premium teacup puppies in Dubai`, description, OG + Twitter cards, per-page titles (verify in docs/content or via Firecrawl pages JSON), `lang="en"`.
11. **A11y:** skip link ("Skip to content"), `aria-labelledby` on scenes, `aria-label` on puppy cards, focus rings, reduced-motion fallbacks.

## 4. Non-functional
- Responsive breakpoints in use by the original: 24rem, 40rem/640, 48rem/768, 64rem/1024, 1100, 1280, 1680, 96rem, 112rem. Mobile-first; header height 4.75rem desktop / 4rem mobile.
- Images: original serves AVIF/WebP/JPG via `/_next/image` at many widths → we use `loading="lazy"`, `srcset` from local optimised copies (see ASSETS.md).
- Lighthouse target: Perf ≥ 85 mobile, A11y ≥ 95.
- Deploy: Vercel (SPA rewrite to `index.html`) or Netlify.

## 5. Out of scope / assumptions
- Original WhatsApp link and email are placeholders for the agency (Insta Biz Web: `wa.me/919898124987`, phone `+971 50 000 0000`, email `info@instabizweb.com`). Keep the same placeholders.
- Social links all point to `https://www.instabizweb.com/`.
- We cannot reproduce the original server/CMS; puppy data is a static JSON (`data/puppies.json`).
- Copy and images belong to the reference site; used only for this assessment. Mention that in the README.

## 6. Acceptance checklist (for the Loom demo)
- [ ] All 8 routes render and match reference at 375 / 768 / 1440 px
- [ ] Header hide/show + scrolled state, mobile menu, bottom bar
- [ ] Home scenes: colours/gradients, mascot/illustrations, pinned scroll, reveal animations
- [ ] Catalogue (15 available + 5 gone-home teasers) with working filters
- [ ] 42 puppy detail pages (15 available + 27 gone home; 27 tickets on /gone-home)
- [ ] Forms validate + success state
- [ ] FAQ accordion, lightbox, 404
- [ ] Deployed URL, GitHub repo, README, PROMPTS.md filled in
