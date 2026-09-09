'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Dumbbell, TrendingUp, Apple, Moon,
  Calendar, History, Settings, LogOut, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/services/auth'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workout', label: 'Workout', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/nutrition', label: 'Nutrition', icon: Apple },
  { href: '/recovery', label: 'Recovery', icon: Moon },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 py-6 px-3">
      <div className="flex items-center gap-2 px-3 mb-8">
        <Activity className="h-6 w-6 text-orange-500" />
        <span className="font-bold text-white text-lg">FitTrack</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-orange-500/10 text-orange-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors mt-4"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </aside>
  )
}
