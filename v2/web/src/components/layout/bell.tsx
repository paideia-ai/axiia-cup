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
      {/* #72 顶栏降噪（mock V30）：数字角标改小圆点，数量进 aria */}
      {unreadCount > 0
        ? (
          <span
            aria-label={`${unreadCount} 条未读`}
            className='absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-(--accent)'
          />
        )
        : null}
    </NavLink>
  )
}
