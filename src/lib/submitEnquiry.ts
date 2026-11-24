/**
 * Sends an enquiry, trying the configured providers in order:
 *   1. EmailJS (VITE_EMAILJS_*): our own HTML template (docs/email/enquiry.html), so the owner gets a themed email.
 *   2. Web3Forms (VITE_WEB3FORMS_KEY) or any JSON endpoint (VITE_FORM_ENDPOINT): plain fallback if 1 fails or is unset.
 * With nothing configured it is a mock that resolves after a short delay (the original posts to its own backend).
 * All of these keys are public by design (they can only send to the owner's registered address).
 */
const env = import.meta.env as Record<string, string | undefined>;

const clean = (v: string | undefined, fallback = "Not given") => (v ?? "").trim() || fallback;

async function viaEmailJs(d: Record<string, string>): Promise<void> {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: env.VITE_EMAILJS_SERVICE_ID,
      template_id: env.VITE_EMAILJS_TEMPLATE_ID,
      user_id: env.VITE_EMAILJS_PUBLIC_KEY,
      template_params: {
        name: clean(d.name),
        phone: clean(d.phone),
        email: clean(d.email),
        reply_to: clean(d.email, ""),
        area: clean(d.area),
        puppy: clean(d.puppy, "Any puppy (not sure yet)"),
        message: clean(d.message, "(No message, just a hello.)"),
        wa_link: `https://wa.me/${(d.phone ?? "").replace(/\D/g, "")}`,
        time: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" }) + " (Dubai)",
      },
    }),
  });
  if (!res.ok) throw new Error(`EmailJS ${res.status}`);
}

async function viaJson(d: Record<string, string>): Promise<void> {
  const key = env.VITE_WEB3FORMS_KEY;
  const url = env.VITE_FORM_ENDPOINT || (key ? "https://api.web3forms.com/submit" : undefined);
  if (!url) throw new Error("no endpoint");
  const { puppyId: _id, website: _hp, ...rest } = d;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(
      key
        ? { ...rest, access_key: key, subject: "TeddyPups enquiry", from_name: "TeddyPups website" }
        : { ...rest, _subject: "TeddyPups enquiry" },
    ),
  });
  if (!res.ok) throw new Error(`endpoint ${res.status}`);
}

export async function submitEnquiry(data: Record<string, string>): Promise<void> {
  const emailJs = env.VITE_EMAILJS_SERVICE_ID && env.VITE_EMAILJS_TEMPLATE_ID && env.VITE_EMAILJS_PUBLIC_KEY;
  const fallback = env.VITE_WEB3FORMS_KEY || env.VITE_FORM_ENDPOINT;
  if (!emailJs && !fallback) {
    await new Promise((r) => setTimeout(r, 450));
    return;
  }
  try {
    if (emailJs) return await viaEmailJs(data);
    return await viaJson(data);
  } catch (err) {
    if (emailJs && fallback) {
      try { return await viaJson(data); } catch { /* fall through */ }
    }
    console.warn("Enquiry failed", err);
    throw new Error("Could not send your letter. Please try WhatsApp instead.");
  }
}

export type FieldErrors = Partial<Record<"name" | "phone" | "email", string>>;

export function validateEnquiry(d: Record<string, string>): FieldErrors {
  const e: FieldErrors = {};
  if ((d.name ?? "").trim().length < 2) e.name = "Please tell us your name.";
  const digits = (d.phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) e.phone = "Add a phone or WhatsApp number we can reach you on, with country code.";
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "That email doesn't look quite right.";
  return e;
}
