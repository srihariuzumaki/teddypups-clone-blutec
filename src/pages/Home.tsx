import { useRef } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { useMeetPin } from "../lib/useMeetPin";
import { useChatSteps } from "../lib/useChatSteps";
import Hero from "./home/scenes/Hero";
import Meet from "./home/scenes/Meet";
import Paths from "./home/scenes/Paths";
import Chat from "./home/scenes/Chat";
import Passport from "./home/scenes/Passport";
import Dusk from "./home/scenes/Dusk";
import Night from "./home/scenes/Night";
import HomeCta from "./home/scenes/HomeCta";

export default function Home() {
  usePageMeta();
  const ref = useRef<HTMLDivElement>(null);
  useMeetPin(ref);
  useChatSteps(ref);
  return (
    <div className="tp-page" ref={ref}>
      <div><Hero /></div>
      <div><Meet /></div>
      <div><Paths /></div>
      <div><Chat /></div>
      <div><Passport /></div>
      <div><Dusk /></div>
      <div><Night /></div>
      <div><HomeCta /></div>
    </div>
  );
}
