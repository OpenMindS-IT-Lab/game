import { Context, Markup } from "telegraf";
import { Update } from "telegraf/types";

export async function startHandler(ctx: Context) {
  const botName = ctx.botInfo.username
  // console.log('\r\n' + ctx.botInfo.has_main_web_app + '\r\n')
  const appUrl = `http://192.168.0.107:8877/`
  const chatId = ctx.chat?.id
  const buttonText = 'Play the game'
  const webAppButton = Markup.button.webApp(buttonText, appUrl)
  const keyboard = Markup.keyboard([[webAppButton]])
  const inline_keyboard = Markup.inlineKeyboard([[webAppButton]])

  if (!chatId) {
    console.log({ botName, appUrl, chatId })
    throw new Error('Smth went wrong')
  }

  await ctx.telegram.sendMessage(chatId, 'Welcome to the game\\!', {
    parse_mode: 'MarkdownV2',
    ...keyboard,
    ...inline_keyboard,
  })
}

export async function messageHandler(ctx: Context<Update.MessageUpdate>) {
  // log(Endpoint.SuccessfullPayment)
  // if ('successful_payment' in ctx.message) log(Endpoint.SuccessfullPayment, ctx.message.successful_payment)
  // else 
  console.log(ctx.update)
}

// async function getHighScore(_telegramId: number): Promise<number> {
//   // Example implementation of getHighScore function
//   return 1234 // Replace with your actual logic to fetch high score
// }

// export async function hightscoreHandler(ctx: Context) {
//   const telegramId = ctx.from?.id
//   if (telegramId) {
//     const highScore = await getHighScore(telegramId)
//     ctx.reply(`Your high score is ${highScore}`)
//   } else {
//     ctx.reply("Couldn't fetch your telegram ID")
//   }
// }

export async function preCheckoutHandler(ctx: Context<Update.PreCheckoutQueryUpdate>) {
  const {
    id: queryId,
    from: { id: userId },
    invoice_payload,
  } = ctx.preCheckoutQuery
  const slugParsedId = parseInt(invoice_payload.split('_')[1])
  const ok = userId === slugParsedId

  await ctx.telegram.answerPreCheckoutQuery(queryId, ok, 'Something went wrong when processing your payment')
}
