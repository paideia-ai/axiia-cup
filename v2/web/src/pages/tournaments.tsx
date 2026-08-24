import { Link } from 'react-router-dom'

import { tournaments } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { cn } from '../lib/cn'
import { useAsync } from '../lib/use-async'

// 阶段名（#32）：线上词汇是中文的「海选 / 正赛」，qualifier/main 只是传输值。
// 认不出的值原样显示，好过把新阶段渲染成空白。
function phaseName(phase: string): string {
  if (phase === 'qualifier') return '海选'
  if (phase === 'main') return '正赛'
  return phase
}

export function TournamentsPage() {
  const { data, error, loading } = useAsync(() => tournaments.list(), [])

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
        排名
      </h1>
      <p className='-mt-4 text-sm text-(--foreground-subtle)'>
        按锦标赛查看轮次与排位；玩家天梯待后续版本。
      </p>

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
                      {/* B4 按轮时间线：每轮一格，已完成/进行中/待配对一眼可辨。 */}
                      {tournament.rounds && tournament.rounds.length > 0
                        ? (
                          <ol className='mt-2 flex flex-wrap items-center gap-1.5'>
                            {tournament.rounds.map((round) => (
                              <li
                                key={round.id}
                                className={cn(
                                  'rounded-md border px-2 py-0.5 text-[11px]',
                                  round.status === 'done'
                                    ? 'border-(--success)/40 text-(--success)'
                                    : round.status === 'running'
                                    ? 'border-(--accent)/50 text-(--accent)'
                                    : 'border-(--border-soft) text-(--foreground-muted)',
                                )}
                                title={`${
                                  phaseName(round.phase)
                                } · ${round.status}`}
                              >
                                第 {round.roundNumber} 轮
                                <span className='ml-1 opacity-70'>
                                  {phaseName(round.phase)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )
                        : null}
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      {tournament.phase
                        ? (
                          <Badge tone='warning'>
                            {phaseName(tournament.phase)}
                          </Badge>
                        )
                        : null}
                      <Badge tone='info'>{tournament.status}</Badge>
                    </div>
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
