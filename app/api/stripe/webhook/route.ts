import { NextResponse } from 'next/server'
import { stripe, CREDIT_AMOUNTS } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set, skipping webhook verification')
    return NextResponse.json({ received: true })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = (session as any).metadata?.user_id
    const priceId = (session as any).metadata?.price_id

    if (userId && priceId) {
      const creditsToAdd = CREDIT_AMOUNTS[priceId] ?? 0
      if (creditsToAdd > 0) {
        const supabase = createServiceClient()

        const { data: user } = await supabase.from('users').select('credits').eq('id', userId).single()
        const currentCredits = user?.credits ?? 0

        await supabase.from('users').update({ credits: currentCredits + creditsToAdd }).eq('id', userId)

        await supabase.from('credit_transactions').insert({
          user_id: userId,
          amount: creditsToAdd,
          type: 'purchase',
          feature: null,
          description: `Purchased ${creditsToAdd} credits`,
          stripe_payment_id: (session as any).payment_intent,
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
