import express, { Router } from 'express'
import serverless from 'serverless-http'
import {
  botTokenHandler,
  createInvoiceLinkHandler,
  getStarTransactionsHandler,
  helloHandler,
  validateHandler,
} from './handlers'

const api = express()
const router = Router()

api.use(express.json())
api.use(express.urlencoded({ extended: true }))

router.get('/get-star-transactions', getStarTransactionsHandler())

router.get('/hello', helloHandler)

router.get('/bot-token', botTokenHandler)

router.post('/validate', validateHandler)

router.post('/create-invoice-link', createInvoiceLinkHandler)

api.use('/api/', router)

const handler = serverless(api)

export { handler }
