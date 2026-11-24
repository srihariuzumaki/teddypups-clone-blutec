import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/figtree";
import "@fontsource-variable/shantell-sans/full.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import "./styles/rtl.css";
import { getLang } from "./i18n/lang";
import { optimizeImages } from "./lib/images";

const ar = getLang() === "ar";
if (ar) { document.documentElement.lang = "ar"; document.documentElement.dir = "rtl"; import("./styles/arabic-font"); }

// English never downloads the Arabic dictionaries; in Arabic they are loaded before the first render.
const translator = ar ? await import("./i18n/dom") : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

translator?.startTranslator();
optimizeImages();
