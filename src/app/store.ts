const store = {
  cloudStorage: Telegram.WebApp.CloudStorage,
  onError: (error: unknown, _value: unknown) => {
    if (error) console.error(error)
  },
  isNewUser(): boolean {
    let isNew = false

    this.cloudStorage.getKeys((error, keys) => {
      if (error) console.error(error)
      isNew = keys.length === 0
    })

    return isNew
  },
  sess: null,
  async getActiveSession() {
    await this.cloudStorage.getItem('active_session', (error, s) => {
      if (error) console.error(error)
      else {
        console.log(s)
        this.sess = s
      }
    })
  },
  setActiveSession(hash: string) {
    this.cloudStorage.setItem('active_session', hash)
  },
  register(userData: TelegramUser, hash?: string): void {
    this.cloudStorage.setItem('registered', 'true', (error, _v) => {
      if (error) console.error(error)
      console.log('User registered!')
    })

    if (hash) {
      this.setActiveSession(hash)
    }
  },
}

export default store
