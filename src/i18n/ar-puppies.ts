/** Vocabulary and templates for the puppy-driven text (cards, detail pages, enquiry blurbs). Puppy names stay in Latin script. */
import raw from "../data/puppies.json";

export const BREEDS_AR: [string, string][] = [
  ["Korean Teacup Pomeranian", "بومرينيان تي كب كوري"],
  ["Korean Teacup Maltipoo", "مالتيبو تي كب كوري"],
  ["Korean Teacup Poodle", "بودل تي كب كوري"],
  ["Maltipoo & Cavapoo", "مالتيبو وكافابو"],
  ["Toy Poodle", "بودل تُوي"],
  ["Pomeranian", "بومرينيان"],
  ["Maltipoo", "مالتيبو"],
  ["Cavapoo", "كافابو"],
  ["Shih Tzu", "شيتزو"],
  ["Maltese", "مالطي"],
  ["Bichon", "بيشون"],
  ["Pomsky", "بومسكي"],
  ["Poodle", "بودل"],
];

const NAMES = new Set<string>();
for (const p of [...(raw as any).available, ...(raw as any).gone]) if (p.isNamed) NAMES.add(p.name);

const monthsAr = (n: string) => {
  const v = parseFloat(n);
  if (v === 1) return "شهر واحد";
  if (v === 2) return "شهران";
  if (Number.isInteger(v) && v >= 3 && v <= 10) return `${n} أشهر`;
  return `${n} شهرًا`;
};
const sexAr = (s: string) => ({ "boy & girl": "ذكر وأنثى", boy: "ذكر", girl: "أنثى", male: "ذكر", female: "أنثى" } as Record<string, string>)[s] ?? s;

/** Replace every known token (breeds, sexes, ages, status words) inside one phrase. Returns null if Latin words are left over. */
export function compose(s: string): string | null {
  let out = s;
  for (const [en, ar] of BREEDS_AR) out = out.split(en).join(ar);
  out = out
    .replace(/(\d+(?:\.\d+)?) months?/g, (_, n) => monthsAr(n))
    .replace(/\bboy & girl\b/gi, "ذكر وأنثى")
    .replace(/\b(boy|Boy)s?\b/g, (m) => (m.endsWith("s") ? "ذكور" : "ذكر"))
    .replace(/\b(girl|Girl)s?\b/g, (m) => (m.endsWith("s") ? "إناث" : "أنثى"))
    .replace(/\bavailable\b/g, "متاح")
    .replace(/\bwith video\b/g, "مع فيديو")
    .replace(/\bgone home\b/g, "وجد بيته")
    .replace(/\bimported\b/gi, "مستورد")
    .replace(/ & /g, " و")
    .replace(/, /g, "، ");
  const left = out.replace(/[A-Z][a-z]+/g, (w) => (NAMES.has(w) ? "" : w)).match(/[A-Za-z]{2,}/);
  return left ? null : out;
}

type Rule = [RegExp, (m: RegExpMatchArray) => string | null];
const c = (s: string) => compose(s);
const nameOr = (s: string) => c(s) ?? s;

