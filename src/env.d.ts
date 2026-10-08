/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_CAGE_ID: string
  readonly VITE_USE_MOCKS: string
  readonly VITE_DEV_BACKEND: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
