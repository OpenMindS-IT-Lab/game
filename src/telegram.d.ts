// @ts-expect-error
import { TelegramWebApps } from 'telegram-webapps'

declare global {
  type Utils = {
    [key: symbol]: {
      (...params: unknown[]): unknown
    }
  }

  type WebView = {
    [key: symbol]: {
      (...params: unknown[]): unknown
    }
  }

  type WebApp = TelegramWebApps.WebApp

  interface Telegram {
    Utils: Utils
    WebView: WebView
    WebApp: WebApp
  }

  const Telegram: Telegram
}
