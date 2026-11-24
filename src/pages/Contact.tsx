import { useEffect, useRef } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { WA_LINK } from "../data/site";
import { submitEnquiry, validateEnquiry } from "../lib/submitEnquiry";
import ContactMarkup from "./markup/ContactMarkup";

const SCENE = `<div aria-hidden="true" class="tp-post__scene">
<svg viewBox="0 0 160 112" class="tp-post__envelope"><rect x="4" y="18" width="152" height="90" rx="6" fill="#fffdf8" stroke="#2a170e" stroke-width="4"/><path d="M6 104 64 62M154 104 96 62" fill="none" stroke="#2a170e" stroke-width="3" stroke-linecap="round"/><path class="tp-post__flap" d="M6 22 80 74 154 22" fill="#fbe3b4" stroke="#2a170e" stroke-width="4" stroke-linejoin="round"/><circle cx="80" cy="72" r="11" fill="#a24a1a" stroke="#2a170e" stroke-width="3"/></svg>
<svg viewBox="0 0 200 260" class="tp-post__box"><rect x="86" y="170" width="28" height="86" fill="#5a3a28" stroke="#2a170e" stroke-width="4"/><path d="M30 70a70 54 0 0 1 140 0v104H30z" fill="#c2622b" stroke="#2a170e" stroke-width="5" stroke-linejoin="round"/><rect x="58" y="86" width="84" height="14" rx="7" fill="#2a170e"/><path d="M44 128h112" stroke="#2a170e" stroke-width="3" stroke-linecap="round" opacity=".35"/><g class="tp-post__flag"><path d="M170 120V64" stroke="#2a170e" stroke-width="5" stroke-linecap="round"/><path d="M170 64h22v16h-22" fill="#f2be6b" stroke="#2a170e" stroke-width="4" stroke-linejoin="round"/></g></svg></div>`;

const SENT = `<div tabindex="-1" role="status" class="tp-post__sent">
<svg viewBox="0 0 200 150" aria-hidden="true" class="tp-post__box tp-post__box--sent"><rect x="86" y="96" width="28" height="52" fill="#5a3a28" stroke="#2a170e" stroke-width="4"/><path d="M30 50a70 44 0 0 1 140 0v52H30z" fill="#c2622b" stroke="#2a170e" stroke-width="5" stroke-linejoin="round"/><rect x="58" y="58" width="84" height="12" rx="6" fill="#2a170e"/><path d="M170 92V22" stroke="#2a170e" stroke-width="5" stroke-linecap="round"/><path d="M170 22h22v16h-22" fill="#f2be6b" stroke="#2a170e" stroke-width="4" stroke-linejoin="round"/></svg>
<p class="font-plush mt-4 text-[2rem]">Message received!</p>
<p class="mx-auto mt-2 max-w-[40ch] text-cocoa-soft">Thank you — our team will get back to you promptly. For the quickest reply, message us on WhatsApp.</p>
<a href="${WA_LINK}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp mt-6">WhatsApp us</a></div>`;

/** Letter-style contact form: validate, "seal the envelope", post, show the confirmation. */
export default function Contact() {
  usePageMeta();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const post = ref.current?.querySelector<HTMLElement>(".tp-post");
    const form = post?.querySelector<HTMLFormElement>("form");
    if (!post || !form) return;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const timers: number[] = [];
    let busy = false;

    const clearErrors = () => {
      form.querySelector(".tp-letterform__alert")?.remove();
      form.querySelectorAll("[aria-invalid]").forEach((i) => { i.removeAttribute("aria-invalid"); i.removeAttribute("aria-describedby"); });
    };
    const showErrors = (errs: Record<string, string>, message: string) => {
      clearErrors();
      const alert = document.createElement("div");
      alert.setAttribute("role", "alert");
      alert.className = "tp-letterform__alert";
      const p = document.createElement("p");
      p.className = "font-semibold";
      p.textContent = message;
      alert.appendChild(p);
      const ul = document.createElement("ul");
      for (const [k, v] of Object.entries(errs)) {
        const li = document.createElement("li");
        li.id = `${k}-err`;
        li.textContent = v;
        ul.appendChild(li);
        const input = form.elements.namedItem(k) as HTMLInputElement | null;
        input?.setAttribute("aria-invalid", "true");
        input?.setAttribute("aria-describedby", `${k}-err`);
      }
      if (ul.children.length) alert.appendChild(ul);
      form.querySelector(".tp-letterform__greeting")?.after(alert);
      form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    };

    const finish = () => {
      post.style.minHeight = "";
      post.dataset.phase = "sent";
      post.innerHTML = SENT;
      const s = post.querySelector<HTMLElement>(".tp-post__sent")!;
      s.focus({ preventScroll: true });
      const top = s.getBoundingClientRect().top;
      const header = 16 * parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76;
      if (top < header + 8) scrollBy({ top: top - header - 24, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };

    const onSubmit = async (e: SubmitEvent) => {
      e.preventDefault();
      if (busy) return;
      const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
      if (data.website) return finish(); // honeypot: pretend success
      const errs = validateEnquiry(data);
      if (Object.keys(errs).length) return showErrors(errs, "Almost there — a few blanks need filling in.");
      clearErrors();
      busy = true;
      button.disabled = true;
      button.textContent = "Sealing the envelope…";
      try {
        await submitEnquiry(data);
      } catch (err) {
        busy = false;
        button.disabled = false;
        button.textContent = "Post my letter";
        return showErrors({}, err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
      post.style.minHeight = post.offsetHeight + "px";
      post.dataset.phase = "sealing";
      form.setAttribute("aria-hidden", "true");
      form.inert = true;
      post.insertAdjacentHTML("beforeend", SCENE);
      timers.push(window.setTimeout(() => (post.dataset.phase = "posting"), 750));
      timers.push(window.setTimeout(finish, 1750));
    };
    form.addEventListener("submit", onSubmit);
    return () => { form.removeEventListener("submit", onSubmit); timers.forEach(clearTimeout); };
  }, []);

  return (
    <div ref={ref}>
      <ContactMarkup />
    </div>
  );
}
