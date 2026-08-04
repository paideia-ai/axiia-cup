import { LayoutDashboard, Trophy, UserRound, History } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { cn } from '../../lib/cn'
import { store, useAppState } from '../../mock/store'
import { OngoingBar } from '../ongoing-bar'
import { Button } from '../ui'
import { BellIndicator } from './bell'

// 全局头部承载 D / G / I / K 入口（B8）；I 走铃铛。
const navigation = [
  { to: '/scenarios', label: '场景', icon: LayoutDashboard },
  { to: '/rankings', label: '排名', icon: Trophy },
  { to: '/history', label: '历史', icon: History },
]

export function AppShell({ children }: PropsWithChildren) {
  const { user } = useAppState()
  const navigate = useNavigate()

  return (
    <div className='flex min-h-screen flex-col bg-(--background)'>
      <header className='sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.82)] backdrop-blur-xl'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6'>
          <NavLink to='/scenarios' className='mr-4 text-sm font-black tracking-[0.24em] text-(--accent)'>
            AXIIA CUP
          </NavLink>
          <nav className='hidden items-center gap-1 md:flex'>
            {navigation.map((item) => (
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
              <span>{user?.name ?? '选手'}</span>
            </NavLink>
            <Button
              size='sm'
              variant='secondary'
              onClick={() => {
                store.logout()
                navigate('/', { replace: true })
              }}
            >
              退出
            </Button>
          </div>
        </div>
      </header>
      <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 pb-24 sm:px-6 md:pb-8'>
        {/* 「进行中的对战」条：派发处可见（A1/A5）。mock 决定：所有登录页可见（见 DECISIONS.md） */}
        <OngoingBar />
        {children}
      </main>
      <nav className='fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-(--border-soft) bg-[rgba(12,12,12,0.92)] backdrop-blur-xl md:hidden'>
        {navigation.map((item) => (
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
