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
const botOptions: tg.BotOptions = {
  telegram: {
    testEnv,
  },
}

const bot = new Telegraf(botToken, botOptions)

bot.start(startHandler)

bot.on('message', messageHandler)

// bot.command('highscore', hightscoreHandler)

bot.on('pre_checkout_query', preCheckoutHandler)

bot.createWebhook({
  domain: 'https://tower-defence-staging.netlify.app',
  
})

export default bot
