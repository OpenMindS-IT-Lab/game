/// <reference types="unplugin-turbo-console/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly TELEGRAM_BOT_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
