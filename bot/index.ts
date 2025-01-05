import { config } from 'dotenv'
import { Context, Telegraf } from 'telegraf'

config()

getBotToken().then(token => {
  const bot = new Telegraf(token)

  bot.start((ctx: Context) => ctx.reply('Welcome to the game!'))

  bot.command('highscore', async (ctx: Context) => {
    const telegramId = ctx.from?.id
    if (telegramId) {
      const highScore = await getHighScore(telegramId)
      ctx.reply(`Your high score is ${highScore}`)
    } else {
      ctx.reply("Couldn't fetch your telegram ID")
    }
  })

  bot.launch()
})

async function getBotToken() {
  const API_URL = process.env.API_URL ?? 'https://tower-defence-staging.netlify.app/api'
  const url = `${API_URL}/bot-token`
  const res = await fetch(url, {
    method: 'GET',
  })
  const data = await res.json()

  return data.token as string
}

async function getHighScore(_telegramId: number): Promise<number> {
  // Example implementation of getHighScore function
  return 1234 // Replace with your actual logic to fetch high score
}
