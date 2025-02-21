import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

// declare namespace Bot {}
declare type Bot = Telegraf<Context<Update>>

export as namespace tg
