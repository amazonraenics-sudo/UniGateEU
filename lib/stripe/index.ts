import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  standard: process.env.STRIPE_STANDARD_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  elite: process.env.STRIPE_ELITE_PRICE_ID!,
}

export const CREDIT_AMOUNTS: Record<string, number> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]: 20,
  [process.env.STRIPE_STANDARD_PRICE_ID!]: 75,
  [process.env.STRIPE_PRO_PRICE_ID!]: 200,
  [process.env.STRIPE_ELITE_PRICE_ID!]: 500,
}
