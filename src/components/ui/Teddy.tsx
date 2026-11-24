import TeddySvg from "./TeddySvg";
import type { PoseName } from "../../lib/mascot/rig";

/** Teddy the mascot. Alive (blinks, wags, reacts, does tricks) once `usePupBuddies` attaches the rig. */
export default function Teddy({
  label = "Teddy, the TeddyPups puppy",
  facing = "right",
  pose = "sit",
  className = "",
}: {
  label?: string;
  facing?: "left" | "right";
  pose?: PoseName;
  className?: string;
}) {
  return (
    <div className={`pup-buddy ${className}`.trim()} data-facing={facing} data-pose={pose}>
      <TeddySvg pose={pose} facing={facing} label={label} />
      <span aria-hidden="true" className="pup-bubble" data-show="false" />
    </div>
  );
}
