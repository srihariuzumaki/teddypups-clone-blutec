import { usePageMeta } from "../lib/usePageMeta";
import TeddySvg from "../components/ui/TeddySvg";

/* Markup ported 1:1 from the original 404 (mascot is the static pose for now). */
export default function NotFound() {
  usePageMeta("Lost — page not found | TeddyPups U.A.E.");
  return (
    <>
      <div className="gutter mx-auto grid min-h-[78vh] max-w-[110rem] place-items-center py-14">
        <div className="tp-poster">
          <span aria-hidden="true" className="tp-tape tp-tape--left" />
          <span aria-hidden="true" className="tp-tape tp-tape--right" />
          <p className="font-scrawl tp-poster__kicker">
            have you seen this page?
          </p>
          <h1 className="font-plush tp-poster__title">
            Lost
            <span className="sr-only">
              : this page has wandered off
            </span>
          </h1>
          <div className="tp-poster__photo">
            <div className="pup-buddy " data-facing="right" data-pose="sniff">
              <TeddySvg pose="sniff" label="Teddy, sniffing out the missing page" />
              <span aria-hidden="true" className="pup-bubble" data-show="false" />
            </div>
          </div>
          <p className="tp-poster__desc">
            One page, last seen wandering off. It answers to the address you typed, but it isn't here any more. Teddy is on the case.
          </p>
          <p className="font-scrawl tp-poster__reward">
            if found, take a tab:
          </p>
          <ul className="tp-poster__tabs" aria-label="Pages that are here">
            <li>
              <a className="tp-poster__tab" href="/">
                Home
              </a>
            </li>
            <li>
              <a className="tp-poster__tab" href="/puppies">
                Puppies
              </a>
            </li>
            <li>
              <a className="tp-poster__tab" href="/how-it-works">
                How it works
              </a>
            </li>
            <li>
              <a className="tp-poster__tab" href="/faq">
                Questions
              </a>
            </li>
            <li>
              <a className="tp-poster__tab" href="/contact">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      
    </>
  );
}
