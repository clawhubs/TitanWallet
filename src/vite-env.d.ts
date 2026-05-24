/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TITAN_API_BASE_URL?: string;
  readonly VITE_TITAN_DEV_PORTAL_URL?: string;
  readonly VITE_TITAN_API_KEY?: string;
  readonly VITE_TITAN_API_ENV?: 'testnet' | 'mainnet';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
