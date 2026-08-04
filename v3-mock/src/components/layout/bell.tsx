import { Bell } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useAppState } from '../../mock/store'
import { cn } from '../../lib/cn'

/** 通知铃处处可见，含未读数（#43） */
export function BellIndicator() {
  const { notifications } = useAppState()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <NavLink
      to='/notifications'
      className={({ isActive }) =>
        cn(
          'relative inline-flex items-center justify-center rounded-full p-2 text-(--foreground-subtle) transition hover:bg-white/6 hover:text-(--foreground)',
          isActive && 'bg-white/8 text-(--foreground)',
        )}
    >
      <Bell className='h-4.5 w-4.5' />
      {unread > 0 && (
        <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--accent) px-1 text-[10px] font-bold text-white'>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </NavLink>
  )
}
