import { Context } from '@netlify/functions'

export default (_req: Request, context: Context) => {
  // context.log('Deploy succeeded')
  console.log('Deploy succeeded', context)
  process.stdout.write('Deploy succeeded')
  process.stdout.write(JSON.stringify(context))
}
