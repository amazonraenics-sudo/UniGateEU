import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits, refundCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { country, field, query } = await request.json()

  const deduct = await deductCredits(user.id, 5, 'university_match')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  const prompt = `You are a European university admissions expert. Based on the student profile and search criteria, recommend the top 6-9 European universities.

Student Profile:
- Degree Level: ${profile?.degree_level || 'Not specified'}
- Field of Study: ${field || profile?.field_of_study || 'Not specified'}
- GPA: ${profile?.gpa || 'Not specified'}
- Language Score: ${profile?.language_score} ${profile?.language_score_value || ''}
- Target Countries: ${country ? country : (profile?.target_countries?.join(', ') || 'Any European country')}
- Budget: ${profile?.budget_range || 'Not specified'}
- Work Experience: ${profile?.work_experience || 0} years

Search Query: ${query || 'Best universities matching my profile'}

Respond with a JSON object:
{
  "summary": "2-3 sentence overview of recommendations",
  "universities": [
    {
      "name": "University Name",
      "country": "Country",
      "city": "City",
      "ranking": 50,
      "tuition_min": 0,
      "tuition_currency": "EUR",
      "programs": ["Program 1", "Program 2"],
      "match_score": 92,
      "description": "Why this university matches the student",
      "language_requirements": {"IELTS": 6.5},
      "deadline_fall": "January 15",
      "acceptance_rate": 35,
      "website": "https://university.edu"
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
    await refundCredits(user.id, 5, 'university_match')
    return NextResponse.json({ error: 'AI service error. Credits refunded.' }, { status: 500 })
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    await refundCredits(user.id, 5, 'university_match')
    return NextResponse.json({ error: 'Invalid AI response. Credits refunded.' }, { status: 500 })
  }

  const parsed = JSON.parse(jsonMatch[0])
  return NextResponse.json(parsed)
}
