# ANIMATIONS & INTERACTION — how the reference does it

**Findings from the JS bundles:** the site uses **Lenis** (smooth scroll), **IntersectionObserver** (reveals), **CSS keyframes/transitions** (46 `@keyframes`, listed in `reference-keyframes.css`) and a **custom procedural mascot rig** written in plain JS/SVG. **No GSAP / Framer Motion / ScrollTrigger.** So: React + Lenis + CSS + a few small hooks is enough. (If time is short, Framer Motion is an acceptable substitute for reveal/pin logic.)

## 1. Smooth scroll
`lenis` (`npm i lenis`), init once in a `<SmoothScroll>` provider; `autoRaf`, default easing. Disable when `prefers-reduced-motion`. Add `data-lenis-prevent` on scrollable overlays (lightbox `<dialog>`, mobile menu) so inner scroll works. Expose `scrollY` / velocity to the header hook.

## 2. Header behaviour (hook `useHeaderState`)
- `data-home="true"` on `/`; header bg layer transparent only on home at scroll 0.
- `data-scrolled="true"` when `scrollY > ~8`.
- `data-hidden="true"` when scrolling **down** past ~header height; shown on scroll **up**. Transition `transform .5s var(--ease-silk)`.
- Menu overlay: `tp-menu-in/out`, backdrop fade `tp-menu-backdrop-out`, links stagger via `tp-menu-link`.

## 3. Reveal-on-scroll (`data-reveal`)
IntersectionObserver adds `data-revealed` (once). Items have `--d` delay (ms) and `--tilt` (deg). Effects: translateY + opacity, sketch outline `stroke-dashoffset` draw, photo `clip-path: circle(0% at 50% 55%) → circle(100%…)`. `data-armed` set by JS after hydration so no-JS users see content. Hook: `useReveal(ref, {threshold:.2})` or a single `<Reveal>` component.

## 4. Pinned horizontal scroll ("meet the pups")
`[data-pin-range]` wrapper is tall (≈ track width + 100vh) with a `position: sticky; top: header` stage inside. A scroll listener maps progress → `--pinned` (0..1) on the wrapper; the track `translateX(calc(var(--pinned) * -(trackW - viewportW)))`. `data-treadmill` marks the track. Doors open (`data-open=true` → `rotateY(var(--door-open))`) as they pass the centre. Mobile ≤767px: skip pinning (native overflow-x scroll-snap).

## 5. Chat scene (`data-step`)
Three message groups; an IntersectionObserver/scroll threshold on each step list item sets the current step; groups with `data-show=true` animate in with `tp-msg-in` (translateY .8rem, scale .92 → 1, opacity); typing indicator `tp-dot` shows between groups.

## 6. Stamps / notes / letter micro-animations
`tp-stamp-in` (scale 1.7, rotate −16° → rest, thump `tp-stamp-thump`), FAQ notes (`tp-note` flap `tp-flap`, chevron, pin), contact letter (`tp-letter-fold` → `tp-env-in` → `tp-env-post` → `tp-box-up`/`tp-flag` → `tp-sent-in` success). Tag swing on doors (`tp-tag-swing/nudge`). Poster/step entrances (`tp-poster-in`, `tp-step-in`). Plane bob (`tp-plane-bob`). Float (`tp-float`). Breathing (`tp-breathe`), blinking (`tp-blink-open/shut`), ear twitch (`tp-ear-twitch`), doodle hop (`tp-doodle-hop`), paw pat (`tp-paw-pat`).

All 46 keyframes: `docs/reference-keyframes.css`. Rebuild them in our own CSS; don't paste wholesale.

## 7. Mascot "Teddy" (hardest part — do last, or simplify)
- One inline SVG, `viewBox="0 0 300 240"`, rig groups addressed by `data-p`: `root, shadow, body, bf/ff/bn/bf (legs), tail, head, ears, eyes, mouth, tongue …` (see `docs/reference-svg/*.svg`, 9 instances all identical markup).
- Fur `#e4a352`, outline `#2a170e` (stroke 3.4), blush `#f9b9a6`, nose/inner `#a24a1a`, `#f2be6b`, `#fbe3b4`.
- **Pose = a parameter object** applied as SVG transforms: `bodyRot, bodyX, bodyY, stretch, headX, headY, headRot, earL, earR, tail, fn, ff, bn, bf (leg angles), sit, eyes, happy, tongue, mouth, front`. Named poses: `stand, walk, sit, peek, snug, lie, sleep, settle, hop, sniff, bow, beg` (numbers in `reference-mascot-rig.txt`).
- **Acts** are timelines `[[t, () => …]]` with helpers `setPose, face(±1), dash(x), wag(amt), jolt, hop, yawn, hearts()` and a speech bubble (`.pup-bubble`, `data-show`): `peekaboo`("peekaboo!"), `wake`("*yaaawn*", "five more minutes…", "zzz"), `bow`("play with me!"), `hop`("boing!"), `beg`("treat, please?"), `love`("I like you!"), `tilt`, `spin`("wheee!"), `sneeze`, `woof`, `zoomies`.
- Each scene has a **stop** (`data-pup-stop` + `data-pose`, `data-facing`, `data-act`); a global **`.pup-layer`** actor walks (`pup-prints` footprints, `walk` pose with stride/phase) from the current stop to the next as the user scrolls, then plays that stop's act. Clicking/hovering the mascot (or "friends" `data-pup-friend`, "look" targets `data-pup-look`) triggers reactions (heart particles ♥ via Web Animations API).
- **Build plan:** (a) MVP — static SVG teddy per scene with CSS wag/blink and a speech bubble; (b) stretch — port the pose-param system as `useMascot()` and the walking layer. Prioritise (a); mention (b) honestly in the Loom.

## 8. Reduced motion & touch
Everything above wrapped in `@media (prefers-reduced-motion: no-preference)`; `(hover:hover) and (pointer:fine)` for hover-only effects; mobile (`max-width:767px`) simplifies pinned scenes and mascot walking (`(pointer:coarse) and (max-height:519px)` also reduces).

## 9. Data attributes seen on the page (cheat-sheet)
`data-section` (hero…), `data-pup-scene`, `data-tone`, `data-pup-stop`, `data-pose`, `data-facing`, `data-act`, `data-behind`, `data-lane`, `data-pup-friend`, `data-pup-look`, `data-reveal/armed/revealed`, `data-pin-range`, `data-treadmill`, `data-step`, `data-show`, `data-open`, `data-active`, `data-scrolled/hidden/home`, `data-whatsapp-bar`, `data-lenis-prevent`, `data-state`, `data-for`, `data-done`, `data-page`.
