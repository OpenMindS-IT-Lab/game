import { entries } from 'lodash'
import { NewBotMethod } from './utils'

export async function __RAW__tgBotApiRequest<R extends any>(
  botMethod: NewBotMethod,
  params: BotRequestParams = {}
): Promise<BotResponse<R>> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const isTestEnv = !!process.env.NODE_ENV ? process.env.NODE_ENV === 'development' : false
  const apiUrl = 'https://api.telegram.org/bot' + botToken + (isTestEnv ? '/test/' : '/')

  let requestUrl = apiUrl + botMethod
  const { query, ...requestOptions } = params

  if (query)
    requestUrl += entries(query).reduce(
      (str, [key, value], i) =>
        `${str}${i ? '&' : ''}${key}=${encodeURIComponent(
          typeof value === 'object' ? JSON.stringify(value) : (value as string)
        )}`,
      '?'
    )

  const botData = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...requestOptions,
  })

  return await botData.json()
}
