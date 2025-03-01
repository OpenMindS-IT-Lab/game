import { RequestHandler } from 'express'
import bot from '../../bot'

export default (async (_req, res) => {
  const webhookUrl = process.env.WEBHOOK_URL
  let message: string

  if (!webhookUrl) {
    message = '❌ WEBHOOK_URL not found in env'
    console.error(message)
    res.status(500).send(message)
    return
  }

  try {
    const setWebhookRes = await bot.telegram.setWebhook(webhookUrl, {
      allowed_updates: ['message', 'pre_checkout_query'],
      drop_pending_updates: true,
    })

    message = '✅ WebHook set:' + setWebhookRes
    console.log(message)
    res.status(setWebhookRes ? 200 : 500).send(message)
  } catch (error) {
    message = '❌ Error while setting up WebHook: ' + ('message' in (error as any) ? (error as any).message : error)
    console.error(message)
    res.status('code' in (error as any) ? (error as any).code : 500).send(message)
  }
}) as RequestHandler
