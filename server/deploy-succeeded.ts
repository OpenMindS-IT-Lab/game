export default async () => {
  const setWebhookUrl = process.env.SET_WEBHOOK_URL
  console.log('⏳ Setting up Telegram Bot webhook')
  if (!!setWebhookUrl)
    await fetch(setWebhookUrl).then(
      () => console.log('✅ Telegram Bot webhook set'),
      () => console.log('❌ Error setting Telegram Bot webhook')
    )
}
