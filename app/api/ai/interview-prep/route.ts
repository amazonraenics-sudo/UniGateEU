import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits, refundCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { program, university } = await request.json()

  const deduct = await deductCredits(user.id, 10, 'interview_prep')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const prompt = `Generate 10 realistic interview questions for a student applying to ${program}${university ? ` at ${university}` : ''}.

Include a mix of:
- Motivation questions (why this program, why this university)
- Academic background questions
- Research/career goals questions
- Behavioral questions (tell me about a challenge...)
- Field-specific knowledge questions
- European context questions (why study in Europe?)

Return as a JSON array: { "questions": ["Question 1", "Question 2", ...] }`

  let message
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    await refundCredits(user.id, 10, 'interview_prep')
    return NextResponse.json({ error: 'AI service error. Credits refunded.' }, { status: 500 })
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    await refundCredits(user.id, 10, 'interview_prep')
    return NextResponse.json({ error: 'Invalid AI response. Credits refunded.' }, { status: 500 })
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
