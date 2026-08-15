import { Link } from 'react-router-dom'

import { matches } from '../api/client'
import type { MatchSummary } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { useAsync } from '../lib/use-async'

function statusTone(summary: MatchSummary) {
  if (!summary.dispatched) return 'info' as const
  if (!summary.finished) return 'warning' as const
  return 'success' as const
}

function statusLabel(summary: MatchSummary) {
  if (!summary.dispatched) return '排队中'
  if (!summary.finished) return '进行中'
  if (!summary.scored) return '判定中'
  return summary.winner ? `胜方 ${summary.winner.toUpperCase()}` : '平局'
}

export function MatchesPage() {
  const { data, error, loading } = useAsync(() => matches.list(), [])

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
        历史
      </h1>
      <p className='-mt-4 text-sm text-(--foreground-subtle)'>
        {data?.open ? '全部对战记录。' : '你的全部对战记录。'}
      </p>

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : data && data.matches.length > 0
        ? (
          <div className='space-y-2'>
            {data.matches.map((summary) => (
              <Link key={summary.id} to={`/matches/${summary.id}`}>
                <Card className='transition hover:border-(--foreground-muted)'>
                  <CardContent className='flex items-center justify-between gap-3 py-4'>
                    <div>
                      <span className='font-mono text-sm text-(--foreground)'>
                        对战 #{summary.id}
                      </span>
                      <span className='ml-3 text-xs text-(--foreground-muted)'>
                        {summary.scenarioTitle} · {summary.kind.toUpperCase()}
                      </span>
                    </div>
                    <Badge tone={statusTone(summary)}>
                      {statusLabel(summary)}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )
        : (
          <p className='text-sm text-(--foreground-subtle)'>
            {data?.open
              ? '还没有任何对战。到场景页构建智能体并发起对战。'
              : '还没有对战。到场景页构建智能体并发起对战。'}
          </p>
        )}
    </div>
  )
}
