import { Link } from 'react-router-dom'

import { catalog, matches } from '../api/client'
import type { MatchSummary } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import type { RoleNames } from '../lib/outcome'
import { outcomeCopy, scenarioRoles } from '../lib/outcome'
import { useAsync } from '../lib/use-async'
import { tm } from '../testmode/mark'

function statusTone(summary: MatchSummary) {
  if (!summary.dispatched) return 'info' as const
  if (!summary.finished) return 'warning' as const
  return 'success' as const
}

// F7（#69 一眼知胜负）：完局行不再是裸「胜方 A/B」——用带视角的
// outcomeCopy（我方（商鞅）胜 / 对方（甘龙）胜 / 胜方 商鞅）。catalog 拉不
// 到角色名时 outcomeCopy 自己回退 甲方/乙方；open 历史（双方都非我）自然落
// 在「胜方 角色」。
function statusLabel(summary: MatchSummary, roles: RoleNames | null) {
  if (!summary.dispatched) return '排队中'
  if (!summary.finished) return '进行中'
  if (!summary.scored) return '判定中'
  return outcomeCopy(summary, roles) ??
    (summary.winner ? `胜方 ${summary.winner.toUpperCase()}` : '平局')
}

// F7（#66 成对约战）：相邻且同 challengeID 的行并成一组，挂在成对表头下；
// 落单的腿（另一条不相邻或被过滤）仍按单行渲染，只带 约战①/② 小标。
type HistoryRow =
  | { kind: 'single'; match: MatchSummary }
  | { kind: 'pair'; challengeID: number; legs: MatchSummary[] }

function groupHistory(list: MatchSummary[]): HistoryRow[] {
  const rows: HistoryRow[] = []
  for (const match of list) {
    const previous = rows[rows.length - 1]
    if (
      match.challengeID != null && previous?.kind === 'pair' &&
      previous.challengeID === match.challengeID
    ) {
      previous.legs.push(match)
      continue
    }
    if (match.challengeID != null) {
      rows.push({ kind: 'pair', challengeID: match.challengeID, legs: [match] })
    } else {
      rows.push({ kind: 'single', match })
    }
  }
  return rows.map((row): HistoryRow =>
    row.kind === 'pair' && row.legs.length === 1
      ? { kind: 'single', match: row.legs[0] }
      : row
  )
}

export function MatchesPage() {
  const { data, error, loading } = useAsync(
    async () => {
      const [list, scenarios] = await Promise.all([
        matches.list(),
        // 角色名尽力而为：目录失败不拖垮历史列表（文案回退 甲方/乙方）。
        catalog.scenarios().catch(() => null),
      ])
      return { list, scenarios }
    },
    [],
  )

  // 角色名映射走 lib/outcome 的共用构建（round4 评审 #10）。
  const roles: Record<string, RoleNames> = scenarioRoles(
    data?.scenarios?.scenarios ?? [],
  )
  const rolesOf = (summary: MatchSummary) => roles[summary.scenarioID] ?? null

  const matchCard = (summary: MatchSummary) => (
    <Link
      key={summary.id}
      to={`/matches/${summary.id}`}
      {...tm('L.match-card')}
    >
      <Card className='transition hover:border-(--foreground-muted)'>
        <CardContent className='flex items-center justify-between gap-3 py-4'>
          <div>
            <span
              className='font-mono text-sm text-(--foreground)'
              {...tm('L.match-id')}
            >
              对战 #{summary.id}
            </span>
            <span
              className='ml-3 text-xs text-(--foreground-muted)'
              {...tm('L.match-meta')}
            >
              {summary.scenarioTitle} · {summary.kind.toUpperCase()}
            </span>
            {/* F7 · #66：约战腿标出这是一对中的第几场。 */}
            {summary.challengeLeg != null
              ? (
                <span
                  className='ml-2 text-xs font-semibold text-(--accent)'
                  {...tm('L.challenge-leg')}
                >
                  约战{summary.challengeLeg === 1 ? '①' : '②'}
                </span>
              )
              : null}
          </div>
          <Badge tone={statusTone(summary)} {...tm('L.status-badge')}>
            {statusLabel(summary, rolesOf(summary))}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )

  // 成对表头：两条腿都判完时把两场结果并排写清（测试者的字面诉求）。
  const pairHeader = (challengeID: number, legs: MatchSummary[]) => {
    const outcomes = legs.map((leg) =>
      leg.finished && leg.scored ? outcomeCopy(leg, rolesOf(leg)) : null
    )
    return outcomes.every((outcome) => outcome != null)
      ? `约战 #${challengeID}：${outcomes.join(' · ')}`
      : `约战 #${challengeID}`
  }

  return (
    <div className='space-y-6'>
      <h1
        className='text-2xl font-black tracking-tight text-(--foreground)'
        {...tm('L.page-title')}
      >
        历史
      </h1>
      <p
        className='-mt-4 text-sm text-(--foreground-subtle)'
        {...tm('L.page-intro')}
      >
        {data?.list.open ? '全部对战记录。' : '你的全部对战记录。'}
      </p>

      {loading
        ? (
          <p
            className='text-sm text-(--foreground-subtle)'
            {...tm('L.loading')}
          >
            加载中…
          </p>
        )
        : error
        ? <p className='text-sm text-(--accent)' {...tm('L.error')}>{error}</p>
        : data && data.list.matches.length > 0
        ? (
          <div className='space-y-2' {...tm('L.match-list')}>
            {groupHistory(data.list.matches).map((row) => {
              if (row.kind === 'single') return matchCard(row.match)
              const legs = [...row.legs].sort(
                (a, b) => (a.challengeLeg ?? 0) - (b.challengeLeg ?? 0),
              )
              return (
                <div
                  key={`challenge-${row.challengeID}`}
                  className='space-y-2 rounded-xl border border-(--border-soft) bg-white/2 p-2'
                  {...tm('L.pair-group')}
                >
                  <p
                    className='px-2 pt-1 text-xs font-semibold text-(--foreground-subtle)'
                    {...tm('L.pair-header')}
                  >
                    {pairHeader(row.challengeID, legs)}
                  </p>
                  {legs.map(matchCard)}
                </div>
              )
            })}
          </div>
        )
        : (
          <p className='text-sm text-(--foreground-subtle)' {...tm('L.empty')}>
            {data?.list.open
              ? '还没有任何对战。到场景页构建智能体并发起对战。'
              : '还没有对战。到场景页构建智能体并发起对战。'}
          </p>
        )}
    </div>
  )
}
