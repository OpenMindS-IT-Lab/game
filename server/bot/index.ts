import { Handler } from '@netlify/functions'
import { IncomingMessage } from 'http'
import { Update } from 'telegraf/types'
import bot from '../../bot'

const webhookCallback = bot.webhookCallback('/bot')

export const handler: Handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: '❌ Method not allowed' }
  }

  try {
    const update = JSON.parse(event.body!) as Update | undefined

    await new Promise<void>((resolve, _reject) => {
      webhookCallback(
        { body: update, method: 'POST' } as IncomingMessage & { body: Update | undefined },
        {
          status: () => ({ end: resolve }),
          end: resolve,
        } as any
      )
    })

    return { statusCode: 200, body: 'OK' }
  } catch (error) {
    console.error('Помилка обробки оновлення:', error)
    return { statusCode: 500, body: 'Внутрішня помилка сервера' }
  }
}
