import { RequestHandler } from 'express'
import he from 'he'
import bot from '../../bot'

export default (async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('❌ Method not allowed')
    return
  }

  try {
    const update = req.body

    if (process.env.NODE_ENV === 'development') {
      const webHookInfo = await bot.telegram.getWebhookInfo()

      console.log(webHookInfo)
      console.log(update)
    }

    if ('pre_checkout_query' in update) console.log(update)
    await bot.handleUpdate(update)

    res.status(200).send()
  } catch (err) {
    const errorMessage = '❌ Webhook error: ' + ('message' in (err as any) ? (err as any).message : err)
    res.status(409).send(he.escape(errorMessage))
    console.error(errorMessage)
  }
}) as RequestHandler
