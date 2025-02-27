import express, { Router } from 'express'
import serverless from 'serverless-http'
import { botTokenHandler, createInvoiceLinkHandler, getStarTransactionsHandler, helloHandler, validateHandler } from './handlers/express'
import { registerBot } from './telegram'
import { bot } from '../deploy-succeeded';
import { hightscoreHandler, messageHandler, preCheckoutHandler, startHandler } from './handlers/telegraf';

const api = express()
const router = Router()

registerBot(router)

api.use(express.json())
api.use(express.urlencoded({ extended: true }))

router.get('/get-star-transactions', getStarTransactionsHandler())

router.get('/hello', helloHandler)

router.get('/bot-token', botTokenHandler)

router.post('/validate', validateHandler)

api.use('/api/', router)

if (Netlify.env.get('BOT_LAUNCHED') === 'true') {
  bot.start(startHandler)

  bot.on('message', messageHandler)

  bot.command('highscore', hightscoreHandler)

  bot.on('pre_checkout_query', preCheckoutHandler)

  router.post('/create-invoice-link', createInvoiceLinkHandler(bot))
}

const handler = serverless(api)

export { handler }
