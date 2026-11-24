// Builds src/data/puppies.json from the scraped data (data/*.json): normalised, ordered, typed-friendly.
import { readFileSync, writeFileSync } from "node:fs";
const raw = JSON.parse(readFileSync("data/puppies.json", "utf8"));
const catalogue = JSON.parse(readFileSync("data/puppies.listing.json", "utf8")).map((x) => x.slug);
const goneOrder = JSON.parse(readFileSync("data/gone-home.listing.json", "utf8")).map((x) => x.slug);
const bySlug = new Map(raw.map((p) => [p.slug, p]));

const breedKey = (b) => {
  const s = b.toLowerCase();
  if (s.includes("maltipoo")) return "maltipoo";
  if (s.includes("pomeranian") || s.includes("pomsky")) return "pomeranian";
  if (s.includes("cavapoo")) return "cavapoo";
  if (s.includes("shih")) return "shih-tzu";
  if (s.includes("poodle")) return "poodle";
  return s.replace(/\s+/g, "-");
};
const norm = (p) => ({
  slug: p.slug,
  name: p.name,
  isNamed: !!p.name && p.name !== p.breed,
  status: p.status,
  breed: p.breed,
  breedKey: breedKey(p.breed),
  sex: p.sex.toLowerCase(), // boy | girl | boy & girl
  age: p.age,
  origin: p.where === "In Dubai" ? "local" : "imported",
  image: p.gallery[0],
  gallery: p.gallery,
  videos: p.videos,
  title: p.title,
  description: p.description,
  hasVideo: p.videos.length > 0,
  homeAt: p.goneTicket ? (p.goneTicket.some((t) => /showroom/i.test(t)) ? "Dubai showroom" : "TeddyPups") : null,
  cardAge: (raw.find((x) => x.slug === p.slug)?.listingLabel || "").match(/\d[\d.]* months.*?(?=, available|, gone home|$)/)?.[0] || p.age,
});
const available = catalogue.filter((s) => bySlug.get(s)?.status === "available").map((s) => norm(bySlug.get(s)));
const gone = [...new Set([...goneOrder, ...raw.filter((p) => p.status === "gone").map((p) => p.slug)])]
  .filter((s) => bySlug.has(s)).map((s) => norm(bySlug.get(s)));
writeFileSync("src/data/puppies.json", JSON.stringify({ available, gone }, null, 2));
console.log(`available=${available.length} gone=${gone.length}`);
