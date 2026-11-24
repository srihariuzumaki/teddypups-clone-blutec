import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { available, gone, findPuppy, type Puppy } from "../data/puppies";
import extra from "../data/detail-extra.json";
import focal from "../data/focal.json";
import { WA_LINK, waFor } from "../data/site";
import { submitEnquiry, validateEnquiry, type FieldErrors } from "../lib/submitEnquiry";
import { usePageMeta } from "../lib/usePageMeta";
import Teddy from "../components/ui/Teddy";
import { PAW_D } from "../components/layout/pawPath";
import NotFound from "./NotFound";

type Item = { kind: "photo" | "video"; src: string; poster?: string };

const sexWord = (s: Puppy["sex"]) => (s === "boy" ? "male" : s === "girl" ? "female" : "");
const imgAlt = (p: Puppy) =>
  p.isNamed ? `${p.name}, ${sexWord(p.sex)} ${p.breed} puppy`.replace(/ {2}/g, " ") : `${sexWord(p.sex) ? sexWord(p.sex)[0].toUpperCase() + sexWord(p.sex).slice(1) + " " : ""}${p.breed} puppy`;

/** Photos first, then videos; a video's poster frame is not repeated as a photo. */
function itemsOf(p: Puppy): Item[] {
  const base = (u: string) => u.split("/").pop()!.replace(/\.[a-z0-9]+$/i, "");
  const posters = new Map(p.videos.map((v) => [base(v), p.gallery.find((g) => base(g).startsWith(base(v)))]));
  const posterSet = new Set([...posters.values()]);
  const photos = p.gallery.filter((g) => !posterSet.has(g)).map<Item>((src) => ({ kind: "photo", src }));
  const videos = p.videos.map<Item>((src) => ({ kind: "video", src, poster: posters.get(base(src)) }));
  return [...photos, ...videos];
}

const fp = (src?: string): React.CSSProperties | undefined => {
  const pos = src ? (focal as Record<string, string>)[src] : undefined;
  return pos ? { objectPosition: pos } : undefined;
};

const TRAIL = [
  ["Reserve your puppy", "Tell us which puppy has captured your heart."],
  ["Personalized consultation", "We finalize details with you and share updates on your puppy's journey."],
  ["Import and arrival", "We manage health checks, travel arrangements, and documentation."],
  ["Welcome home", "We help your new puppy settle in and ensure a smooth transition into your home."],
];
const INCLUDED = ["Vaccinated", "Dewormed", "Verified health certificate from licensed vets", "Thoroughly checked before joining your family"];

