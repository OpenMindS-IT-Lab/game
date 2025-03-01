import { Handler } from '@netlify/functions'

export const handler: Handler = () => {
  const setWebhookUrl = Netlify.env.get('SET_WEBHOOK_URL')
  console.log('⏳ Setting up Telegram Bot webhook')
  if (!!setWebhookUrl) fetch(setWebhookUrl).then(console.log, console.log)
}
