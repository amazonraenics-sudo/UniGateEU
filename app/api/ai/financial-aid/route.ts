import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits, refundCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { country, budget, degree_level, savings_usd } = await request.json()

  const deduct = await deductCredits(user.id, 3, 'financial_aid')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const prompt = `Calculate the financial breakdown for studying in ${country} for a ${degree_level || 'graduate'} student with an annual budget of $${budget} USD${savings_usd ? ` and total savings of $${savings_usd} USD` : ''}.

Provide a realistic cost breakdown and financial assessment. Respond with JSON:
{
  "country": "${country}",
  "breakdown": {
    "tuition": 5000,
    "accommodation": 6000,
    "food": 3000,
    "transport": 1200,
    "health_insurance": 800,
    "books_supplies": 600,
    "personal_misc": 1200
  },
  "total_annual": 17800,
  "feasible": true,
  "assessment": "Your budget is sufficient. Germany offers low tuition and reasonable living costs.",
  "savings_tips": [
    "Apply for student housing early — it costs 40% less than private rentals",
    "Cook at home — student cafeterias (Mensa) offer meals for €2-4"
  ],
  "funding_options": [
    "DAAD scholarship — up to €800/month stipend",
    "Erasmus+ funding for EU citizens",
    "Student jobs allowed up to 120 full days per year"
  ]
}`

  let message
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    await refundCredits(user.id, 3, 'financial_aid')
    return NextResponse.json({ error: 'AI service error. Credits refunded.' }, { status: 500 })
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    await refundCredits(user.id, 3, 'financial_aid')
    return NextResponse.json({ error: 'Invalid AI response. Credits refunded.' }, { status: 500 })
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
