import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/figtree";
import "@fontsource-variable/shantell-sans/full.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import "./styles/rtl.css";
import { getLang } from "./i18n";

const ar = getLang() === "ar";
if (ar) { document.documentElement.lang = "ar"; document.documentElement.dir = "rtl"; import("./styles/arabic-font"); }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

if (ar) import("./i18n/dom").then((m) => m.startTranslator());
