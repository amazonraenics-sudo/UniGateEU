import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits, refundCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { topic, category, target_audience } = await request.json()
  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 })

  const deduct = await deductCredits(user.id, 5, 'blog_generation')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const prompt = `You are an expert content writer for UniGateEU, a platform that helps international students apply to European universities.

Write a comprehensive, engaging blog post about: "${topic}"

Category: ${category || 'Tips & Guides'}
Target audience: ${target_audience || 'International students applying to European universities'}

Requirements:
- Length: 800–1200 words
- Tone: Helpful, authoritative, conversational — not academic
- Structure: Use clear headings and subheadings (use **bold text** for headings, not markdown #)
- Include practical, specific, actionable advice
- Reference real universities, scholarships, or processes where appropriate
- End with a brief encouraging conclusion

Respond with a JSON object:
{
  "title": "SEO-optimised post title",
  "excerpt": "2-3 sentence summary for the blog card (max 200 chars)",
  "content": "Full post content with **bold headings**...",
  "suggested_slug": "url-friendly-slug-from-title"
}`

  let message
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    await refundCredits(user.id, 5, 'blog_generation')
    return NextResponse.json({ error: 'AI service error. Credits refunded.' }, { status: 500 })
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    await refundCredits(user.id, 5, 'blog_generation')
    return NextResponse.json({ error: 'Invalid AI response. Credits refunded.' }, { status: 500 })
  }

  const parsed = JSON.parse(jsonMatch[0])
  return NextResponse.json(parsed)
}
