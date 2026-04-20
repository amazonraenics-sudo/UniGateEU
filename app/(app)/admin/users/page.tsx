import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Users</h1>
        <p className="text-muted-foreground">{users?.length ?? 0} registered users</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Credits</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{u.full_name || '—'}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3">{u.credits ?? 0}</td>
                    <td className="py-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>{u.role}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
