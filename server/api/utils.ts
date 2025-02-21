import { kebabCase, upperCase } from 'lodash'

export const enum NewBotMethod {
  getStarTransactions = 'getStarTransactions',
  refundStarTransaction = 'refundStarTransaction',
}

export const enum Endpoint {
  Hello = 'hello',
  BotToken = 'bot-token',
  Validate = 'validate',
  CreateInvoiceLink = 'create-invoice-link',
  GetStarTransactions = 'get-star-transactions',
  RefundStarPayment = 'refund-star-payment',
  Root = 'api',
}

export function logErrorToStdout(error: unknown, endpoint: Endpoint) {
  process.stdout.write(`\nError in \`/${endpoint}\` endpoint:\n`)

  let message: string = error as string
  if (error instanceof Uint8Array) {
    const decoder = new TextDecoder('utf-8')
    message = decoder.decode(error)
  }
  if (typeof error === 'object') {
    message = JSON.stringify(error)
  }
  message += '\n'

  process.stdout.write(message)
}

export function log(name: Endpoint, data?: unknown | null) {
  const invoker = upperCase(kebabCase(name.toString()))
  const rn = '\r\n'
  const timestamp = new Date().toLocaleString()
  const prefix = `${rn}[${timestamp}][${invoker}]: `
  let postfix = false

  let message: string = prefix
  switch (typeof data) {
    case 'undefined':
      message += 'Method invoked.'
      break
    case 'object':
      if (data !== null) {
        message += JSON.stringify(data)
        postfix = true
      } else {
        message += 'Method finished.'
      }
      break
    case 'string':
      message += data
      break
    // case 'number':
    //   //...
    // case 'symbol':
    //   //...
    // case 'function':
    //   //...
    default:
      message +=
        'toString' in (data as any) && typeof (data as any).toString === 'function'
          ? (data as any).toString()
          : 'Unknown data type.'
  }
  message += rn

  process.stdout.write(message)
  if (postfix) log(name, null)
}
