import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const body = await request.json()
  const { action, university, program, country, background, goals, sop } = body

  const cost = action === 'generate' ? 10 : 5
  const feature = action === 'generate' ? 'sop_generation' : 'sop_critique'

  const deduct = await deductCredits(user.id, cost, feature)
  if (!deduct.success) return new Response(JSON.stringify({ error: deduct.error }), { status: 402 })

  let prompt = ''

  if (action === 'generate') {
    prompt = `Write a compelling Statement of Purpose for a student applying to ${program}${university ? ` at ${university}` : ''}${country ? ` in ${country}` : ''}.

Student Background:
${background || 'Not provided'}

Goals and Motivation:
${goals || 'Not provided'}

Write a professional, authentic 600-800 word SOP that:
1. Opens with a compelling hook
2. Highlights academic and professional achievements
3. Explains specific interest in the program and university
4. Shows clear career goals
5. Concludes with a strong statement

Write the SOP directly without any preamble or meta-commentary.`
  } else {
    prompt = `Critique the following Statement of Purpose and provide detailed, actionable feedback.

SOP:
${sop}

Provide feedback on:
1. **Overall Impression** (1-10 score with reasoning)
2. **Strengths** (3-4 specific strengths)
3. **Areas for Improvement** (3-5 specific issues with examples)
4. **Structure & Flow** feedback
5. **Specific Rewrites** — show 2-3 improved versions of weak sentences
6. **Final Recommendations** — top 3 changes to make

Be specific, constructive, and direct.`
  }

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
