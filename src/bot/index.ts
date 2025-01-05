import { Context, Telegraf } from 'telegraf'

const bot: Telegraf<Context> = new Telegraf('YOUR_BOT_TOKEN')

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

async function getHighScore(_telegramId: number): Promise<number> {
  // Example implementation of getHighScore function
  return 1234 // Replace with your actual logic to fetch high score
}
