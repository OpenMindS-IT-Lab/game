import { RequestHandler } from 'express'
import bot from '../../bot'
import he from 'he'

export default (async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('❌ Method not allowed')
    return
  }

  try {
    // const webHookInfo = await bot.telegram.getWebhookInfo()
    const update = req.body

    // console.log(webHookInfo)
    // console.log(update)

    await bot.handleUpdate(update)

    res.status(200).send()
  } catch (err) {
    const errorMessage = '❌ Webhook error: ' + ('message' in (err as any) ? (err as any).message : err)
    res.status(409).send(he.escape(errorMessage))
    console.error(errorMessage)
  }
}) as RequestHandler
