import { usePageMeta } from "../lib/usePageMeta";
import GoneHomeMarkup from "./markup/GoneHomeMarkup";

export default function GoneHome() {
  usePageMeta();
  return <GoneHomeMarkup />;
}
