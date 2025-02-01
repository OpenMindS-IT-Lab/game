// import { WebAppInitData } from 'telegram-webapps'

import { WebAppInitData } from 'telegram-webapps'

export default {
  // validate(initData: Omit<WebAppInitData, 'user'> & { user: string }) {
  validate(initData: string): Promise<WebAppInitData> {
    return this.post(initData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    }) as Promise<WebAppInitData>
  },
  async post(body: any, options: { headers?: HeadersInit } = {}) {
    const { headers = {} } = options

    try {
      const res = await fetch('/api/validate', {
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
