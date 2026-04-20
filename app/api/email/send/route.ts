import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, subject, html } = await request.json()

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ message: 'Email service not configured' }, { status: 200 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'UniGateEU <noreply@unigateu.com>',
      to,
      subject,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id })
}
