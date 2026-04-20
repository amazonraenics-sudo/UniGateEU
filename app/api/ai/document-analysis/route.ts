import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic/client'
import { deductCredits } from '@/lib/credits'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId, documentName, fileUrl } = await request.json()

  const deduct = await deductCredits(user.id, 8, 'document_analysis')
  if (!deduct.success) return NextResponse.json({ error: deduct.error }, { status: 402 })

  const prompt = `Analyze this academic document: "${documentName}"
${fileUrl ? `Document URL: ${fileUrl}` : ''}

Provide a comprehensive analysis including:
1. Document type and purpose
2. Overall quality assessment (score out of 10)
3. Key strengths
4. Areas for improvement
5. Specific recommendations for European university applications
6. Missing elements that should be added
7. Formatting and presentation feedback

Be specific and actionable in your feedback. Focus on what European admissions committees look for.`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const analysis = message.content[0].type === 'text' ? message.content[0].text : ''

  await supabase.from('documents').update({
    ai_analysis: analysis,
    status: 'analyzed',
    updated_at: new Date().toISOString(),
  }).eq('id', documentId)

  return NextResponse.json({ analysis })
}
