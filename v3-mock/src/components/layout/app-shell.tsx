import { Bot, History, LayoutDashboard, Trophy, UserRound } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { cn } from '../../lib/cn'
import { store, useAppState } from '../../mock/store'
import { OngoingBar } from '../ongoing-bar'
import { Button } from '../ui'
import { BellIndicator } from './bell'

// 全局头部（B8）；#73/#74：一级导航＝场景 · 我的智能体 · 排名 · 历史（+ 铃铛＝通知、头像＝设置）。
// #74（ks 原图纠偏，Yihan ✅ 08-07）：历史保留一级导航、居最右；桌面与移动底栏一致。
const navigation = [
  { to: '/scenarios', label: '场景', icon: LayoutDashboard },
  { to: '/my-agents', label: '我的智能体', icon: Bot },
  { to: '/rankings', label: '排名', icon: Trophy },
  { to: '/history', label: '历史', icon: History },
]

export function AppShell({ children }: PropsWithChildren) {
  const { user } = useAppState()
  const navigate = useNavigate()

  return (
    <div className='flex min-h-screen flex-col bg-(--background)'>
      {/* #72：顶栏减噪——更薄（h-12）、去玻璃重感、导航更安静 */}
      <header className='sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.9)] backdrop-blur-md'>
        <div className='mx-auto flex h-12 w-full max-w-7xl items-center gap-3 px-4 sm:px-6'>
          <NavLink to='/scenarios' className='mr-3 text-xs font-black tracking-[0.24em] text-(--accent)'>
            AXIIA CUP
          </NavLink>
          <nav className='hidden items-center gap-0.5 md:flex'>
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-(--foreground-muted) transition hover:text-(--foreground)',
                    isActive && 'text-(--foreground)',
                  )}
              >
                <item.icon className='h-3.5 w-3.5' />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className='ml-auto flex items-center gap-1.5'>
            <BellIndicator />
            <NavLink
              to='/settings'
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-(--foreground-muted) transition hover:text-(--foreground)',
                  isActive && 'text-(--foreground)',
                )}
            >
              <UserRound className='h-3.5 w-3.5' />
              <span>{user?.name ?? '选手'}</span>
            </NavLink>
            <Button
              size='sm'
              variant='ghost'
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
        {/* 「进行中的对战」条（#72）：仅派发处渲染、空则隐藏、可折叠——判断在组件内部 */}
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
