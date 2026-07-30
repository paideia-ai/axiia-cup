import { useParams } from 'react-router-dom'

import { tournaments } from '../api/client'
import { Card, CardContent } from '../components/ui/card'
import { useAsync } from '../lib/use-async'

export function StandingsPage() {
  const { tournamentId = '' } = useParams()
  const id = Number(tournamentId)
  const { data, error, loading } = useAsync(
    () => tournaments.standings(id),
    [id],
  )

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          锦标赛 #{id} 积分榜
        </h1>
        <p className='mt-1 text-xs text-(--foreground-muted)'>
          同胜场选手对阵，积分高者排名靠前
        </p>
      </div>

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : data && data.entries.length > 0
        ? (
          <Card>
            <CardContent className='overflow-x-auto pt-5'>
              <div className='space-y-2 md:hidden'>
                {data.entries.map((entry) => (
                  <div
                    key={entry.submissionID}
                    className='rounded-xl border border-(--border-soft) bg-white/2 px-4 py-3'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <span className='tabular-nums text-lg font-black text-(--foreground)'>
                          #{entry.rank}
                        </span>
                        <span className='font-mono text-xs text-(--foreground-subtle)'>
                          #{entry.submissionID}
                        </span>
                      </div>
                      <span className='tabular-nums text-sm font-semibold text-(--success)'>
                        {entry.winRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className='mt-1.5 flex items-center gap-3 text-xs text-(--foreground-muted)'>
                      <span>
                        {entry.wins}胜 {entry.losses}负
                      </span>
                      <span>
                        小分 {entry.buchholz}
                        <span className='ml-1 text-(--foreground-muted)/60'>
                          (排名依据)
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <table className='hidden w-full text-sm md:table'>
                <thead>
                  <tr className='text-left text-xs text-(--foreground-muted)'>
                    <th className='pb-2'>名次</th>
                    <th className='pb-2'>选手</th>
                    <th className='pb-2 text-right'>胜</th>
                    <th className='pb-2 text-right'>负</th>
                    <th
                      className='pb-2 text-right'
                      title='得分总和 · 同胜场时小分高者排名靠前'
                    >
                      小分
                    </th>
                    <th className='pb-2 text-right'>胜率</th>
                  </tr>
                </thead>
                <tbody className='text-(--foreground-subtle)'>
                  {data.entries.map((entry) => (
                    <tr
                      key={entry.submissionID}
                      className='border-t border-(--border-soft)'
                    >
                      <td className='py-2 font-semibold text-(--foreground)'>
                        {entry.rank}
                      </td>
                      <td className='py-2 font-mono text-xs'>
                        #{entry.submissionID}
                      </td>
                      <td className='py-2 text-right'>{entry.wins}</td>
                      <td className='py-2 text-right'>{entry.losses}</td>
                      <td className='py-2 text-right'>{entry.buchholz}</td>
                      <td className='py-2 text-right'>
                        {entry.winRate.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )
        : <p className='text-sm text-(--foreground-subtle)'>暂无积分数据。</p>}
    </div>
  )
}
