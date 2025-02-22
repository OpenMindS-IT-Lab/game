import { entries } from 'lodash'
import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Endpoint, logErrorToStdout, NewBotMethod } from './utils'

export function registerBot() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      throw new Error('Can not find TELEGRAM_BOT_TOKEN')
    }

    const apiUrl = process.env.API_URL
    if (!apiUrl) {
      throw new Error('Can not find API_URL')
    }

    const testEnv = !!process.env.NODE_ENV && process.env.NODE_ENV === 'development'
    const botOptions: Partial<Telegraf.Options<Context<Update>>> = {
      telegram: {
        testEnv,
      },
    }

    const bot = new Telegraf(botToken, botOptions)

    bot.catch((err, ctx) => {
      console.error(err)
      console.info(ctx)
    })

    const Non0SIG = [
      'SIGHUP',
      'SIGINT',
      'SIGQUIT',
      'SIGILL',
      'SIGTRAP',
      'SIGABRT',
      'SIGBUS',
      'SIGFPE',
      'SIGUSR1',
      'SIGSEGV',
      'SIGUSR2',
      'SIGTERM',
    ] as const

    const cleanup = async (force: boolean = false) => {
      Non0SIG.forEach(sig => {
        process.removeAllListeners(sig)
      })

      if (testEnv && force) {
        await bot.telegram.logOut()
        await bot.telegram.close()
      }

      bot.stop()
    }

    // catching signals and do something before exit
    Non0SIG.forEach(sig => {
      process.on(sig, async function () {
        console.log('Signal: ' + sig)
        await cleanup()
        process.exit(1)
      })
    })

    process.on('exit', cleanup)

    try {
      console.log('Starting bot...')
      bot.stop()
    } catch {
      try {
        bot.launch()
        console.log('Bot has started successfully.')
      } catch (error) {
        console.error('Error launching bot:', error)
        process.exit(1)
      }
    }

    try {
      bot.launch()
      console.log('Bot has restarted successfully.')
    } catch (error) {
      console.error('Error relaunching bot:', error)
      process.exit(1)
    }

    return bot
  } catch (error) {
    logErrorToStdout(error, Endpoint.Root)
    return null
  }
}

export async function tgBotApiRequest<R extends any>(
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
