import 'telegram-webapps'

declare module 'telegram-webapps' {
  export interface WebAppInitData extends TelegramWebApps.WebAppInitData {
    signature: string
  }
}
