import { Context as NetlifyContext } from '@netlify/functions'
import { Telegraf, Context as TelegrafContext } from 'telegraf'
import { Update } from 'telegraf/types'

export let bot: tg.Bot

export default async (_req: Request, _context: NetlifyContext) => {
  const onLaunch = () => Netlify.env.set('BOT_LAUNCHED', 'true')
  if (!Netlify.env.has('BOT_LAUNCHED')) Netlify.env.set('BOT_LAUNCHED', 'false')
  if (Netlify.env.get('BOT_LAUNCHED') === 'false') await registerBot(onLaunch)
  if (Netlify.env.get('BOT_LAUNCHED') === 'true') {
    await stopBot()
    await registerBot(onLaunch)
  }
}

async function stopBot() {
  if (!!bot) bot.stop()
}

async function registerBot(onLaunch: () => void) {
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
    const botOptions: Partial<Telegraf.Options<TelegrafContext<Update>>> = {
      telegram: {
        testEnv,
      },
    }

    bot = new Telegraf(botToken, botOptions)

    await bot.launch(onLaunch)
  } catch (err) {
    console.error(err)
  }
}
