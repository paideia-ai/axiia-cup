import { Bell } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useAppState } from '../../mock/store'
import { cn } from '../../lib/cn'

/** 通知铃处处可见（#43）；#72 减噪：数字气泡 → 安静的小圆点（数量进 tooltip/aria） */
export function BellIndicator() {
  const { notifications } = useAppState()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <NavLink
      to='/notifications'
      title={unread > 0 ? `${unread} 条未读通知` : '通知'}
      aria-label={unread > 0 ? `通知（${unread} 条未读）` : '通知'}
      className={({ isActive }) =>
        cn(
          'relative inline-flex items-center justify-center rounded-full p-1.5 text-(--foreground-muted) transition hover:text-(--foreground)',
          isActive && 'text-(--foreground)',
        )}
    >
      <Bell className='h-4 w-4' />
      {unread > 0 && (
        <span className='absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-(--accent)' />
      )}
    </NavLink>
  )
}
