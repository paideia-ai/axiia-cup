import { Link } from 'react-router-dom'

import { tournaments } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { useAsync } from '../lib/use-async'

export function TournamentsPage() {
  const { data, error, loading } = useAsync(() => tournaments.list(), [])

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
        锦标赛
      </h1>

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : data && data.tournaments.length > 0
        ? (
          <div className='space-y-2'>
            {data.tournaments.map((tournament) => (
              <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
                <Card className='transition hover:border-(--foreground-muted)'>
                  <CardContent className='flex items-center justify-between gap-3 py-4'>
                    <div>
                      <span className='font-mono text-sm text-(--foreground)'>
                        锦标赛 #{tournament.id}
                      </span>
                      <span className='ml-3 text-xs text-(--foreground-muted)'>
                        {tournament.scenarioID} · 第 {tournament.currentRound}/
                        {tournament.totalRounds} 轮
                      </span>
                    </div>
                    <Badge tone='info'>{tournament.status}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )
        : <p className='text-sm text-(--foreground-subtle)'>暂无锦标赛。</p>}
    </div>
  )
}
