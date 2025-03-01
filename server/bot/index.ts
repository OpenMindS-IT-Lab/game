import express, { Router } from 'express'
import serverless from 'serverless-http'
import setWebhook from './set-webhook'
import webhookCallback from './webhook-callback'

const botApi = express()
const router = Router()

botApi.use(express.json())
botApi.use(express.urlencoded({ extended: true }))

router.get('/set-webhook', setWebhook)
router.post('/webhook-callback', webhookCallback)

botApi.use('/bot/', router)

export const handler = serverless(botApi)
