/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TGVMAX_API_URL?: string;
  readonly VITE_GUIDES_API_URL?: string;
  readonly VITE_MAPTILER_KEY?: string;
  readonly VITE_EXPLORER_MAX_TRANSFERS?: string;
  readonly VITE_OMIO_TRACKING_URL?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_UMAMI_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
