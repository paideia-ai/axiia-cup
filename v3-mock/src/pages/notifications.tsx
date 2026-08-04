// I — 通知（B5）：8 种通知（#53）、分组（PVP/锦标赛 优先于 PVE/系统）、
// 已读 / 清除、深链；alpha 仅站内（#43）。
import { CheckCheck, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge, Button, Card, EmptyState } from '../components/ui'
import { cn } from '../lib/cn'
import { store, useAppState } from '../mock/store'
import type { AppNotification, NotificationKind } from '../mock/types'

// (#53) 8 种通知的中文标签
const KIND_LABEL: Record<NotificationKind, string> = {
  'match-done': '对局完成',
  challenged: '被挑战',
  'automatch-result': '自动匹配结果',
  'tournament-round': '锦标赛进程',
  'tournament-invite': '锦标赛资格',
  'gate-unlocked': '门槛达成',
  'entry-version-reminder': '参赛版本提醒',
  announcement: '系统公告',
}

// (#53) 优先级：PVP/锦标赛 > PVE/系统
const PVP_KINDS: NotificationKind[] = ['challenged', 'automatch-result', 'tournament-round', 'tournament-invite']
const PVE_KINDS: NotificationKind[] = ['match-done', 'gate-unlocked', 'entry-version-reminder', 'announcement']

function NotificationRow({ n }: { n: AppNotification }) {
  const navigate = useNavigate()
  return (
    <li>
      <button
        type='button'
        onClick={() => {
          store.markNotificationRead(n.id)
          if (n.link) navigate(n.link)
        }}
        className={cn(
          'flex w-full flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition',
          n.read
            ? 'border-transparent hover:bg-white/[0.03]'
            : 'border-(--border-soft) bg-white/[0.04] hover:bg-white/[0.06]',
        )}
      >
        <div className='flex flex-wrap items-center gap-2'>
          {!n.read && <span className='h-2 w-2 rounded-full bg-(--accent)' />}
          <Badge tone={PVP_KINDS.includes(n.kind) ? 'accent' : 'neutral'}>{KIND_LABEL[n.kind]}</Badge>
          <span className={cn('text-sm font-semibold', n.read ? 'text-(--foreground-subtle)' : 'text-(--foreground)')}>
            {n.title}
          </span>
          <span className='ml-auto text-[11px] text-(--foreground-muted)'>
            {new Date(n.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className='text-sm leading-relaxed text-(--foreground-subtle)'>{n.body}</p>
        {n.link && <span className='text-xs font-semibold text-(--accent)'>点击查看 →</span>}
      </button>
    </li>
  )
}

function NotificationGroup({ title, items }: { title: string; items: AppNotification[] }) {
  if (items.length === 0) return null
  return (
    <Card>
      <p className='panel-label'>{title}</p>
      <ul className='flex flex-col gap-1'>
        {items.map((n) => (
          <NotificationRow key={n.id} n={n} />
        ))}
      </ul>
    </Card>
  )
}

export function NotificationsPage() {
  const { notifications } = useAppState()
  const pvp = notifications.filter((n) => PVP_KINDS.includes(n.kind))
  const pve = notifications.filter((n) => PVE_KINDS.includes(n.kind))
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='page-eyebrow'>I · 通知</p>
          <h1 className='page-title'>通知中心</h1>
        </div>
        <div className='flex items-center gap-2'>
          <Button size='sm' variant='secondary' disabled={unread === 0} onClick={() => store.markAllRead()}>
            <CheckCheck className='h-4 w-4' />
            全部已读
          </Button>
          <Button size='sm' variant='danger' disabled={notifications.length === 0} onClick={() => store.clearNotifications()}>
            <Trash2 className='h-4 w-4' />
            清空
          </Button>
        </div>
      </div>

      {/* (#43) alpha 仅站内通知；离线期间的通知持久保存 */}
      <p className='text-xs text-(--foreground-muted)'>alpha 仅站内通知；离线期间的通知会保存。</p>

      {notifications.length === 0 ? (
        <EmptyState title='没有通知' hint='对局完成、被挑战、锦标赛进程等消息会出现在这里。' />
      ) : (
        <div className='flex flex-col gap-4'>
          <NotificationGroup title='PVP / 锦标赛' items={pvp} />
          <NotificationGroup title='PVE / 系统' items={pve} />
        </div>
      )}
    </div>
  )
}
