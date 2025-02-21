import { TelegramWebApps } from 'telegram-webapps'
import { handleMinorError } from './utils'

export default {
  endpoints: {
    validate: 'validate',
    createInvoiceLink: 'create-invoice-link',
    getStarTransactions: 'get-star-transactions',
  },
  validate(initData: string): Promise<TelegramWebApps.WebAppInitData> {
    return this.post(this.endpoints.validate, initData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    }) as Promise<TelegramWebApps.WebAppInitData>
  },
  createInvoiceLink({ userId, title, description, cost, photoUrl }: CreateInvoiceLinkArgs) {
    if (title.length > 32)
      throw new Error('Error creating invoice link. Value passed for `title` is too long (max: 32 char).')
    if (description.length > 128)
      throw new Error('Error creating invoice link. Value passed for `description` is too long (max: 128 char).')
    if (cost <= 0) throw new Error('Error creating invoice link. Value passed for `cost` is less than or equals to 0.')
    const payload = `invoice_${userId}_${new Date()
      .toLocaleString()
      .replaceAll('.', '-')
      .replaceAll(':', '-')
      .replace(', ', '_')}_`
    const params: InvoicePayload = {
      title,
      description,
      payload,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: 'product price', amount: cost }],
      ...(typeof photoUrl === 'string' ? { photoUrl } : {}),
    }
    const body = JSON.stringify(params)

    console.log(body)

    return this.post(this.endpoints.createInvoiceLink, body) as Promise<string>
  },
  getStarTransactions() {
    return this.get(this.endpoints.getStarTransactions) as Promise<StarTransactions>
  },
  async get(endpoint: string, options: { headers?: HeadersInit } = {}) {
    const { headers = {} } = options

    try {
      const res = await fetch('/api/' + endpoint, {
        method: 'GET',
        headers: {
          ...headers,
        },
      })

      const data = await res.json()

      if (res.status === 401) {
        handleMinorError(data.message)
      }

      return data.data
    } catch (error) {
      handleMinorError(error)
    }
  },
  async post(endpoint: string, body: any, options: { headers?: HeadersInit } = {}) {
    const { headers = {} } = options

    try {
      const res = await fetch('/api/' + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
      })

      const data = await res.json()

      if (res.status === 401) {
        handleMinorError(data.message)
      }

      return data.data
    } catch (error) {
      handleMinorError(error)
    }
  },
}
