import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, answer, program } = await request.json()

  const prompt = `Evaluate this interview answer for a ${program || 'graduate program'} application.

Question: ${question}

Student's Answer: ${answer}

Provide feedback on:
1. **Score**: X/10 with brief reasoning
2. **Strengths**: What works well
3. **Weaknesses**: What could be improved
4. **Improved Version**: A stronger version of the answer
5. **Tips**: 2-3 specific tips for improvement

Keep feedback constructive, specific, and under 300 words.`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const feedback = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ feedback })
}
