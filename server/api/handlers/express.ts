import crypto from 'crypto'
import { RequestHandler } from 'express'
import bot from '../../../bot'
import { tgBotApiRequest } from '../telegram'
import { Endpoint, log, logErrorToStdout, NewBotMethod } from '../utils'

export function helloHandler(...[, res]: Parameters<RequestHandler>) {
  log(Endpoint.Hello)
  try {
    res.send('Hello World!')
  } catch (error) {
    logErrorToStdout(error, Endpoint.Hello)
    res.status(500).send()
  }
}

export function botTokenHandler(...[, res]: Parameters<RequestHandler>) {
  log(Endpoint.BotToken)
  let data = null
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      data = { message: 'No TELEGRAM_BOT_TOKEN was found!' }
      res.status(500).json(data)
    } else {
      data = { message: 'TELEGRAM_BOT_TOKEN', token }
      res.status(200).json(data)
    }
  } catch (error) {
    logErrorToStdout(error, Endpoint.BotToken)
    data = { message: 'Server error during obtaining bot token', error }
    res.status(500).json(data)
  } finally {
    log(Endpoint.BotToken, data)
  }
}

export async function validateHandler(...[req, res]: Parameters<RequestHandler>) {
  log(Endpoint.Validate)
  let data = null
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  try {
    if (!botToken) {
      data = { message: 'No TELEGRAM_BOT_TOKEN was found!' }
      res.status(500).json(data)
    } else {
      const { body } = req
      if (!body) {
        data = { message: 'Validation data is empty.' }
        res.status(400).json(data)
      } else {
        // process.stdout.write('\nBot Token: ' + botToken + '\n')
        // process.stdout.write('\nBody: ' + body + '\n')

        // Extract the hash and remove it from the data
        const query = new URLSearchParams(decodeURI(body))
        const hash = query.get('hash')

        if (!hash) {
          data = { message: 'Missing hash in request data.' }
          res.status(400).json(data)
        } else {
          query.delete('hash')
          const user = query.get('user')

          // Construct the data-check-string
          const dataCheckArray = Array.from(query.entries()).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          const dataCheckString = dataCheckArray
            .map(([key, value]) => `${key}=${key === 'user' ? user : value}`)
            .join('\n')

          // process.stdout.write('\n' + dataCheckString + '\n')

          // Compute the secret key
          const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()

          // Compute the HMAC-SHA256 of the data-check-string
          const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

          // process.stdout.write('\n' + computedHash + '\n' + hash + '\n')

          // Compare the computed hash with the received hash
          if (computedHash !== hash) {
            data = { message: 'Data verification failed. Invalid hash.' }
            res.status(401).json(data)
          } else {
            // Optionally validate auth_date to prevent replay attacks
            const authDate = parseInt(query.get('auth_date') ?? '0', 10)
            const currentTime = Math.floor(Date.now() / 1000)

            // process.stdout.write('\n' + authDate + '\n' + currentTime + '\n')

            if (currentTime - authDate > 3600) {
              // 1 hour
              data = { message: 'Authentication data is outdated!' }
              res.status(401).json(data)
            } else {
              // Data is valid
              data = {
                message: 'Data is valid and verified.',
                data: Object.fromEntries(
                  Array.from(query.entries()).map(([key, value]) => [key, key === 'user' ? JSON.parse(value) : value])
                ),
              }
              res.status(200).json(data)
            }
          }
        }
      }
    }
  } catch (error) {
    data = { message: 'Server error during validation.', error: (error as any).message }
    logErrorToStdout(error, Endpoint.Validate)
    res.status(500).json(data)
  } finally {
    log(Endpoint.Validate, data)
  }
}

export async function createInvoiceLinkHandler(...[req, res]: Parameters<RequestHandler>) {
  log(Endpoint.CreateInvoiceLink)
  let data = null
  try {
    const { body } = req
    if (!body) {
      data = { message: 'Invoice data is empty.' }
      res.status(400).json(data)
    } else {
      await bot.telegram
        .createInvoiceLink({
          ...body,
        })
        .then(
          invoiceLink => {
            data = {
              message: 'CREATE_INVOICE_LINK',
              data: invoiceLink,
            }
            res.status(200).json(data)
          },
          reason => {
            data = {
              message: reason,
            }
            res.status(500).json(data)
          }
        )
    }
  } catch (error) {
    data = { message: 'Server error during creating invoice link', error: (error as any).message }
    logErrorToStdout(error, Endpoint.CreateInvoiceLink)
    res.status(500).json(data)
  } finally {
    log(Endpoint.CreateInvoiceLink, data)
  }
}

export function getStarTransactionsHandler(): RequestHandler {
  return async function (...[, res]: Parameters<RequestHandler>) {
    log(Endpoint.GetStarTransactions)
    let data = null
    try {
      await tgBotApiRequest<StarTransactions>(NewBotMethod.getStarTransactions, {
        query: {
          offset: 0,
          limit: 10,
        },
      }).then(
        ({ ok, description, error_code, parameters, result }: BotResponse<StarTransactions>) => {
          if (ok) {
            data = {
              message: 'GET_STAR_TRANSACTIONS',
              data: result,
            }
            res.status(200).json(data)
          } else {
            data = {
              message: description,
              parameters,
            }
            res.status(error_code ?? 500).json(data)
          }
        },
        reason => {
          data = { message: reason }
          res.status(500).json(data)
        }
      )
    } catch (error) {
      data = { message: 'Server error during obtaining star transactions', error: (error as any).message }
      logErrorToStdout(error, Endpoint.GetStarTransactions)
      res.status(500).json(data)
    } finally {
      log(Endpoint.GetStarTransactions, data)
    }
  }
}
