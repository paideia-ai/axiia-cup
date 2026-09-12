import {
  Bot,
  History,
  LayoutDashboard,
  Shield,
  Trophy,
  UserRound,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/auth'
import { cn } from '../../lib/cn'
import { useScrollMemory } from '../../lib/scroll'
import { protectedLoginUrl } from '../../lib/login-return'
import { BattleStrip } from '../battle-strip'
import { Button } from '../ui/button'
import { BellIndicator } from './bell'
import { IcpRecord } from './icp-record'
import { tm } from '../../testmode/mark'

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
  const location = useLocation()
  const { pathname } = location
  useScrollMemory()
  const navigationItems = !account
    ? navigation.filter((item) => item.to === '/scenarios')
    : account.isAdmin
    ? [...navigation, { to: '/admin', label: '管理面板', icon: Shield }]
    : navigation
  const contentWidth = 'max-w-[1040px]'
  const navigationActive = (to: string) =>
    to === '/my-agents'
      ? pathname === '/my-agents' || pathname.startsWith('/agents/')
      : pathname === to || pathname.startsWith(`${to}/`)

  return (
    <div className='flex min-h-screen flex-col bg-(--background)'>
      <header
        {...tm('NAV.header')}
        className='sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.82)] backdrop-blur-xl'
      >
        {/* #72 顶栏保持 48px；当前项只加极淡中性底色。 */}
        <div
          className={`mx-auto flex h-12 w-full ${contentWidth} items-center gap-3 px-4 sm:px-6`}
        >
          <NavLink
            {...tm('NAV.logo')}
            to='/scenarios'
            className='mr-4 text-sm font-black tracking-[0.24em] text-(--accent)'
          >
            AXIIA CUP
          </NavLink>
          <nav
            {...tm('NAV.desktop-nav')}
            className='hidden items-center gap-1 md:flex'
          >
            {navigationItems.map((item) => {
              const active = navigationActive(item.to)
              return (
                <Link
                  key={item.to}
                  {...tm('NAV.nav-link')}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-(--foreground-subtle) transition hover:text-(--foreground)',
                    active && 'text-(--foreground)',
                  )}
                >
                  <item.icon className='h-4 w-4' />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className='ml-auto flex items-center gap-2'>
            {account
              ? (
                <>
                  <BellIndicator />
                  <NavLink
                    {...tm('NAV.settings-link')}
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
                    {...tm('NAV.logout-button')}
                    data-testid='logout'
                    size='sm'
                    variant='secondary'
                    onClick={() => {
                      void logout().then(() => navigate('/', { replace: true }))
                    }}
                  >
                    退出
                  </Button>
                </>
              )
              : (
                <Link
                  to={protectedLoginUrl(location)}
                  className='rounded-md px-3 py-1.5 text-sm font-medium text-(--foreground-subtle) transition hover:text-(--foreground)'
                >
                  登录
                </Link>
              )}
          </div>
        </div>
      </header>
      <main
        className={`mx-auto flex w-full ${contentWidth} flex-1 flex-col gap-6 px-4 py-8 pb-24 sm:px-6 md:pb-8`}
      >
        {/* #72 对战条：只在派发处路由出现，空态自动隐藏（组件内自守）。 */}
        {account ? <BattleStrip /> : null}
        {children}
      </main>
      <footer
        {...tm('NAV.footer')}
        className='hidden border-t border-(--border-soft) px-4 py-4 sm:px-6 md:block'
      >
        <div
          className={`mx-auto flex w-full ${contentWidth} items-center justify-between gap-3`}
        >
          <IcpRecord />
          <code
            {...tm('NAV.build-sha')}
            className='text-[10px] text-(--foreground-muted)'
          >
            build {COMMIT_SHA}
          </code>
        </div>
      </footer>
      <nav
        {...tm('NAV.mobile-nav')}
        className='fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-(--border-soft) bg-[rgba(12,12,12,0.92)] backdrop-blur-xl md:hidden'
      >
        {navigationItems.map((item) => {
          const active = navigationActive(item.to)
          return (
            <Link
              key={item.to}
              {...tm('NAV.mobile-nav-link')}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-(--foreground-muted) transition',
                active && 'text-(--accent)',
              )}
            >
              <item.icon className='h-5 w-5' />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
