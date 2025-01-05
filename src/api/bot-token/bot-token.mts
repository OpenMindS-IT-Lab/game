import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  const value = process.env.TELEGRAM_BOT_TOKEN

  return {
    statusCode: 200,
    body: JSON.stringify({ value }),
  }
}

export { handler }
