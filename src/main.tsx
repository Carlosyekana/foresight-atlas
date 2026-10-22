import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import Instrumento from "./instrument/Instrumento";
import { LanguageProvider } from "./i18n";

/** The instrument prototype lives behind #/instrumento and touches nothing else. */
function Root() {
  const [instrument, setInstrument] = useState(() => window.location.hash.startsWith("#/instrumento"));
  useEffect(() => {
    const onHash = () => setInstrument(window.location.hash.startsWith("#/instrumento"));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return instrument ? <Instrumento /> : <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <Root />
    </LanguageProvider>
  </StrictMode>
);
