import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import {
  University, FileText, Award, Globe, Mic,
  Calculator, ArrowRight, Coins, TrendingUp
} from 'lucide-react'

const AI_TOOLS = [
  { href: '/universities', label: 'University Match', desc: 'AI-powered university recommendations', icon: University, cost: 5, color: 'bg-blue-500' },
  { href: '/sop', label: 'SOP Generator', desc: 'Generate and refine your statement', icon: FileText, cost: 10, color: 'bg-purple-500' },
  { href: '/scholarships', label: 'Scholarship Match', desc: 'Find scholarships for your profile', icon: Award, cost: 5, color: 'bg-yellow-500' },
  { href: '/visa', label: 'Visa Guide', desc: 'Country-specific visa requirements', icon: Globe, cost: 3, color: 'bg-green-500' },
  { href: '/interview-prep', label: 'Interview Prep', desc: 'AI mock interviews with feedback', icon: Mic, cost: 10, color: 'bg-red-500' },
  { href: '/financial-aid', label: 'Financial Aid', desc: 'Budget and aid calculator', icon: Calculator, cost: 3, color: 'bg-orange-500' },
]

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: applications }, { data: documents }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('applications').select('*, university:universities(name, country)').eq('user_id', user.id).limit(5),
    supabase.from('documents').select('*').eq('user_id', user.id),
  ])

  const credits = profile?.credits ?? 0
  const appCount = applications?.length ?? 0
  const docCount = documents?.length ?? 0

  const statusColors: Record<string, string> = {
    researching: 'bg-gray-100 text-gray-700',
    preparing: 'bg-blue-100 text-blue-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    waitlisted: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Dashboard</h1>
        <p className="text-muted-foreground">Your admissions pipeline at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Coins className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{credits}</p>
                <p className="text-sm text-muted-foreground">Credits Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <University className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appCount}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{docCount}</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {credits < 10 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <p className="text-sm text-yellow-800">Running low on credits! Top up to continue using AI features.</p>
            <Link href="/credits" className="text-sm font-medium text-yellow-700 underline">Buy Credits</Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Pipeline</CardTitle>
            <CardDescription>Your university applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applications && applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{app.university?.name}</p>
                      <p className="text-xs text-muted-foreground">{app.program} · {app.university?.country}</p>
                    </div>
                    <Badge className={`text-xs ${statusColors[app.status] || 'bg-gray-100'}`} variant="outline">
                      {app.status}
                    </Badge>
                  </div>
                ))}
                <Link href="/applications" className="flex items-center gap-1 text-sm text-[#2E86C1] hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <University className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No applications yet.</p>
                <Link href="/universities" className="text-sm text-[#2E86C1] hover:underline">
                  Find universities →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Tools</CardTitle>
            <CardDescription>Powered by Claude AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {AI_TOOLS.map(tool => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`p-2 ${tool.color} rounded-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{tool.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{tool.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {tool.cost} cr
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
