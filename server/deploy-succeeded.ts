import { Handler } from '@netlify/functions'

export const handler: Handler = () => {
  const setWebhookUrl = process.env.SET_WEBHOOK_URL
  console.log('⏳ Setting up Telegram Bot webhook')
  if (!!setWebhookUrl)
    fetch(setWebhookUrl).then(
      () => console.log('✅ Telegram Bot webhook set'),
      () => console.log('❌ Error setting Telegram Bot webhook')
    )
}
