import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits, refundCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { country, degree_level, field } = await request.json()

  const deduct = await deductCredits(user.id, 5, 'scholarship_match')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  const prompt = `You are a European scholarship expert. List 6-8 real scholarships for:
- Country: ${country || 'Any European country'}
- Degree: ${degree_level || profile?.degree_level || 'Any'}
- Field: ${field || profile?.field_of_study || 'Any'}
- Nationality: ${profile?.nationality || 'International'}
- GPA: ${profile?.gpa || 'Not specified'}

Include well-known scholarships like DAAD, Erasmus+, Orange Tulip, etc. and country-specific ones.

Respond with JSON:
{
  "summary": "Overview of scholarship opportunities",
  "scholarships": [
    {
      "name": "Scholarship Name",
      "provider": "Organization",
      "country": "Country",
      "amount": 15000,
      "currency": "EUR",
      "deadline": "March 15, 2025",
      "eligibility": ["Requirement 1", "Requirement 2"],
      "fields": ["Computer Science", "Engineering"],
      "description": "Brief description",
      "link": "https://scholarship-url.org"
    }
  ]
}`

  let message
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    await refundCredits(user.id, 5, 'scholarship_match')
    return NextResponse.json({ error: 'AI service error. Credits refunded.' }, { status: 500 })
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    await refundCredits(user.id, 5, 'scholarship_match')
    return NextResponse.json({ error: 'Invalid AI response. Credits refunded.' }, { status: 500 })
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
