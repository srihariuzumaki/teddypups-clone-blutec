import raw from "./puppies.json";

export interface Puppy {
  slug: string;
  name: string;
  isNamed: boolean;
  status: "available" | "gone";
  breed: string;
  breedKey: string;
  sex: "boy" | "girl" | "boy & girl";
  age: string;
  cardAge: string;
  origin: "local" | "imported";
  image: string;
  gallery: string[];
  videos: string[];
  title: string;
  description: string;
  hasVideo: boolean;
  homeAt: "TeddyPups" | "Dubai showroom" | null;
}

export const available = raw.available as Puppy[];
export const gone = raw.gone as Puppy[];
export const allPuppies: Puppy[] = [...available, ...gone];
export const findPuppy = (slug?: string) => allPuppies.find((p) => p.slug === slug);

export const BREEDS = [
  { key: "maltipoo", label: "Maltipoo" },
  { key: "pomeranian", label: "Pomeranian" },
  { key: "poodle", label: "Poodle" },
  { key: "cavapoo", label: "Cavapoo" },
  { key: "shih-tzu", label: "Shih Tzu" },
];

/** Display name: "Max" for named pups, otherwise the breed. */
export const displayName = (p: Puppy) => p.name;
