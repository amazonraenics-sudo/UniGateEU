import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'Price ID required' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/credits?success=true`,
    cancel_url: `${appUrl}/credits?cancelled=true`,
    metadata: { user_id: user.id, price_id: priceId },
    customer_email: user.email,
  })

  return NextResponse.json({ sessionId: session.id })
}
