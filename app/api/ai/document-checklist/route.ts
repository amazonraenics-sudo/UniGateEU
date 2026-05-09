import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits, refundCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { university, program, country } = await request.json()

  const deduct = await deductCredits(user.id, 2, 'document_checklist')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const prompt = `Generate a complete document checklist for applying to ${program}${university ? ` at ${university}` : ''}${country ? ` in ${country}` : ''}.

Respond with JSON:
{
  "checklist": [
    { "name": "Academic Transcripts", "required": true, "notes": "Official, translated to English or German" },
    { "name": "Statement of Purpose", "required": true, "notes": "500-1000 words typically" },
    { "name": "CV/Resume", "required": true, "notes": "Academic format, 1-2 pages" },
    { "name": "Letters of Recommendation", "required": true, "notes": "2-3 letters from professors/employers" },
    { "name": "Language Test Score", "required": true, "notes": "IELTS 6.5 or TOEFL 90 typically" },
    { "name": "Degree Certificate", "required": true, "notes": "Or expected graduation date" },
    { "name": "Passport Copy", "required": true, "notes": "Valid for duration of studies" },
    { "name": "Motivation Letter", "required": false, "notes": "Some programs require this in addition to SOP" }
  ]
}`

  let message
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    await refundCredits(user.id, 2, 'document_checklist')
    return NextResponse.json({ error: 'AI service error. Credits refunded.' }, { status: 500 })
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    await refundCredits(user.id, 2, 'document_checklist')
    return NextResponse.json({ error: 'Invalid AI response. Credits refunded.' }, { status: 500 })
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
