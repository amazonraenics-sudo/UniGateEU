import { createClient } from '@/lib/supabase/server'

export async function deductCredits(userId: string, amount: number, feature: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single()

  if (fetchError || !user) return { success: false, error: 'User not found' }
  if (user.credits < amount) return { success: false, error: `Insufficient credits. You need ${amount} but have ${user.credits}.` }

  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: user.credits - amount })
    .eq('id', userId)

  if (updateError) return { success: false, error: 'Failed to deduct credits' }

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    type: 'usage',
    feature,
    description: `Used ${amount} credits for ${feature}`,
    created_at: new Date().toISOString(),
  })

  return { success: true }
}

export async function refundCredits(userId: string, amount: number, feature: string): Promise<void> {
  const supabase = createClient()
  const { data: user } = await supabase.from('users').select('credits').eq('id', userId).single()
  if (!user) return
  await supabase.from('users').update({ credits: user.credits + amount }).eq('id', userId)
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type: 'refund',
    feature,
    description: `Refunded ${amount} credits for failed ${feature}`,
    created_at: new Date().toISOString(),
  })
}

export async function getUser(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
