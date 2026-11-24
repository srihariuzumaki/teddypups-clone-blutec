/** Is the loading curtain (still) covering the page? Used so reveal animations wait until it has lifted. */
const currentTime = () => {
  const a = document.querySelector(".tp-curtain")?.getAnimations().find((x) => (x as CSSAnimation).animationName === "tp-curtain-rest");
  return a && a.playState !== "finished" && typeof a.currentTime === "number" ? a.currentTime : Infinity;
};
/** Milliseconds the intro's "rest" animation has been running (Infinity if it is not running). */
export const introTime = currentTime;

export function curtainDown() {
  const s = (document.querySelector(".tp-curtain") as HTMLElement | null)?.dataset.state;
  return (s === "intro" && currentTime() < 560) || s === "covering" || s === "covered" || s === "snap";
}
