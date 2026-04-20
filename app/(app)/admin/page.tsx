import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Users, University, Award, Globe } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ count: userCount }, { count: uniCount }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('universities').select('*', { count: 'exact', head: true }),
  ])

  const sections = [
    { href: '/admin/users', label: 'Manage Users', desc: `${userCount ?? 0} total users`, icon: Users, color: 'bg-blue-500' },
    { href: '/admin/universities', label: 'Universities', desc: `${uniCount ?? 0} universities`, icon: University, color: 'bg-green-500' },
    { href: '/admin/scholarships', label: 'Scholarships', desc: 'Manage scholarships', icon: Award, color: 'bg-yellow-500' },
    { href: '/admin/visa', label: 'Visa Info', desc: 'Manage visa guides', icon: Globe, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Admin Panel</h1>
        <p className="text-muted-foreground">Manage UniGateEU platform</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className={`p-3 ${s.color} rounded-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{s.label}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
