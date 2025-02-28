import bot from "../bot";

export default async () => {
  const webhookUrl = process.env.WEBHOOK_URL

  if (!webhookUrl) {
    console.error("❌ WEBHOOK_URL not found in env")
    return
  }

  try {
    const setWebhookRes = await bot.telegram.setWebhook(webhookUrl, {
      allowed_updates: ['message', 'pre_checkout_query'],
      drop_pending_updates: true,
    })

    console.log('✅ WebHook set:', setWebhookRes)
  } catch (error) {
    console.error('❌ Error while setting up WebHook:', error)
  }
}