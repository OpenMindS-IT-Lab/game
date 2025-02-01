// import { WebAppInitData } from 'telegram-webapps'

import { WebAppInitData } from 'telegram-webapps'

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
        Telegram.WebApp.showConfirm(data.message, okPressed => {
          if (okPressed) window.location.reload()
          else Telegram.WebApp.close()
        })
      }

      return data.data
    } catch (error) {
      console.error(error)
    }
  },
}
