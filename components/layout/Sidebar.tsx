'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, University, FileText, BookOpen, Award,
  Globe, Mic, Calculator, CreditCard, LogOut, Coins, Settings, ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/universities',   label: 'Universities',  icon: University },
  { href: '/applications',   label: 'Applications',  icon: FileText },
  { href: '/documents',      label: 'Documents',     icon: BookOpen },
  { href: '/sop',            label: 'SOP Generator', icon: FileText },
  { href: '/scholarships',   label: 'Scholarships',  icon: Award },
  { href: '/visa',           label: 'Visa Guide',    icon: Globe },
  { href: '/interview-prep', label: 'Interview Prep',icon: Mic },
  { href: '/financial-aid',       label: 'Financial Aid',     icon: Calculator },
  { href: '/document-checklist',  label: 'Doc Checklist',     icon: ClipboardList },
  { href: '/credits',             label: 'Buy Credits',        icon: CreditCard },
]

interface SidebarProps {
  credits?: number
  role?: string
}

export default function Sidebar({ credits = 0, role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-[#1E3A5F] text-white w-64 min-h-screen">
      <div className="p-6 border-b border-[#2E86C1]/30">
        <h1 className="text-xl font-bold text-white">UniGateEU</h1>
        <p className="text-xs text-blue-300 mt-1">EU Admissions Platform</p>
      </div>

      <div className="p-4 border-b border-[#2E86C1]/30">
        <div className="flex items-center gap-2 bg-[#2E86C1]/20 rounded-lg p-3">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium">{credits} Credits</span>
          <Link href="/credits" className="ml-auto text-xs text-blue-300 hover:text-white">
            Top up
          </Link>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#2E86C1] text-white'
                  : 'text-blue-200 hover:bg-[#2E86C1]/30 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#2E86C1]/30 space-y-1">
        {role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-[#2E86C1]/30 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
