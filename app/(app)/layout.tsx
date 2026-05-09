import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <aside className="hidden md:flex flex-shrink-0">
        <Sidebar credits={profile?.credits ?? 0} role={profile?.role} />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav
          userName={profile?.full_name}
          userEmail={user.email}
          avatarUrl={profile?.avatar_url}
          credits={profile?.credits ?? 0}
          role={profile?.role}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
