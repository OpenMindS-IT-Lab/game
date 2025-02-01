import crypto from 'crypto'
import express, { RequestHandler, Router } from 'express'
import serverless from 'serverless-http'

const api = express()
api.use(express.json())
api.use(express.urlencoded({ extended: true }))

const router = Router()

router.get('/hello', (_req, res) => {
  res.send('Hello World!')
})

router.get('/bot-token', (_, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token) res.status(500).send(JSON.stringify({ message: 'No TELEGRAM_BOT_TOKEN was found!' }))
  else res.status(200).send(JSON.stringify({ message: 'TELEGRAM_BOT_TOKEN', token }))
})

const validateHandler: RequestHandler = async (req, res) => {
  try {
    const { body } = req

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      res.status(500).json({ message: 'No TELEGRAM_BOT_TOKEN was found!' })
      return
    }

    // process.stdout.write('\nBot Token: ' + botToken + '\n')
    // process.stdout.write('\nBody: ' + body + '\n')

    // Extract the hash and remove it from the data
    const query = new URLSearchParams(decodeURI(body))
    const hash = query.get('hash')

    if (!hash) {
      res.status(400).json({ message: 'Missing hash in request data.' })
      return
    }

    query.delete('hash')
    const user = query.get('user')

    // Construct the data-check-string
    const dataCheckArray = Array.from(query.entries()).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    const dataCheckString = dataCheckArray.map(([key, value]) => `${key}=${key === 'user' ? user : value}`).join('\n')

    // process.stdout.write('\n' + dataCheckString + '\n')

    // Compute the secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()

    // Compute the HMAC-SHA256 of the data-check-string
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    // process.stdout.write('\n' + computedHash + '\n' + hash + '\n')

    // Compare the computed hash with the received hash
    if (computedHash !== hash) {
      res.status(401).json({ message: 'Data verification failed. Invalid hash.' })
      return
    }

    // Optionally validate auth_date to prevent replay attacks
    const authDate = parseInt(query.get('auth_date') ?? '0', 10)
    const currentTime = Math.floor(Date.now() / 1000)

    // process.stdout.write('\n' + authDate + '\n' + currentTime + '\n')

    if (currentTime - authDate > 3600) {
      // 1 hour
      res.status(401).json({ message: 'Authentication data is outdated!' })
      return
    }

    // Data is valid
    res.status(200).json({
      message: 'Data is valid and verified.',
      data: Object.fromEntries(
        query.entries().map(([key, value]) => [key, key === 'user' ? JSON.parse(value) : value])
      ),
    })
    return
  } catch (error) {
    // process.stdout.write('Validation error: ' + error + '\n')
    res.status(500).json({ message: 'Server error during validation.', error: (error as any).message })
    return
  }
}

router.post('/validate', validateHandler)

api.use('/api/', router)

export const handler = serverless(api)
