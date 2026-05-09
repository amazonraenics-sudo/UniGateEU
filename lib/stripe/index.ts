import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const PRICE_IDS = {
  starter:  'price_1THkODRsnieV0MaAR0LIbHqm',
  standard: 'price_1THkQJRsnieV0MaAfCBtgnWq',
  pro:      'price_1THkS6RsnieV0MaAAh36U7og',
  elite:    'price_1THkTlRsnieV0MaANba7gH0S',
}

export const CREDIT_AMOUNTS: Record<string, number> = {
  'price_1THkODRsnieV0MaAR0LIbHqm': 20,
  'price_1THkQJRsnieV0MaAfCBtgnWq': 75,
  'price_1THkS6RsnieV0MaAAh36U7og': 200,
  'price_1THkTlRsnieV0MaANba7gH0S': 500,
}
