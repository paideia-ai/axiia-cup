import { Bell } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useBell } from '../../api/sse'
import { cn } from '../../lib/cn'

export function BellIndicator() {
  const unreadCount = useBell(true)

  return (
    <NavLink
      to='/notifications'
      aria-label='通知'
      className={({ isActive }) =>
        cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-full text-(--foreground-subtle) transition hover:bg-white/6 hover:text-(--foreground)',
          isActive && 'bg-white/8 text-(--foreground)',
        )}
    >
      <Bell className='h-4 w-4' />
      {unreadCount > 0
        ? (
          <span className='absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-(--accent) px-1 text-[10px] font-bold text-white'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )
        : null}
    </NavLink>
  )
}
