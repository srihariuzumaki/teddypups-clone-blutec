import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { available, type Puppy } from "../../data/puppies";
import { focalStyle, imgAlt, photoBg } from "../../lib/puppyImage";
import { reducedMotion } from "../../lib/mascot/loop";

/** [left %, width rem, how much of the puppy peeks above the quilt, tilt deg] for each seat. */
const SEATS: [number, number, number, number][] = [
  [9, 8.6, 0.62, -5],
  [22.5, 10.4, 0.8, 3],
  [35, 9.2, 0.7, -2],
  [65, 9.4, 0.74, 3],
  [77.5, 10.6, 0.82, -3],
  [91, 8.4, 0.6, 4],
];
/** Pause (ms) before the next puppy ducks; cycles so it never feels metronomic. */
const GAPS = [1900, 2500, 1700, 2300, 2000, 2800, 1800];

const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function Cover({ p }: { p: Puppy }) {
  return (
    <img
      alt={imgAlt(p)}
      loading="eager"
      decoding="async"
      sizes="11rem"
      src={p.image}
      style={{ position: "absolute", inset: 0, height: "100%", width: "100%", objectFit: "cover", color: "transparent", backgroundColor: photoBg(p.slug), ...focalStyle(p.image) }}
    />
  );
}

/**
 * The hero's row of puppies peeking over the quilt. Every couple of seconds one ducks down, is swapped for
 * another puppy from the showroom, pops back up and shows a name bubble. Hovering or focusing one shows its name too.
 * Pauses while the tab is hidden, the hero is off screen, or you're scrolling/interacting.
 */
export default function HeroLineup() {
  const friends = available;
  const seats = Math.min(SEATS.length, friends.length);
  const [shown, setShown] = useState<number[]>(() => friends.slice(0, seats).map((_, i) => i));
  const [state, setState] = useState<Record<number, "duck" | "pop" | undefined>>({});
  const [bubble, setBubble] = useState<number | null>(null); // seat showing a name after popping
  const [hover, setHover] = useState<number | null>(null);
  const [next, setNext] = useState<number | null>(friends.length > seats ? seats : null); // preloaded "wings" puppy
  const list = useRef<HTMLUListElement>(null);
  const wings = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const ul = list.current;
    if (!ul || !seats || reducedMotion()) return;
    const swap = friends.length > seats;
    const scene = ul.closest<HTMLElement>("[data-pup-scene]");
    let visible = true;
    let quietUntil = 0;
    let alive = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 });
    io.observe(ul);
    const hush = () => (quietUntil = performance.now() + 1200);
    addEventListener("scroll", hush, { passive: true });
    addEventListener("pointerdown", hush, { passive: true });
    ul.addEventListener("pointerover", hush, { passive: true });

    const idle = () => friends.map((_, i) => i).filter((i) => !shownRef.current.includes(i));
    let queue = shuffle(idle());
    if (queue.includes(seats)) queue = [seats, ...shuffle(queue.filter((i) => i !== seats))];
    let order: number[] = [];
    let last = -1;
    let step = 0;
    let waits = 0;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    // Pick a seat, duck it, swap its puppy, pop it back up and show the name.
    const act = () => {
      if (!order.length) {
        order = shuffle([...ul.children].map((el, i) => (el.getClientRects().length ? i : -1)).filter((i) => i >= 0)).filter((s, i, a) => !(i === 0 && s === last && a.length > 1));
      }
      const seat = order.shift();
      if (seat === undefined) return later(ready, 2000);
      last = seat;
      const incoming = swap ? queue.shift() : shownRef.current[seat];
      setState((s) => ({ ...s, [seat]: "duck" }));
      later(() => {
        if (swap && incoming !== undefined) {
          const outgoing = shownRef.current[seat];
          setShown((cur) => cur.map((v, i) => (i === seat ? incoming : v)));
          queue.push(outgoing);
          setNext(queue[0] ?? null);
        }
        setState((s) => ({ ...s, [seat]: "pop" }));
        setBubble(seat);
        later(() => setBubble((b) => (b === seat ? null : b)), 1800);
        later(() => setState((s) => ({ ...s, [seat]: undefined })), 700);
      }, 360);
      later(ready, GAPS[step++ % GAPS.length]);
    };

    // Only act when the hero is on screen, the tab is visible and nothing else is going on; make sure the next photo has loaded.
    const ready = () => {
      if (!(!document.hidden && visible && performance.now() > quietUntil && scene?.dataset.here !== "false")) return void later(ready, 900);
      if (!swap) return act();
      if (!queue.length) queue = shuffle(idle());
      const img = wings.current?.dataset.for === String(queue[0]) ? wings.current.querySelector("img") : null;
      if (!img || !img.complete || !img.naturalWidth) {
        if (++waits < 15) return void later(ready, 400);
        queue.push(queue.shift()!);
        setNext(queue[0] ?? null);
        waits = 0;
        return void later(ready, 800);
      }
      waits = 0;
      img.decode().then(act, act);
    };

    if (swap) setNext(queue[0] ?? null);
    // Start once the entrance animation (puppies rising over the quilt) has finished.
    const entering = [...ul.querySelectorAll(".tp-lineup__pup")].flatMap((e) => e.getAnimations()).filter((a) => (a as CSSAnimation).animationName === "tp-peek");
    const go = () => alive && later(ready, 250);
    Promise.all(entering.map((a) => a.finished)).then(go, go);

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      io.disconnect();
      removeEventListener("scroll", hush);
      removeEventListener("pointerdown", hush);
      ul.removeEventListener("pointerover", hush);
    };
  }, [friends, seats]);

  if (!seats) return null;
  const seatStyle = (i: number): CSSProperties => {
    const [x, w, peek, tilt] = SEATS[i];
    return { "--x": `${x}%`, "--w": `${w}rem`, "--peek": peek, "--tilt": `${tilt}deg`, "--i": i } as CSSProperties;
  };
  const clear = (i: number) => () => setHover((h) => (h === i ? null : h));

  return (
    <>
      <ul ref={list} className="tp-lineup" aria-label="Some of the puppies in our showroom">
        {shown.map((fi, i) => {
          const p = friends[fi];
          return (
            <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
              <Link
                to={`/puppies/${p.slug}`}
                className="tp-lineup__pup"
                data-pup-friend="true"
                data-state={state[i]}
                aria-label={`Meet ${p.name}, ${p.breed}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={clear(i)}
                onFocus={() => setHover(i)}
                onBlur={clear(i)}
              >
                <span className="tp-lineup__photo"><Cover p={p} /></span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul aria-hidden="true" className="tp-lineup tp-lineup--tags">
        {shown.map((fi, i) => (
          <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
            <span className="tp-lineup__ghost" data-state={state[i]} data-tag={bubble === i || hover === i ? "show" : undefined}>
              <span className="tp-lineup__name font-scrawl">{friends[fi].name}</span>
            </span>
          </li>
        ))}
      </ul>
      {next !== null && (
        <span ref={wings} aria-hidden="true" className="tp-lineup__wings" data-for={next}>
          <Cover p={friends[next]} />
        </span>
      )}
    </>
  );
}
