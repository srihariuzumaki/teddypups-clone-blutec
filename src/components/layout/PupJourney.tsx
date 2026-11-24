import { useEffect, useRef } from "react";
import { PAW_D } from "./pawPath";
import TeddySvg from "../ui/TeddySvg";
import { startJourney } from "../../lib/mascot/journey";

/**
 * The walking mascot: a fixed layer holding one Teddy who strolls between the page's `data-pup-stop`
 * spots as you scroll, plus the pool of paw prints he leaves behind. Render this *inside* `<main>`
 * (prints are positioned against it) and call it again with a new `routeKey` per page.
 */
export default function PupJourney({ routeKey }: { routeKey: string }) {
  const probe = useRef<HTMLDivElement>(null);
  const prints = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const bubbleAt = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Wait a frame so the page's own layout (and the reveal hook's attributes) is in place before measuring.
    let stop = () => {};
    const id = requestAnimationFrame(() => {
      stop = startJourney({
        probe: probe.current!, prints: prints.current!, layer: layer.current!, actor: actor.current!,
        body: body.current!, bubbleAt: bubbleAt.current!, bubble: bubble.current!,
      });
    });
    return () => { cancelAnimationFrame(id); stop(); };
  }, [routeKey]);

  return (
    <>
      <div ref={probe} aria-hidden="true" className="pup-probe" />
      <div ref={prints} aria-hidden="true" className="pup-prints">
        {Array.from({ length: 24 }, (_, i) => (
          <svg key={i} viewBox="0 0 64 64"><path d={PAW_D} /></svg>
        ))}
      </div>
      <div ref={layer} aria-hidden="true" className="pup-layer" hidden data-front="true">
        <div ref={actor} className="pup-actor">
          <div ref={body} className="pup-actor__body">
            <TeddySvg pose="peek" />
          </div>
          <span ref={bubbleAt} className="pup-bubble-at">
            <span ref={bubble} className="pup-bubble" data-show="false" />
          </span>
        </div>
      </div>
    </>
  );
}
