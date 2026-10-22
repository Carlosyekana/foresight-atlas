import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import Instrumento from "./instrument/Instrumento";
import { LanguageProvider } from "./i18n";

/**
 * The dark instrument is the front door (ADR 0002). The classic light
 * workspace lives at #/clasico; every other hash — including the plain
 * root and deep links like #/instrumento?node=cla&blueprint=1 — opens
 * the instrument.
 */
const isClassic = () => window.location.hash.startsWith("#/clasico");

function Root() {
  const [classic, setClassic] = useState(isClassic);
  useEffect(() => {
    const onHash = () => setClassic(isClassic());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return classic ? <App /> : <Instrumento />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <Root />
    </LanguageProvider>
  </StrictMode>
);
