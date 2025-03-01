import { Telegraf } from 'telegraf'
import { messageHandler, preCheckoutHandler, startHandler } from './handlers'

const botToken = process.env.TELEGRAM_BOT_TOKEN
const apiUrl = process.env.API_URL
const apiRoot =
  !!process.env.BOT_API_URL && !!process.env.BOT_API_PORT
    ? process.env.BOT_API_URL + ':' + process.env.BOT_API_PORT
    : undefined
const testEnv = !!process.env.NODE_ENV && process.env.NODE_ENV === 'development'
const botOptions: tg.BotOptions = {
  telegram: {
    testEnv,
    ...(!!testEnv && !!apiRoot && { apiRoot }),
  },
}

if (!botToken || !apiUrl || !apiRoot) {
  console.log({ botToken, apiUrl, apiRoot, testEnv, botOptions })

  if (!botToken) {
    throw new Error('❌ Can not find TELEGRAM_BOT_TOKEN')
  }

  if (!apiUrl) {
    throw new Error('❌ Can not find API_URL')
  }
}

const bot = new Telegraf(botToken, botOptions)

bot.start(startHandler)

bot.on('message', messageHandler)

bot.on('pre_checkout_query', preCheckoutHandler)

export default bot
