import { Telegraf } from 'telegraf'
import { messageHandler, preCheckoutHandler, startHandler } from './handlers'

const botToken = process.env.TELEGRAM_BOT_TOKEN
if (!botToken) {
  throw new Error('Can not find TELEGRAM_BOT_TOKEN')
}

const apiUrl = process.env.API_URL
if (!apiUrl) {
  throw new Error('Can not find API_URL')
}

const testEnv = !!process.env.NODE_ENV && process.env.NODE_ENV === 'development'
const apiRoot =
  !!process.env.BOT_API_URL && !!process.env.BOT_API_PORT
    ? process.env.BOT_API_URL + ':' + process.env.BOT_API_PORT
    : undefined
const botOptions: tg.BotOptions = {
  telegram: {
    testEnv,
    ...(!!testEnv && !!apiRoot && { apiRoot }),
  },
}

// console.log(botOptions, apiRoot, process.env.BOT_API_URL, process.env.BOT_API_PORT)

const bot = new Telegraf(botToken, botOptions)

bot.start(startHandler)

bot.on('message', messageHandler)

// bot.command('highscore', hightscoreHandler)

bot.on('pre_checkout_query', preCheckoutHandler)

export default bot
