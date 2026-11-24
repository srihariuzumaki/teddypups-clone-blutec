/**
 * Sends an enquiry. If VITE_WEB3FORMS_KEY (Web3Forms) or VITE_FORM_ENDPOINT (Formspree / any JSON endpoint) is set the data is POSTed
 * there; otherwise it is a mock that resolves after a short delay (the original posts to its own backend).
 */
export async function submitEnquiry(data: Record<string, string>): Promise<void> {
  const key = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined; // Web3Forms access keys are public by design
  const url = (import.meta.env.VITE_FORM_ENDPOINT as string | undefined) || (key ? "https://api.web3forms.com/submit" : undefined);
  if (!url) {
    await new Promise((r) => setTimeout(r, 450));
    return;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(
      key
        ? { ...data, access_key: key, subject: "TeddyPups enquiry", from_name: "TeddyPups website" }
        : { ...data, _subject: "TeddyPups enquiry" },
    ),
  });
  if (!res.ok) throw new Error("Could not send your letter. Please try WhatsApp instead.");
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
