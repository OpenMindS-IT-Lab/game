/// <reference types="telegraf" />

interface BotRequestParams {
  query?: Record<string, any>
  payload?: BodyInit
}

interface BotResponse<D extends any = unknown> {
  ok: boolean
  description?: string
  result?: this['ok'] extends true ? D : never
  error_code?: this['ok'] extends false ? number : never
  parameters?: ResponseInit
}

interface BotData {
  id: 2200201569
  is_bot: true
  first_name: string
  username: string
  can_join_groups: boolean
  can_read_all_group_messages: boolean
  supports_inline_queries: boolean
  can_connect_to_business: boolean
  has_main_web_app: boolean
}

interface LabeledPrice {
  label: string
  amount: number
}

interface CreateInvoiceLinkArgs {
  userId: number
  title: string
  description: string
  cost: number
  photoUrl?: string
}

interface InvoicePayload {
  title: string
  description: string
  //! payload: `invoice_${testEnv ? 'dev' : 'prod'}_${'userId'}_${new Date().toLocaleString()}_`,
  payload: string
  provider_token: string
  currency: string
  prices: [LabeledPrice]
  photo_url?: ''
  photo_width?: number
  photo_height?: number
  photo_size?: number
}

interface StarTransaction {
  id: string
  amount: number
  nanostar_amount: number // The number of 1/1000000000 shares of Telegram Stars transferred by the transaction; from 0 to 999999999
  date: number
  receiver: Record<string, unknown>
}

interface StarTransactions {
  transactions: StarTransaction[]
}
