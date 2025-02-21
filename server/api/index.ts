import express, { Router } from 'express'
import serverless from 'serverless-http'
import {
  botTokenHandler,
  createInvoiceLinkHandler,
  getStarTransactionsHandler,
  helloHandler,
  validateHandler,
} from './handlers/express'
import { hightscoreHandler, messageHandler, preCheckoutHandler, startHandler } from './handlers/telegraf'
import { registerBot } from './telegram'

const api = express()
const router = Router()
const bot = registerBot()

api.use(express.json())
api.use(express.urlencoded({ extended: true }))

if (!bot) {
}

if (bot) {
  // bot.launch(() => console.log('Bot is running')).catch(error => logErrorToStdout(error, Endpoint.Root))

  bot.start(startHandler)

  bot.on('message', messageHandler)

  bot.command('highscore', hightscoreHandler)

  bot.on('pre_checkout_query', preCheckoutHandler)

  router.get('/get-star-transactions', getStarTransactionsHandler())

  router.post('/create-invoice-link', createInvoiceLinkHandler(bot))
}

router.get('/hello', helloHandler)

router.get('/bot-token', botTokenHandler)

router.post('/validate', validateHandler)

api.use('/api/', router)

export const handler = serverless(api)
