import { useState, type FormEvent } from "react";
import { waFor } from "../../data/site";

interface Props {
  id?: string;
  puppyName?: string;
  breed?: string;
  heading: string;
}

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

/** Mock submit (no backend): validates, then shows the success state. See docs/ARCHITECTURE.md for real options. */
export default function EnquiryForm({ id, puppyName, breed, heading }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const defaultMsg = puppyName ? `Hi! I'd love to know more about ${puppyName}${breed ? ` (${breed})` : ""}.` : "";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return; // honeypot
    const name = String(f.get("name") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    const email = String(f.get("email") || "").trim();
    const next: Errors = {};
    if (name.length < 2) next.name = "Please tell us your name.";
    if (!/^\+?[\d\s()-]{7,}$/.test(phone)) next.phone = "Add a phone number with country code.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = "That email doesn't look right.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="tp-form tp-form--sent" id={id} role="status">
        <p className="tp-form__thanks">Letter posted! 💌</p>
        <p>Thank you — our team will get back to you promptly. For the quickest reply, message us on WhatsApp.</p>
        <a className="btn btn-whatsapp" href={waFor(defaultMsg || "Hi TeddyPups!")} target="_blank" rel="noreferrer">Open WhatsApp</a>
      </div>
    );
  }
  return (
    <form className="tp-form" id={id} onSubmit={onSubmit} noValidate>
      <h3 className="tp-form__title">{heading}</h3>
      <p className="tp-form__lede">Leave your details and our team will get back to you promptly — or message us on WhatsApp for the quickest reply.</p>
      <label className="tp-field">Your name *
        <input name="name" autoComplete="name" aria-invalid={!!errors.name} />
        {errors.name && <span className="tp-field__err">{errors.name}</span>}
      </label>
      <label className="tp-field">Phone or WhatsApp *
        <input name="phone" type="tel" autoComplete="tel" placeholder="With country code, e.g. +971 50 123 4567" aria-invalid={!!errors.phone} />
        {errors.phone && <span className="tp-field__err">{errors.phone}</span>}
      </label>
      <label className="tp-field">Email (optional)
        <input name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} />
        {errors.email && <span className="tp-field__err">{errors.email}</span>}
      </label>
      <label className="tp-field">Your area (optional)
        <input name="area" placeholder="e.g. Dubai Marina" />
      </label>
      <label className="tp-field">Message (optional)
        <textarea name="message" rows={3} defaultValue={defaultMsg} />
      </label>
      <label className="tp-hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="btn btn-primary" type="submit">Send enquiry</button>
    </form>
  );
}
