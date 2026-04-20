import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminScholarshipsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: scholarships } = await supabase.from('scholarships').select('*').order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Scholarships</h1>
        <p className="text-muted-foreground">{scholarships?.length ?? 0} scholarships in database</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All Scholarships</CardTitle></CardHeader>
        <CardContent>
          {scholarships && scholarships.length > 0 ? (
            <div className="space-y-3">
              {scholarships.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.provider}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{s.country}</Badge>
                    {s.amount && <span className="text-sm font-medium">€{s.amount.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-8 text-center">No scholarships in database yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
