import {
  Eye,
  Gauge,
  LayoutDashboard,
  Shield,
  Trophy,
  UserRound,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../../context/auth'
import { useImpersonation } from '../../context/impersonation'
import { cn } from '../../lib/cn'
import { Button } from '../ui/button'
import { IcpRecord } from './icp-record'

const navigation = [
  { to: '/dashboard', label: '控制台', icon: Gauge },
  { to: '/scenarios/shangyang-court', label: '工坊', icon: LayoutDashboard },
  { to: '/leaderboard', label: '排行榜', icon: Trophy },
]

export function AppShell({ children }: PropsWithChildren) {
  const { logout, user } = useAuth()
  const { impersonation, stopImpersonation } = useImpersonation()
  const navigationItems = user?.isAdmin
    ? [...navigation, { to: '/admin', label: '管理面板', icon: Shield }]
    : navigation

  return (
    <div className="flex min-h-screen flex-col bg-(--background)">
      {impersonation ? (
        <div className="sticky top-0 z-30 bg-(--warning) px-4 py-2 text-sm font-medium text-black sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
            <Eye className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              正在模拟选手视角：
              <span className="font-bold">{impersonation.displayName}</span>
              <span className="ml-2 font-mono text-xs opacity-70">
                (userId {impersonation.userId})
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                stopImpersonation()
                window.location.href = '/admin'
              }}
              className="rounded-md border border-black/40 bg-black/10 px-3 py-1 text-xs font-semibold transition hover:bg-black/20"
            >
              退出模拟
            </button>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <NavLink
            to="/"
            className="mr-4 text-sm font-black tracking-[0.24em] text-(--accent)"
          >
            AXIIA CUP
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground)',
                    isActive && 'bg-white/6 text-(--foreground)',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-(--foreground-subtle) transition hover:bg-white/6 hover:text-(--foreground)',
                  isActive && 'bg-white/8 text-(--foreground)',
                )
              }
            >
              <UserRound className="h-4 w-4" />
              <span className={cn(impersonation && 'italic')}>
                {impersonation?.displayName ?? user?.displayName ?? 'momo'}
              </span>
            </NavLink>
            <Button size="sm" variant="secondary" onClick={logout}>
              退出
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-(--border-soft) px-4 py-4 sm:px-6">
        <IcpRecord className="mx-auto w-full max-w-7xl" />
      </footer>
    </div>
  )
}
