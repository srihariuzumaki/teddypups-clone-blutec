# THEME — design tokens (extracted from the reference CSS)

Ready-to-use CSS variables are in [`tokens.css`](./tokens.css). Everything below was read from the reference's compiled stylesheet (Tailwind v4 + hand-written `tp-*` classes). Re-derive values from the live site / screenshots when something looks off.

## Fonts (self-hosted via next/font in the original)
| Role | Family | Weights | Use |
|---|---|---|---|
| Display / headings | **Fraunces** (serif, variable 100–900) | 600–800 | h1/h2/h3, big hero title (`clamp(2.6rem, min(9.2vw,11vh), 8.4rem)`, max-width 15ch) |
| Body / UI | **Figtree** (sans, variable 300–900) | 400–700 (nav links 620, buttons 650) | body 1.0625rem/1.6 |
| Handwriting | **Shantell Sans** (`--font-hand`) | 400–700 | kickers like "every puppy is family", "puppy passport", "sniff out a question", doodle notes, form letter |

Get them from Google Fonts / `@fontsource-variable/fraunces`, `@fontsource-variable/figtree`, `@fontsource-variable/shantell-sans`. Fallbacks: Fraunces → Georgia/serif, Figtree → system-ui, Shantell → ui-rounded/"Comic Sans MS".

## Palette
| Token | Hex | Notes |
|---|---|---|
| `--color-milk` | `#fffdf8` | page bg, light text on dark scenes |
| `--color-honey-soft` | `#fbe3b4` | |
| `--color-honey` | `#f2be6b` | "me" chat bubble, sun glow |
| `--color-toffee` | `#c2622b` | brand accent, accent underline (55% mix) |
| `--color-toffee-deep` | `#a24a1a` | primary button bg, active nav, `accent-color` |
| `--color-toffee-ink` | `#8e3f15` | link text |
| `--color-cocoa` | `#2a170e` | body text, outlines (3px "sketch" borders), shadows |
| `--color-cocoa-soft` | `#5a3a28` | secondary text |
| `--color-sky` | `#bfddf5` | flight / sky illustrations |
| `--color-sky-deep` | `#2f6e9e` | |
| `--color-blush` | `#f9cdbf` | |
| WhatsApp green | `#1f7a4d` (text `#fff`) | `.btn-whatsapp`; success tint `#e3f4e8`, dark `#1f5d3a` |
| Error | `#b3261e` (dark `#8a1c14`, tint `#fde7e5`) | form validation |
| Misc warm | `#fff8ea #fff1d8 #ffd27f #fbf7f0 #dc9a52 #d38f45 #b2733f #c99a62 #f6d79a #3b2215 #3a2114` | paper / note / door fills |

### Scene sky gradients (home page, top → bottom of each `section.tp-scene`, `background: linear-gradient(to bottom, top, bottom)`)
| # | Class | Top | Bottom | Tone |
|---|---|---|---|---|
| 1 | `tp-hero` | `#fffdf8` | `#fff1d8` | light |
| 2 | `tp-meet` | `#fff1d8` | `#fbe3b4` | light |
| 3 | `tp-paths` | `#fbe3b4` | `#f7d18d` | light |
| 4 | `tp-chat` | `#f7d18d` | `#f0b866` | light |
| 5 | `tp-passport` | `#f0b866` | `#a65a30` | light |
| 6 | `tp-dusk` | `#a65a30` | `#4d2b19` | **dark** |
| 7 | `tp-night` | `#4d2b19` | `#2f1a10` | **dark** |
| 8 | `tp-home` | `#2f1a10` | `#24130b` | **dark** |
| footer | `tp-footer` | `#24130b` (`--night`) | | dark, with SVG "hill" edge on top |

`data-tone="dark"` flips `--ink` to milk and `--ink-soft` to 80% milk; ghost buttons become milk-outlined.

## Layout / spacing
- `--gutter: clamp(1rem, 4vw, 3.5rem)` → `.gutter { padding-inline: var(--gutter) }`
- `--header-h: 4.75rem` (4rem ≤ 767px) · `--bar-h: 0` (4rem + safe-area ≤ 767px)
- Tailwind spacing base `.25rem`; containers up to 80rem (`max-w-7xl`); radius `1rem / 1.5rem`, pills `999px`.
- Tailwind v4 default type scale (xs .75 → 4xl 2.25rem), leading-tight 1.25, snug 1.375.

## Easing
| Name | Value | Use |
|---|---|---|
| `--ease-pounce` | `cubic-bezier(.34,1.56,.64,1)` | springy overshoot: buttons, tilt, tickets, notes |
| `--ease-silk` | `cubic-bezier(.22,1,.36,1)` | smooth: header, menus, shadows |
| `--ease-snap` | `cubic-bezier(.7,0,.2,1)` | decisive: curtain, doors |

## Components (visual spec)
- **Button `.btn`**: pill, min-h 3.25rem, padding `.85rem 1.6rem`, 1.0625rem/650. `:active scale(.96)`.
  - `primary`: bg toffee-deep, text milk, **hard offset shadow** `0 .5rem 0 -.15rem cocoa`; hover → shadow `.7rem`, `translateY(-2px) rotate(-1deg)`.
  - `ghost`: transparent, `2px solid cocoa`, hover fills cocoa/milk.
  - `whatsapp`: bg `#1f7a4d`, white, same hard shadow, hover `rotate(1deg)`.
- **Header**: fixed, z-50; `::before` milk layer fades in (opacity 0→1) when `data-scrolled=true` or not home; hem line (`tp-header__hem`) under bar; hides with `translateY(-120%)` in .5s silk. Nav link: 1rem/620 cocoa, hover toffee-ink + paw icon fades in (opacity .45, scale 1), active toffee-deep. WhatsApp button hidden until ≥ md (`min-height 2.75rem`, `.95rem`).
- **Sketch card `.tp-sketch`** (catalogue / meet): square frame, random `--tilt` (±1.5°) rotates, hand-drawn blob SVG "wash" behind (colour `--wash`), photo masked by an organic blob `mask-image`, outline path draws in (stroke-dashoffset) on reveal, photo reveals `clip-path: circle(0% → 100% at 50% 55%)`. Staggered `--d` delay. Hover: rotate straightens with pounce ease.
- **Ticket `.tp-ticket`** (gone-home): paper ticket with perforation, "one ticket home / admit one", name + breed·sex, "TeddyPups home ♥" or "Dubai showroom home ♥"; tilted by `--tilt`, straightens on hover; stamp `tp-stamp-in`.
- **Note `.tp-note`** (FAQ): paper `linear-gradient(#fffcf3,#fff5e2)`, `3px solid cocoa`, radius .5rem, shadow `4px 7px rgba(42,23,14,.25)`, folded corner bottom-right (`clip-path` triangle, gradient `#f0dcb6/#c99a62`), alternating `--shift ±.5rem`, pin on top.
- **Chat bubbles `.tp-msg`**: `2px solid cocoa`, radius 1.05rem, `.5rem .75rem`, .88rem/1.38; `--me` honey bg right-aligned with small bottom-right radius; `--them` paper bg left. Enter anim `tp-msg-in`.
- **Footer**: night bg, hill SVG, 12-col grid (brand blurb · Explore nav · Say hello contacts · socials), "© 2026 TeddyPups U.A.E. every puppy is family".

## Reduced motion
Wrap all non-essential animation in `@media (prefers-reduced-motion: no-preference)`; reduce → show final state.
