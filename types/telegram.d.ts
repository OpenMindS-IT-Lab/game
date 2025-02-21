import 'telegram-webapps'

declare module 'telegram-webapps' {
  namespace TelegramWebApps {
    interface WebAppInitData {
      signature: string
    }
  }
}
