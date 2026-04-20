import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { country, nationality } = await request.json()

  const deduct = await deductCredits(user.id, 3, 'visa_checklist')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const prompt = `Provide a comprehensive student visa guide for studying in ${country}${nationality ? ` for a student from ${nationality}` : ''}.

Respond with JSON:
{
  "country": "${country}",
  "visa_type": "National Visa Type D / Student Visa",
  "overview": "2-3 sentence overview of the visa situation",
  "requirements": [
    "Valid passport (minimum 6 months validity beyond study period)",
    "University admission letter",
    "Proof of financial means (€X per month)",
    "Health insurance coverage",
    "Biometric photos",
    "Completed visa application form",
    "Academic transcripts and certificates",
    "Language proficiency proof"
  ],
  "process": [
    "Receive your university admission letter",
    "Gather all required documents",
    "Book appointment at the ${country} embassy/consulate",
    "Attend visa appointment with all documents",
    "Wait for processing (typically X weeks)",
    "Register at local authorities upon arrival"
  ],
  "timeline": "Apply at least 8-12 weeks before your program start date. Processing typically takes 4-8 weeks.",
  "tips": [
    "Apply early — summer appointments fill up quickly",
    "Blocked account requirement: show proof of €X,000 per year",
    "Health insurance is mandatory — get coverage before applying"
  ]
}`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
