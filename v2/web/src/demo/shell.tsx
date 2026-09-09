import {
  Bell,
  Bot,
  History,
  LayoutDashboard,
  Trophy,
  UserRound,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Modal } from './modal'

const navigation = [
  { label: '场景', icon: LayoutDashboard },
  { label: '我的智能体', icon: Bot },
  { label: '排名', icon: Trophy },
  { label: '历史', icon: History },
]
export function DemoShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const contentWidth = pathname.startsWith('/scenarios/')
    ? 'max-w-7xl'
    : 'max-w-[1040px]'
  const [outside, setOutside] = useState<string | null>(null)
  return (
    <div className='flex min-h-screen flex-col bg-(--background)'>
      <header className='sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.82)] backdrop-blur-xl'>
        <div className='mx-auto flex h-12 w-full max-w-[1040px] items-center gap-3 px-4 sm:px-6'>
          <Link
            to='/my-agents'
            className='mr-4 shrink-0 text-sm font-black tracking-[0.24em] text-(--accent)'
          >
            AXIIA CUP
          </Link>
          <nav
            aria-label='主导航'
            className='hidden items-center gap-1 md:flex'
          >
            {navigation.map(({ label, icon: Icon }) =>
              label === '我的智能体'
                ? (
                  <Link
                    key={label}
                    to='/my-agents'
                    aria-current='page'
                    className='inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium'
                  >
                    <Icon className='h-4 w-4' />
                    {label}
                  </Link>
                )
                : (
                  <button
                    type='button'
                    key={label}
                    onClick={() => setOutside(label)}
                    className='inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-(--foreground-subtle) transition hover:text-(--foreground)'
                  >
                    <Icon className='h-4 w-4' />
                    {label}
                  </button>
                )
            )}
          </nav>
          <div className='ml-auto flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              aria-label='通知'
              onClick={() => setOutside('通知')}
            >
              <Bell className='h-4 w-4' />
            </Button>
            <button
              type='button'
              onClick={() => setOutside('账户设置')}
              className='inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-(--foreground-subtle)'
            >
              <UserRound className='h-4 w-4' />
              <span className='hidden sm:inline'>kesou</span>
            </button>
            <Button
              size='sm'
              variant='secondary'
              onClick={() => setOutside('退出')}
            >
              退出
            </Button>
          </div>
        </div>
      </header>
      <main
        className={`mx-auto flex w-full ${contentWidth} flex-1 flex-col gap-6 px-4 py-8 pb-24 sm:px-6 md:py-10 md:pb-10`}
      >
        {children}
      </main>
      <footer className='hidden border-t border-(--border-soft) px-6 py-4 md:block'>
        <div className='mx-auto flex max-w-[1040px] justify-between text-xs text-(--foreground-subtle)'>
          <span>交互演示 · 示例数据，仅保存在此浏览器</span>
          <span>AXIIA CUP</span>
        </div>
      </footer>
      <nav
        aria-label='移动导航'
        className='fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-(--border-soft) bg-[rgba(12,12,12,0.92)] backdrop-blur-xl md:hidden'
      >
        {navigation.map(({ label, icon: Icon }) =>
          label === '我的智能体'
            ? (
              <Link
                key={label}
                to='/my-agents'
                aria-current='page'
                className='flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-(--accent)'
              >
                <Icon className='h-5 w-5' />
                {label}
              </Link>
            )
            : (
              <button
                type='button'
                key={label}
                onClick={() => setOutside(label)}
                className='flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-(--foreground-subtle)'
              >
                <Icon className='h-5 w-5' />
                {label}
              </button>
            )
        )}
      </nav>
      {outside && (
        <Modal title={outside} onClose={() => setOutside(null)}>
          <p className='text-sm text-(--foreground-subtle)'>
            此演示包含我的智能体、智能体主页、智能体构建器和场景信息。{outside}沿用现有产品，本演示未连接该功能。
          </p>
          <Button onClick={() => setOutside(null)}>继续体验</Button>
        </Modal>
      )}
    </div>
  )
}
