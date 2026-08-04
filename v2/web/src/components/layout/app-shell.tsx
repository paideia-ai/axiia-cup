import {
  LayoutDashboard,
  Shield,
  Swords,
  Trophy,
  UserRound,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/auth'
import { cn } from '../../lib/cn'
import { useScrollMemory } from '../../lib/scroll'
import { Button } from '../ui/button'
import { BellIndicator } from './bell'
import { IcpRecord } from './icp-record'

const navigation = [
  { to: '/scenarios', label: '工坊', icon: LayoutDashboard },
  { to: '/matches', label: '对战', icon: Swords },
  { to: '/tournaments', label: '锦标赛', icon: Trophy },
]

export function AppShell({ children }: PropsWithChildren) {
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  useScrollMemory()
  const navigationItems = account?.isAdmin
    ? [...navigation, { to: '/admin', label: '管理面板', icon: Shield }]
    : navigation

  return (
    <div className='flex min-h-screen flex-col bg-(--background)'>
      <header className='sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.82)] backdrop-blur-xl'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6'>
          <NavLink
            to='/scenarios'
            className='mr-4 text-sm font-black tracking-[0.24em] text-(--accent)'
          >
            AXIIA CUP
          </NavLink>
          <nav className='hidden items-center gap-1 md:flex'>
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground)',
                    isActive && 'bg-white/6 text-(--foreground)',
                  )}
              >
                <item.icon className='h-4 w-4' />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className='ml-auto flex items-center gap-2'>
            <BellIndicator />
            <NavLink
              to='/settings'
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-(--foreground-subtle) transition hover:bg-white/6 hover:text-(--foreground)',
                  isActive && 'bg-white/8 text-(--foreground)',
                )}
            >
              <UserRound className='h-4 w-4' />
              <span>{account?.displayName ?? '选手'}</span>
            </NavLink>
            <Button
              data-testid='logout'
              size='sm'
              variant='secondary'
              onClick={() => {
                void logout().then(() => navigate('/', { replace: true }))
              }}
            >
              退出
            </Button>
          </div>
        </div>
      </header>
      <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 pb-24 sm:px-6 md:pb-8'>
        {children}
      </main>
      <footer className='hidden border-t border-(--border-soft) px-4 py-4 sm:px-6 md:block'>
        <IcpRecord className='mx-auto w-full max-w-7xl' />
      </footer>
      <nav className='fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-(--border-soft) bg-[rgba(12,12,12,0.92)] backdrop-blur-xl md:hidden'>
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-(--foreground-muted) transition',
                isActive && 'text-(--accent)',
              )}
          >
            <item.icon className='h-5 w-5' />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
