import express, { Router } from 'express'
import serverless from 'serverless-http'

const api = express()

const router = Router()
router.get('/hello', (_req, res) => {
  res.send('Hello World!')
})

api.use('/api/', router)

export const handler = serverless(api)

// import express, { Request, Response } from 'express'
// import bodyParser from 'body-parser'
// import mongoose, { Schema, Document, Model } from 'mongoose'

// const app = express()
// app.use(bodyParser.json())

// mongoose.connect('mongodb://localhost:27017/gameDB', { useNewUrlParser: true, useUnifiedTopology: true })

// interface IUser extends Document {
//   telegramId: string
//   highScore: number
// }

// const userSchema: Schema = new Schema({
//   telegramId: { type: String, required: true },
//   highScore: { type: Number, required: true },
// })

// const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)

// app.post('/api/high-scores', async (req: Request, res: Response) => {
//   const { telegramId, highScore } = req.body
//   const user = await User.findOneAndUpdate({ telegramId }, { highScore }, { upsert: true, new: true })
//   res.json(user)
// })

// app.get('/api/high-scores', async (req: Request, res: Response) => {
//   const { telegramId } = req.query
//   const user = await User.findOne({ telegramId })
//   res.json(user)
// })

// app.listen(3000, () => {
//   console.log('Server is running on port 3000')
// })
