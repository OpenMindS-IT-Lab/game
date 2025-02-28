import { Handler } from '@netlify/functions'
import bot from '../../bot'

const webhookCallback = bot.webhookCallback('/telegram')

export const handler: Handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Метод не дозволений' }
  }

  try {
    const update = JSON.parse(event.body!)

    await new Promise<void>((resolve, _reject) => {
      webhookCallback(
        { body: update, method: 'POST' } as any,
        {
          end: resolve,
          status: () => ({ end: resolve }),
        } as any
      )
    })

    return { statusCode: 200, body: 'OK' }
  } catch (error) {
    console.error('Помилка обробки оновлення:', error)
    return { statusCode: 500, body: 'Внутрішня помилка сервера' }
  }
}
