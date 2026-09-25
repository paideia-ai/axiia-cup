import { PageLoading } from '../components/page-loading'
import { Check, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { agents, npcs } from '../api/client'
import { Button } from '../components/ui/button'
import { positiveID } from '../lib/identity-links'

import type { MatchSummary } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import type { RoleNames } from '../lib/outcome'
import { outcomeCopy, scenarioRoles } from '../lib/outcome'
import { usePageQuery } from '../lib/use-page-query'
import { catalogQuery, matchesQuery } from '../lib/navigation-queries'
import { tm } from '../testmode/mark'

const ALL_SCENARIOS = '__all_scenarios__'

function statusTone(summary: MatchSummary) {
  if (summary.finished) return 'success' as const
  if (!summary.dispatched) return 'info' as const
  if (!summary.finished) return 'warning' as const
  return 'success' as const
}

// F7（#69 一眼知胜负）：完局行不再是裸「胜方 A/B」——用带视角的
// outcomeCopy（我方（商鞅）胜 / 对方（甘龙）胜 / 胜方 商鞅）。catalog 拉不
// 到角色名时 outcomeCopy 自己回退 甲方/乙方；open 历史（双方都非我）自然落
// 在「胜方 角色」。
function statusLabel(summary: MatchSummary, roles: RoleNames | null) {
  if (!summary.finished) return summary.dispatched ? '进行中' : '排队中'
  if (!summary.scored) return '未计分'
  return outcomeCopy(summary, roles) ??
    (summary.winner ? `胜方 ${summary.winner.toUpperCase()}` : '平局')
}

// F7（#66 历史双场约战）：相邻且同 challengeID 的行并成一组，挂在成对表头下；
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
  const [params, setParams] = useSearchParams()
  const onlyMine = params.get('mine') === '1'
  const scenarioID = params.get('scenario') ?? ''
  const versionID = params.get('version') ?? ''
  const agentID = positiveID(params.get('agent'))
  const npcKey = params.get('npc') ?? ''
  const sourceMatchID = positiveID(params.get('match'))
  const scoped = !!agentID || !!npcKey
  const cursors = params.getAll('cursor').map(positiveID)
    .filter((id): id is number => id != null)
  const setCursors = (nextCursors: number[]) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('cursor')
      for (const cursor of nextCursors) next.append('cursor', String(cursor))
      return next
    }, { replace: true })
  }
  const before = cursors.at(-1)
  const updateFilter = (key: string, value: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('cursor')
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }
  const setOnlyMine = (value: boolean) => updateFilter('mine', value ? '1' : '')
  const setScenarioID = (value: string) => updateFilter('scenario', value)
  const list = usePageQuery({
    ...(scoped
      ? {
        queryKey: [
          'matches',
          'identity',
          agentID,
          versionID,
          npcKey,
          scenarioID,
          sourceMatchID,
          onlyMine,
          before,
        ].map(String),
        queryFn: () => {
          if (agentID && positiveID(versionID)) {
            return agents.history(agentID, Number(versionID), before, onlyMine)
          }
          if (npcKey && scenarioID && sourceMatchID) {
            return npcs.history(
              scenarioID,
              npcKey,
              before,
              sourceMatchID,
              onlyMine,
            )
          }
          throw new Error('对战记录筛选信息不完整。请从智能体资料页重新进入。')
        },
      }
      : matchesQuery()),
  })
  const scenarios = usePageQuery(catalogQuery())
  const { loading, error } = list
  // Role names are optional enrichment; history can render as soon as it arrives.
  const data = list.data ? { list: list.data, scenarios: scenarios.data } : null
  // Derive choices from all history so ownership filtering cannot remove the
  // selected option, even when the catalog is unavailable.
  const historyScenarios = new Map<string, string>()
  for (const summary of data?.list.matches ?? []) {
    // These retired scenarios no longer need dedicated history filters.
    if (
      summary.scenarioID === 'sanguo-chain-stratagem' ||
      summary.scenarioID === 'sanguo-chain-stratagem-advanced'
    ) continue
    if (!historyScenarios.has(summary.scenarioID)) {
      historyScenarios.set(summary.scenarioID, summary.scenarioTitle)
    }
  }
  // Closed history is already scoped by the server, including older responses
  // without participant metadata. Open history uses viewer-relative ownership.
  const visibleMatches = (data?.list.matches ?? []).filter((summary) =>
    (!versionID || (['a', 'b'] as const).some((side) => {
      const id = summary.participants?.[side]?.versionID
      return id != null && String(id) === versionID
    })) &&
    (!scenarioID || summary.scenarioID === scenarioID) &&
    (!onlyMine || !data?.list.open || summary.initiatorIsMe ||
      summary.participants?.a.isMine || summary.participants?.b.isMine)
  )

  // 角色名映射走 lib/outcome 的共用构建（round4 评审 #10）。
  const roles: Record<string, RoleNames> = scenarioRoles(
    data?.scenarios?.scenarios ?? [],
  )
  const rolesOf = (summary: MatchSummary) => roles[summary.scenarioID] ?? null

  const matchCard = (summary: MatchSummary) => (
    <Card
      key={summary.id}
      data-scroll-anchor={`match-${summary.id}`}
      className='history-card'
    >
      <Link
        to={`/matches/${summary.id}`}
        className='block'
        {...tm('L.match-card')}
      >
        <CardContent className='history-card-content flex items-center justify-between gap-3'>
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
      </Link>
      {(['a', 'b'] as const).some((side) =>
        summary.participants?.[side]?.isMine &&
        summary.participants[side].agentID != null
      ) && (
        <div className='history-card-agents flex flex-wrap gap-x-4 gap-y-2 px-4 pb-4 text-xs md:px-6'>
          {(['a', 'b'] as const).map((side) => {
            const participant = summary.participants?.[side]
            if (!participant?.isMine || participant.agentID == null) {
              return null
            }
            return (
              <Link
                key={side}
                to={`/agents/${participant.agentID}`}
                className='text-(--foreground-subtle) underline underline-offset-4 hover:text-(--foreground)'
                {...tm('L.owned-agent')}
              >
                {rolesOf(summary)?.[side] ?? (side === 'a' ? '甲方' : '乙方')}
                {' · 我的智能体 #'}
                {participant.agentID}
              </Link>
            )
          })}
        </div>
      )}
    </Card>
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
    <div className={loading ? 'space-y-6' : 'space-y-6 page-content-ready'}>
      <h1
        className='text-2xl font-black tracking-tight text-(--foreground)'
        {...tm('L.page-title')}
      >
        历史
      </h1>
      <div className='-mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
        <p
          className='text-sm text-(--foreground-subtle)'
          {...tm('L.page-intro')}
        >
          {npcKey
            ? '该 NPC 配置参与的对战记录。'
            : versionID
            ? '该版本参与的对战记录，包含进行中的对局。'
            : scenarioID
            ? (onlyMine || !data?.list.open
              ? '你在该场景的对战记录。'
              : '该场景的对战记录。')
            : data?.list.open && !onlyMine
            ? '全部对战记录。'
            : '你的全部对战记录。'}
        </p>
        <div className='flex max-w-full flex-wrap items-center gap-x-4 gap-y-1'>
          <Select
            value={scenarioID || ALL_SCENARIOS}
            onValueChange={(value) =>
              setScenarioID(value === ALL_SCENARIOS ? '' : value ?? '')}
            placeholder='全部场景'
            renderValue={(value) =>
              historyScenarios.get(value) ?? '全部场景'}
            disabled={scoped || loading || !historyScenarios.size}
            className='h-9 w-40 max-w-full rounded-lg border-(--border-soft) bg-transparent px-2.5 text-xs focus:border-(--foreground-muted) focus:ring-0 focus-visible:outline focus-visible:outline-offset-3 focus-visible:outline-(--foreground-subtle) [&>span]:min-w-0 [&>span]:truncate [&>span]:text-(--foreground-subtle)'
          >
            <SelectItem value={ALL_SCENARIOS}>全部场景</SelectItem>
            {[...historyScenarios].map(([id, title]) => (
              <SelectItem key={id} value={id}>{title}</SelectItem>
            ))}
          </Select>
          <label className='group inline-flex min-h-9 cursor-pointer items-center gap-2 text-xs text-(--foreground-subtle) hover:text-(--foreground)'>
            <span className='relative flex size-4 shrink-0'>
              <input
                type='checkbox'
                checked={onlyMine}
                onChange={(event) => setOnlyMine(event.target.checked)}
                className='peer m-0 size-4 appearance-none rounded-[5px] border border-(--foreground-muted)/70 bg-white/3 checked:border-(--foreground-subtle) checked:bg-(--foreground-subtle) group-hover:border-(--foreground-subtle) focus-visible:outline focus-visible:outline-offset-3 focus-visible:outline-(--foreground-subtle) motion-safe:transition-colors'
              />
              <Check
                aria-hidden='true'
                strokeWidth={2.5}
                className='pointer-events-none absolute inset-0 m-auto size-3 text-(--background) opacity-0 peer-checked:opacity-100 motion-safe:transition-opacity'
              />
            </span>
            仅自己对局
          </label>
        </div>
      </div>

      {npcKey && (
        <div className='text-xs text-(--foreground-subtle)'>
          NPC · {npcKey} · 对战 #{sourceMatchID} 的配置
        </div>
      )}
      {versionID && (
        <div className='flex flex-wrap items-center gap-2 text-xs'>
          <button
            type='button'
            onClick={() =>
              setParams((previous) => {
                const next = new URLSearchParams(previous)
                next.delete('version')
                next.delete('agent')
                next.delete('cursor')
                return next
              }, { replace: true })}
            aria-label={`清除版本 #${versionID} 筛选`}
            className='inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-(--border-soft) px-3 text-(--foreground-subtle) hover:border-(--foreground-muted) hover:text-(--foreground) focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-(--foreground-subtle)'
          >
            版本 #{versionID}
            <X aria-hidden='true' className='size-3.5' />
          </button>
        </div>
      )}

      {loading
        ? <PageLoading variant='list' {...tm('L.loading')} />
        : error
        ? (
          <div className='space-y-3'>
            <p
              role='alert'
              className='text-sm text-(--accent)'
              {...tm('L.error')}
            >
              {error}
            </p>
            <Button onClick={list.reload}>重试</Button>
          </div>
        )
        : data && visibleMatches.length > 0
        ? (
          <div className='space-y-2' {...tm('L.match-list')}>
            {groupHistory(visibleMatches).map((row) => {
              if (row.kind === 'single') return matchCard(row.match)
              const legs = [...row.legs].sort(
                (a, b) =>
                  (a.challengeLeg ?? 0) - (b.challengeLeg ?? 0),
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
            {npcKey
              ? '该 NPC 配置暂无可查看的对战记录。'
              : versionID
              ? (scenarioID || onlyMine
                ? '该版本没有符合当前筛选条件的对战。试试切换场景或取消「仅自己对局」。'
                : '该版本还没有对战记录。')
              : scenarioID
              ? '没有符合筛选条件的对战。试试切换场景或取消「仅自己对局」。'
              : onlyMine && data?.list.open
              ? '还没有你的对战记录。取消勾选「仅自己对局」可查看全部对战。'
              : data?.list.open
              ? '还没有任何对战。到场景页构建智能体并发起对战。'
              : '还没有对战。到场景页构建智能体并发起对战。'}
          </p>
        )}
      {scoped && !error &&
        (cursors.length > 0 || (data?.list.matches.length ?? 0) === 20) && (
        <div className='flex justify-end gap-2'>
          <Button
            variant='secondary'
            disabled={loading || cursors.length === 0}
            onClick={() => setCursors(cursors.slice(0, -1))}
          >
            上一页
          </Button>
          <Button
            variant='secondary'
            disabled={loading || (data?.list.matches.length ?? 0) < 20}
            onClick={() => {
              const last = data?.list.matches.at(-1)
              if (last) setCursors([...cursors, last.id])
            }}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
