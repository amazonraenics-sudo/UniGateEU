import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminUniversitiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: universities } = await supabase.from('universities').select('*').order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Universities</h1>
        <p className="text-muted-foreground">{universities?.length ?? 0} universities in database</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All Universities</CardTitle></CardHeader>
        <CardContent>
          {universities && universities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Country</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Ranking</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Tuition</th>
                  </tr>
                </thead>
                <tbody>
                  {universities.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{u.name}</td>
                      <td className="py-3">
                        <Badge variant="outline">{u.country}</Badge>
                      </td>
                      <td className="py-3">{u.ranking ? `#${u.ranking}` : '—'}</td>
                      <td className="py-3">
                        {u.tuition_min === 0 ? 'Free' : u.tuition_min ? `€${u.tuition_min.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-8 text-center">No universities in database yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
