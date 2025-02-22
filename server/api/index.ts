import express, { Router } from 'express'
import serverless from 'serverless-http'
import { botTokenHandler, getStarTransactionsHandler, helloHandler, validateHandler } from './handlers/express'
import { registerBot } from './telegram'

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

export const handler = serverless(api)
