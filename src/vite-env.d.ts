/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ask Worker, e.g. https://foresight-atlas-ask.<account>.workers.dev. Empty disables the guide. */
  readonly VITE_ASK_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