const Tick = () => (
  <svg viewBox="0 0 32 32" className="mt-0.5 size-6 shrink-0 text-toffee-deep" aria-hidden="true">
    <path d="M5 17l7 7L27 8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Media({ item, alt, eager, contain }: { item: Item; alt: string; eager?: boolean; contain?: boolean }) {
  const cls = `size-full ${contain ? "object-contain" : "object-cover"}`;
  return item.kind === "video" ? (
    <video src={item.src} poster={item.poster} style={fp(item.poster)} className={cls} loop playsInline autoPlay muted={!contain} controls={contain} aria-label={`Video of ${alt}`} />
  ) : (
    <img src={item.src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={cls} style={contain ? undefined : fp(item.src)} />
  );
}

export default function PuppyDetail() {
  const { slug } = useParams();
  const pup = findPuppy(slug);
  if (!pup) return <NotFound />;
  return <Detail key={pup.slug} pup={pup} />;
}

function Detail({ pup }: { pup: Puppy }) {
  const isGone = pup.status === "gone";
  const ex = (extra as Record<string, { bg?: string; colour?: string | null }>)[pup.slug] ?? {};
  const items = itemsOf(pup);
  const n = items.length;
  const label = (i: number) => `${pup.name}, ${items[i].kind} ${i + 1} of ${n}`;
  const [at, setAt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const article = useRef<HTMLElement>(null);
  const band = useRef<HTMLSpanElement>(null);
  const drag = useRef<number | null>(null);

  usePageMeta(pup.title, pup.description);
  const go = useCallback((d: number) => setAt((a) => (a + d + n) % n), [n]);

  // reading-progress ribbon
  useEffect(() => {
    const el = article.current, b = band.current;
    if (!el || !b) return;
    const update = () => {
      const top = el.getBoundingClientRect().top + scrollY;
      const range = Math.max(1, el.offsetHeight - (innerHeight - top));
      const p = Math.min(1, Math.max(0, scrollY / range));
      b.style.transform = p >= 1 ? "none" : `scaleY(${(0.103743 + 0.896257 * p).toFixed(6)})`;
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => { removeEventListener("scroll", update); removeEventListener("resize", update); };
  }, []);

  // dialog keyboard / backdrop
  useEffect(() => {
    const d = dialog.current!;
    const onKey = (e: KeyboardEvent) => {
      if (!d.open) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const onClose = () => window.__lenis?.start();
    const onBackdrop = (e: MouseEvent) => e.target === d && d.close();
    addEventListener("keydown", onKey);
    d.addEventListener("close", onClose);
    d.addEventListener("click", onBackdrop);
    return () => { removeEventListener("keydown", onKey); d.removeEventListener("close", onClose); d.removeEventListener("click", onBackdrop); };
  }, [go]);

  const openDialog = () => { dialog.current?.showModal(); window.__lenis?.stop(); };
  const swipe = {
    onPointerDown: (e: React.PointerEvent) => (drag.current = e.clientX),
    onPointerUp: (e: React.PointerEvent) => {
      if (drag.current == null) return;
      const dx = e.clientX - drag.current;
      drag.current = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    },
  };

  const group = isGone ? gone : available;
  const idx = group.findIndex((p) => p.slug === pup.slug);
  const prev = group[(idx - 1 + group.length) % group.length];
  const next = group[(idx + 1) % group.length];

  const waText = isGone ? "Hi! I'd love to find a puppy like this one." : `Hi! I'd love to know more about ${pup.name}${pup.isNamed ? ` (${pup.breed})` : ""}.`;
  const askName = isGone ? "a puppy like this" : pup.isNamed ? pup.name : "this puppy";
  const nameForPaper = pup.isNamed ? pup.name : `this ${pup.breed}`;
  const where = pup.origin === "local" ? "In Dubai" : "Imported for you";
  const facts: [string, string][] = [
    ["Breed", pup.breed],
    ["Boy or girl", pup.sex === "boy" ? "Boy" : pup.sex === "girl" ? "Girl" : "Boy & girl"],
    ["Age", pup.age],
    ...(ex.colour ? ([["Colour", ex.colour]] as [string, string][]) : []),
    ["Where", where],
  ];
  const enquireId = `enquire-${pup.slug}`;
  let chapter = 2;

  return (
    <div data-page="pup" className="tp-page">
      <article
        ref={article}
        className="tp-storybook"
        style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${ex.bg ?? "#e8d8c8"} 24%, var(--color-milk)) 0, var(--color-milk) 85%)` }}
      >
        <div aria-hidden="true" className="tp-ribbon">
          <div className="tp-ribbon__track">
            <span ref={band} className="tp-ribbon__band" style={{ transform: "scaleY(0.103743)" }} />
          </div>
        </div>
        <div className="gutter mx-auto max-w-[110rem] pb-20 pt-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="text-[0.95rem] font-semibold text-cocoa-soft">
            <Link className="link-ink" to={isGone ? "/gone-home" : "/puppies"}>{isGone ? "Gone home" : "Available puppies"}</Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{pup.name}</span>
          </nav>
          <p className="tp-chapter">
            <span aria-hidden="true" className="tp-chapter__n font-plush">1</span>
            <span className="font-scrawl">{isGone ? "the day they went home" : "hello, it's me"}</span>
          </p>
          <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-7">
              <div>
                <div className="tp-storypage relative aspect-[4/5] md:aspect-[5/6]">
                  <button type="button" className="absolute inset-0 block size-full" aria-label={`Open ${label(at)} full screen`} onClick={openDialog} {...swipe}>
                    <Media key={at} item={items[at]} alt={imgAlt(pup)} eager />
                  </button>
                  {n > 1 && (
                    <div className="absolute inset-x-4 bottom-4 flex justify-between">
                      <button type="button" className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold" aria-label="Previous photo" onClick={() => go(-1)}>‹</button>
                      <span className="self-center rounded-full bg-cocoa/80 px-3 py-1 text-sm font-semibold text-milk">{at + 1} / {n}</span>
                      <button type="button" className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold" aria-label="Next photo" onClick={() => go(1)}>›</button>
                    </div>
                  )}
                </div>
                {n > 1 && (
                  <ul className="mt-3 flex gap-3 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:thin]" aria-label={`All photos of ${pup.name}`}>
                    {items.map((it, i) => (
                      <li key={it.src} className="shrink-0">
                        <button
                          type="button"
                          aria-label={label(i)}
                          aria-current={i === at}
                          onClick={() => setAt(i)}
                          className={`relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 ${i === at ? "-rotate-3 -translate-y-1 border-toffee-deep" : "border-cocoa/30 hover:-rotate-2 hover:border-cocoa"}`}
                        >
                          <img src={it.kind === "video" ? it.poster : it.src} alt="" loading="lazy" decoding="async" className="size-full object-cover" style={fp(it.kind === "video" ? it.poster : it.src)} />
                          {it.kind === "video" && <span className="absolute inset-0 grid place-items-center bg-cocoa/30 text-lg text-milk">▶</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <dialog ref={dialog} aria-label={`${pup.name} photos`} data-lenis-prevent="true" className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <p className="font-scrawl text-lg">{label(at)}</p>
                      <button type="button" className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa" onClick={() => dialog.current?.close()}>Close</button>
                    </div>
                    <div className="relative flex-1 touch-pan-y">
                      <div className="absolute inset-0" draggable={false} style={{ userSelect: "none", touchAction: "pan-y" }} {...swipe}>
                        <Media key={at} item={items[at]} alt={imgAlt(pup)} contain eager />
                      </div>
                    </div>
                    <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                      <button type="button" className="h-12 rounded-full border-2 border-milk px-6 font-semibold" onClick={() => go(-1)}>Previous</button>
                      <button type="button" className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa" onClick={() => go(1)}>Next</button>
                    </div>
                  </div>
                </dialog>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-5">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+5.5rem)]">
                <div className="tp-tag tp-board mt-16 !rounded-[2.2rem_2.2rem_2.2rem_0.6rem] !p-7 md:!p-9 lg:mt-20" data-reveal="true">
                  <span aria-hidden="true" className="tp-tag__ring" />
                  <Teddy className="absolute -top-[4.8rem] right-6 w-[9.5rem]" label={isGone ? "Teddy, congratulating the family" : "Teddy, hoping you'll pick a pup"} />
                  {isGone ? (
                    <span className="inline-grid place-items-center rounded-full border-[3px] border-current px-3 py-1 font-scrawl text-sm uppercase tracking-wide -rotate-6 text-toffee-deep">Gone home ♥</span>
                  ) : (
                    <span className="chip">
                      <svg viewBox="0 0 64 64" className="size-4 text-toffee" aria-hidden="true" fill="currentColor"><path d={PAW_D} /></svg>
                      Available
                    </span>
                  )}
                  <h1 className="font-plush mt-4 text-[clamp(2.6rem,5vw,4.6rem)]">{pup.name}</h1>
                  {pup.isNamed && <p className="mt-2 text-lg font-semibold text-cocoa-soft">{pup.breed}</p>}
                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
                    {facts.map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-scrawl text-sm text-cocoa-soft">{k}</dt>
                        <dd className="mt-0.5 text-[1.05rem] font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-8 flex flex-col gap-3">
                    <a href={waFor(waText)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      {isGone ? "Ask about a puppy like this" : `Ask about ${askName} on WhatsApp`}
                    </a>
                    <a href={`#${enquireId}`} className="btn btn-ghost">Send an enquiry</a>
                  </div>
                </div>
                <div className="tp-paper mt-8 -rotate-1">
                  <p className="tp-chapter">
                    <span aria-hidden="true" className="tp-chapter__n font-plush">{chapter++}</span>
                    <span className="font-scrawl">what comes with {nameForPaper}</span>
                  </p>
                  <h2 className="font-plush mt-1 text-[1.9rem]">Every Teddy Pup comes</h2>
                  <ul className="mt-4 space-y-2.5">
                    {INCLUDED.map((t) => (
                      <li key={t} className="flex items-start gap-3 font-semibold"><Tick />{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {!isGone && pup.origin === "imported" && (
            <section aria-labelledby={`home-steps-${pup.slug}`} className="mt-20">
              <p className="tp-chapter">
                <span aria-hidden="true" className="tp-chapter__n font-plush">{chapter++}</span>
                <span className="font-scrawl">the way home</span>
              </p>
              <h2 id={`home-steps-${pup.slug}`} className="font-plush text-big mt-3">Coming home from abroad</h2>
              <ol className="tp-trail tp-trail--row tp-trail--paws mt-10">
                {TRAIL.map(([t, d], i) => (
                  <li key={t}>
                    <span aria-hidden="true" className="tp-trail__num font-plush">{i + 1}</span>
                    <h3 className="font-plush-text text-xl font-bold leading-tight">{t}</h3>
                    <p className="mt-2 max-w-[38ch] text-cocoa-soft">{d}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <EnquirySection pup={pup} id={enquireId} chapter={chapter} isGone={isGone} />

          <nav aria-label="More puppies" className="mt-16 grid gap-4 sm:grid-cols-2">
            {[[prev, "Previous pup"], [next, "Next pup"]].map(([p, l]) => (
              <Link key={(p as Puppy).slug} to={`/puppies/${(p as Puppy).slug}`} className="group flex items-center gap-5 rounded-[2rem] border-[3px] border-cocoa bg-milk p-4 transition-transform duration-500 hover:-rotate-1 sm:last:flex-row-reverse sm:last:text-right">
                <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[999px_999px_0.6rem_0.6rem] border-[3px] border-cocoa bg-honey-soft">
                  <img src={(p as Puppy).image} alt={imgAlt(p as Puppy)} loading="lazy" decoding="async" className="size-full object-cover" style={fp((p as Puppy).image)} />
                </span>
                <span>
                  <span className="font-scrawl block text-sm text-cocoa-soft">{l as string}</span>
                  <span className="font-plush text-[1.6rem]">{(p as Puppy).name}</span>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </article>
    </div>
  );
}

const INPUT = "mt-1.5 h-12 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 text-base outline-none transition-[border-color,box-shadow] focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)] aria-[invalid=true]:border-[#b3261e]";

function EnquirySection({ pup, id, chapter, isGone }: { pup: Puppy; id: string; chapter: number; isGone: boolean }) {
  const [errors, setErrors] = useState<FieldErrors & { form?: string }>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const msg = `Hi! I'd love to know more about ${pup.name}${pup.isNamed ? ` (${pup.breed})` : ""}.`;
  const title = isGone ? "Looking for a puppy like this?" : pup.isNamed ? `Ask about ${pup.name}` : "Ask about this puppy";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (data.website) return setState("sent");
    const errs = validateEnquiry(data);
    setErrors(errs);
    if (Object.keys(errs).length) {
      (e.currentTarget.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus();
      return;
    }
    setState("sending");
    try {
      await submitEnquiry({ ...data, puppy: pup.slug });
      setState("sent");
    } catch (err) {
      setState("idle");
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong." });
    }
  };

  const field = (name: keyof FieldErrors, label: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) => (
    <div>
      <label htmlFor={`${id}-${name}`} className="block text-[0.95rem] font-semibold">{label}</label>
      <input id={`${id}-${name}`} name={name} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${id}-${name}-err` : hint ? `${id}-${name}-hint` : undefined} className={INPUT} {...props} />
      {errors[name] ? <p id={`${id}-${name}-err`} className="mt-1 text-sm font-semibold text-[#b3261e]">{errors[name]}</p> : hint && <p id={`${id}-${name}-hint`} className="mt-1 text-sm text-cocoa-soft">{hint}</p>}
    </div>
  );

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="tp-letter mt-20 grid gap-10 lg:grid-cols-12">
      <span aria-hidden="true" className="tp-letter__stamp">
        <svg viewBox="0 0 64 64" className="size-9" aria-hidden="true" fill="currentColor"><path d={PAW_D} /></svg>
      </span>
      <div className="lg:col-span-4">
        <p className="tp-chapter">
          <span aria-hidden="true" className="tp-chapter__n font-plush">{chapter}</span>
          <span className="font-scrawl">dear TeddyPups…</span>
        </p>
        <h2 id={`${id}-title`} className="font-plush text-big mt-2">{title}</h2>
        <p className="mt-4 text-cocoa-soft">Leave your details and our team will get back to you promptly — or message us on WhatsApp for the quickest reply.</p>
      </div>
      <div className="lg:col-span-7 lg:col-start-6">
        {state === "sent" ? (
          <div role="status" className="tp-post__sent text-center">
            <p className="font-plush mt-4 text-[2rem]">Message received!</p>
            <p className="mx-auto mt-2 max-w-[40ch] text-cocoa-soft">Thank you — our team will get back to you promptly. For the quickest reply, message us on WhatsApp.</p>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">WhatsApp us</a>
          </div>
        ) : (
          <form noValidate className="space-y-5" onSubmit={onSubmit}>
            {errors.form && <p role="alert" className="font-semibold text-[#b3261e]">{errors.form}</p>}
            <div className="grid gap-5 sm:grid-cols-2">
              {field("name", <>Your name<span className="text-toffee-ink"> *</span></>, { autoComplete: "name", required: true, minLength: 2, maxLength: 80 })}
              {field("phone", <>Phone or WhatsApp<span className="text-toffee-ink"> *</span></>, { type: "tel", inputMode: "tel", autoComplete: "tel", required: true }, "With country code, e.g. +971 50 123 4567")}
              {field("email", <>Email<span className="font-normal text-cocoa-soft"> (optional)</span></>, { type: "email", autoComplete: "email" })}
              <div>
                <label htmlFor={`${id}-area`} className="block text-[0.95rem] font-semibold">Your area<span className="font-normal text-cocoa-soft"> (optional)</span></label>
                <input id={`${id}-area`} name="area" autoComplete="address-level2" maxLength={80} aria-describedby={`${id}-area-hint`} className={INPUT} />
                <p id={`${id}-area-hint`} className="mt-1 text-sm text-cocoa-soft">e.g. Dubai Marina</p>
              </div>
            </div>
            <input type="hidden" name="puppyId" value={pup.slug} />
            <div>
              <label htmlFor={`${id}-message`} className="block text-[0.95rem] font-semibold">Message <span className="font-normal text-cocoa-soft">(optional)</span></label>
              <textarea id={`${id}-message`} name="message" rows={4} maxLength={2000} defaultValue={msg} className="mt-1.5 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 py-3 text-base outline-none focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)]" />
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" name="website" defaultValue="" /></label>
            </div>
            <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full disabled:opacity-70 sm:w-auto">
              {state === "sending" ? "Sending…" : "Send enquiry"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
