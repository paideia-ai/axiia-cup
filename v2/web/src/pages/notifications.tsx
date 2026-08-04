import { Link } from 'react-router-dom'

import { notifications } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAsync } from '../lib/use-async'

function kindLabel(kind: string): string {
  if (kind === 'battle_finished') return '对战结束'
  return kind
}

export function NotificationsPage() {
  const { data, error, loading, reload } = useAsync(
    () => notifications.list(),
    [],
  )

  const markRead = async (id: number) => {
    await notifications.markRead(id).catch(() => {})
    reload()
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          通知
        </h1>
        {data && data.unreadCount > 0
          ? <Badge tone='accent'>{data.unreadCount} 条未读</Badge>
          : null}
      </div>

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : data && data.notifications.length > 0
        ? (
          <div className='space-y-2'>
            {data.notifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className='flex items-center justify-between gap-3 py-4'>
                  <div className='flex items-center gap-3'>
                    {!notification.read
                      ? (
                        <span className='h-2 w-2 shrink-0 rounded-full bg-(--accent)' />
                      )
                      : (
                        <span className='h-2 w-2 shrink-0 rounded-full bg-(--border)' />
                      )}
                    <div>
                      <p className='text-sm text-(--foreground)'>
                        {kindLabel(notification.kind)}
                      </p>
                      {notification.matchID != null
                        ? (
                          <Link
                            to={`/matches/${notification.matchID}`}
                            className='text-xs text-(--accent)'
                          >
                            查看对战 #{notification.matchID}
                          </Link>
                        )
                        : null}
                    </div>
                  </div>
                  {!notification.read
                    ? (
                      <Button
                        size='sm'
                        variant='secondary'
                        onClick={() => void markRead(notification.id)}
                      >
                        标为已读
                      </Button>
                    )
                    : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )
        : <p className='text-sm text-(--foreground-subtle)'>暂无通知。</p>}
    </div>
  )
}
