import {
  Bot,
  History,
  LayoutDashboard,
  Shield,
  Trophy,
  UserRound,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/auth'
import { cn } from '../../lib/cn'
import { useScrollMemory } from '../../lib/scroll'
import { BattleStrip } from '../battle-strip'
import { Button } from '../ui/button'
import { BellIndicator } from './bell'
import { IcpRecord } from './icp-record'

// 一级导航（#73/#74）：历史在最右；移动端底栏与桌面顶栏同一份清单。
const navigation = [
  { to: '/scenarios', label: '场景', icon: LayoutDashboard },
  { to: '/my-agents', label: '我的智能体', icon: Bot },
  { to: '/tournaments', label: '排名', icon: Trophy },
  { to: '/matches', label: '历史', icon: History },
]

const COMMIT_SHA = (import.meta.env.VITE_COMMIT_SHA as string | undefined) ??
  'dev'

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
        {/* #72 顶栏降噪（mock V30）：h-16→h-12、激活态只变字色不加底 */}
        <div className='mx-auto flex h-12 w-full max-w-7xl items-center gap-3 px-4 sm:px-6'>
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
                    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-(--foreground-subtle) transition hover:text-(--foreground)',
                    isActive && 'text-(--foreground)',
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
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-(--foreground-subtle) transition hover:text-(--foreground)',
                  isActive && 'text-(--foreground)',
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
        {/* #72 对战条：只在派发处路由出现，空态自动隐藏（组件内自守）。 */}
        <BattleStrip />
        {children}
      </main>
      <footer className='hidden border-t border-(--border-soft) px-4 py-4 sm:px-6 md:block'>
        <div className='mx-auto flex w-full max-w-7xl items-center justify-between gap-3'>
          <IcpRecord />
          <code className='text-[10px] text-(--foreground-muted)'>
            build {COMMIT_SHA}
          </code>
        </div>
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