export const RULES: Rule[] = [
  [/^(\d+) puppies? looking for a home$/, (m) => (m[1] === "1" ? "جرو واحد يبحث عن بيت" : `${m[1]} جراء تبحث عن بيت`)],
  [/^(\d+) notes? found$/, (m) => `تم العثور على ${m[1]} ملاحظات`],
  [/^No note about “(.*)” yet\.$/, (m) => `لا توجد ملاحظة عن «${m[1]}» بعد.`],
  [/^(\d+) notes on the board$/, (m) => `${m[1]} ملاحظات على اللوحة`],
  [/^(\d+) notes? match$/, (m) => `${m[1]} ملاحظات مطابقة`],
  [/^Open photo (\d+) of (\d+)(?:: (.+))?$/, (m) => `افتح الصورة ${m[1]} من ${m[2]}` + (m[3] ? `: ${PHRASE(m[3])}` : "")],
  [/^(.+), photo (\d+) of (\d+)$/, (m) => `${nameOr(m[1])}، الصورة ${m[2]} من ${m[3]}`],
  [/^(.+), video (\d+) of (\d+)$/, (m) => `${nameOr(m[1])}، الفيديو ${m[2]} من ${m[3]}`],
  [/^Open (.+), photo (\d+) of (\d+) full screen$/, (m) => `افتح ${nameOr(m[1])}، الصورة ${m[2]} من ${m[3]} بملء الشاشة`],
  [/^Photo (\d+) of (\d+)$/, (m) => `الصورة ${m[1]} من ${m[2]}`],
  [/^(\d+) \/ (\d+)$/, (m) => `${m[1]} / ${m[2]}`],
  [/^All photos of (.+)$/, (m) => `كل صور ${nameOr(m[1])}`],
  [/^(.+) photos$/, (m) => `صور ${nameOr(m[1])}`],
  [/^Ask about (.+) on WhatsApp$/, (m) => `اسأل عن ${nameOr(m[1])} على واتساب`],
  [/^Ask about (.+)$/, (m) => `اسأل عن ${nameOr(m[1])}`],
  [/^this (.+)$/, (m) => c(m[1]) && `هذا ${c(m[1])}`],
  [/^dear (.+)Pups…$/, () => "عزيزي تيدي بابس…"],
  [/^Every (.+) Pup comes$/, (m) => `كل جرو من ${m[1] === "Teddy" ? "تيدي" : nameOr(m[1])} يأتي مع`],
  [/^Hi! I'd love to know more about (.+)\.$/, (m) => `مرحبًا! أودّ معرفة المزيد عن ${PHRASE(m[1])}.`],
  [/^Hi TeddyPups! I'd love to know more about (.+)\.$/, (m) => `مرحبًا تيدي بابس! أودّ معرفة المزيد عن ${PHRASE(m[1])}.`],
  [/^(.+), hoping you'll pick a pup$/, (m) => `${nameOr(m[1])}، يتمنى أن تختار جروًا`],
  [/^(.+), congratulating the family$/, (m) => `${nameOr(m[1])}، يهنّئ العائلة`],
  [/^(.+), waiting inside$/, (m) => `${nameOr(m[1])}، ينتظر في الداخل`],
  [/^Meet (.+?), (.+)$/, (m) => (c(m[2]) ? `تعرّف على ${nameOr(m[1])}، ${c(m[2])}` : null)],
  [/^Meet this (.+?): (.+?), (boy|girl|boy & girl), (.+?) old, (imported|in Dubai)\. Real photos( and video)? from (?:Teddy)?Pups U\.A\.E\.$/, (m) =>
    `تعرّف على ${PHRASE(m[1])}: ${c(m[2])}، ${sexAr(m[3])}، عمره ${c(m[4])}، ${m[5] === "imported" ? "مستورد" : "في دبي"}. صور${m[6] ? " وفيديو" : ""} حقيقية من تيدي بابس الإمارات.`],
  [/^Meet (.+?): (.+?), (boy|girl|boy & girl), (.+?) old, (imported|in Dubai)\. Real photos( and video)? from (?:Teddy)?Pups U\.A\.E\.$/, (m) =>
    `تعرّف على ${nameOr(m[1])}: ${c(m[2])}، ${sexAr(m[3])}، عمره ${c(m[4])}، ${m[5] === "imported" ? "مستورد" : "في دبي"}. صور${m[6] ? " وفيديو" : ""} حقيقية من تيدي بابس الإمارات.`],
  [/^(.+?) puppy \((boy|girl|boy & girl)\) \| TeddyPups U\.A\.E\.$/, (m) => `جرو ${c(m[1])} (${sexAr(m[2])}) | تيدي بابس الإمارات`],
  [/^(.+?), (.+?) puppy \| TeddyPups U\.A\.E\.$/, (m) => `${nameOr(m[1])}، جرو ${c(m[2])} | تيدي بابس الإمارات`],
  [/^(Male|Female) (.+?) puppy$/, (m) => c(m[2]) && `جرو ${c(m[2])} ${m[1] === "Male" ? "ذكر" : "أنثى"}`],
  [/^(.+?), (male|female) (.+?) puppy(?:, photo (\d+))?$/, (m) => c(m[3]) && `${nameOr(m[1])}، جرو ${c(m[3])} ${sexAr(m[2])}` + (m[4] ? `، الصورة ${m[4]}` : "")],
  [/^(.+?) puppy$/, (m) => c(m[1]) && `جرو ${c(m[1])}`],
  [/^Meet (.+)$/, (m) => `تعرّف على ${PHRASE(m[1])}`],
];

/** Translate a short phrase: exact vocab/composite, else keep (names). */
export const PHRASE = (s: string): string => compose(s) ?? lookup(s);
let lookup: (s: string) => string = (s) => s;
/** index.ts registers the full translator so captions inside templates can use the dictionary too. */
export const setLookup = (fn: (s: string) => string) => { lookup = fn; };
