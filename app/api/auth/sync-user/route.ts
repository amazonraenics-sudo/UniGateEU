import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Called after login/register to ensure the users row exists with 10 free credits.
// The Supabase trigger handles this automatically, but this is a reliable fallback.
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  const { data: existing } = await serviceClient
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existing) {
    await serviceClient.from('users').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      credits: 10,
      role: 'user',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ ok: true })
}
