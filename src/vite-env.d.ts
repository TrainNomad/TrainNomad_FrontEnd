/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MAPTILER_KEY?: string;
  readonly VITE_EXPLORER_MAX_TRANSFERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
