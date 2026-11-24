import type { CSSProperties } from "react";
import focal from "../data/focal.json";
import extra from "../data/detail-extra.json";
import type { Puppy } from "../data/puppies";

const sexWord = (s: Puppy["sex"]) => (s === "boy" ? "male" : s === "girl" ? "female" : "");

/** Alt text for a puppy's cover photo. */
export const imgAlt = (p: Puppy) =>
  p.isNamed
    ? `${p.name}, ${sexWord(p.sex)} ${p.breed} puppy`.replace(/ {2}/g, " ")
    : `${sexWord(p.sex) ? sexWord(p.sex)[0].toUpperCase() + sexWord(p.sex).slice(1) + " " : ""}${p.breed} puppy`;

/** object-position (the photo's focal point) for an image URL. */
export const focalStyle = (src?: string): CSSProperties | undefined => {
  const pos = src ? (focal as Record<string, string>)[src] : undefined;
  return pos ? { objectPosition: pos } : undefined;
};

/** Average colour shown while a puppy's photo loads. */
export const photoBg = (slug: string) => (extra as Record<string, { bg?: string }>)[slug]?.bg;
