import bot from "../bot";

export default async () => {
 await bot.telegram.setWebhook('https://your-netlify-app.netlify.app/bot', {
    allowed_updates: ['message', 'pre_checkout_query'],
    drop_pending_updates: true,
  })
}