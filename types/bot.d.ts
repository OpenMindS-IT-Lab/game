import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

// declare namespace Bot {}
declare type Bot = Telegraf<Context<Update>>
declare type BotOptions = Partial<Telegraf.Options<Context<Update>>>

export as namespace tg
