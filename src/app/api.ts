// import { WebAppInitData } from 'telegram-webapps'

import { WebAppInitData } from 'telegram-webapps'
import { handleMinorError } from './utils';

export default {
  // validate(initData: Omit<WebAppInitData, 'user'> & { user: string }) {
  validate(initData: string): Promise<WebAppInitData> {
    return this.post('validate', initData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    }) as Promise<WebAppInitData>
  },
  log(data: string) {
    return this.post('log', data, {
      headers: {
        'Content-Type': 'text/plain',
      },
    }) as Promise<WebAppInitData>
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
