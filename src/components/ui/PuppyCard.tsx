import { Link } from "react-router-dom";
import type { Puppy } from "../../data/puppies";
import Reveal from "./Reveal";

const WASH = ["#fbe3b4", "#f9cdbf", "#bfddf5", "#f6d79a"];

export default function PuppyCard({ p, i = 0 }: { p: Puppy; i?: number }) {
  const gone = p.status === "gone";
  const meta = gone ? null : `${p.breed === p.name ? "" : p.breed + " · "}${p.sex} · ${p.cardAge}`.replace(/^ · /, "");
  return (
    <Reveal as="li" className="tp-sketch" delay={(i % 4) * 90} tilt={((i * 37) % 30) / 10 - 1.5} style={{ ["--wash" as string]: WASH[i % WASH.length] }}>
      <Link
        to={`/puppies/${p.slug}`}
        aria-label={`${p.name}, ${p.breed}, ${p.sex}, ${p.age}, ${gone ? "gone home" : "available"}`}
        className="tp-sketch__link"
      >
        <span className="tp-sketch__frame">
          <span className="tp-sketch__wash" aria-hidden="true" />
          <span className="tp-sketch__photo">
            <img src={p.image} alt="" loading="lazy" decoding="async" />
          </span>
          <span className={`tp-sketch__tag ${gone ? "tp-sketch__tag--gone" : ""}`}>{gone ? "gone home ♥" : "Available"}</span>
          {p.hasVideo && <span className="tp-sketch__video">▶ video</span>}
        </span>
        <span className="tp-sketch__name">{p.name}</span>
        {meta && <span className="tp-sketch__meta">{meta}</span>}
      </Link>
    </Reveal>
  );
}
