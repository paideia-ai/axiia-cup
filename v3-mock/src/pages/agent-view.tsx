// EA — 智能体视图（§B3，可选点开）。
// v3.4：展示名＝侧角色名 + 场景（#63）；逐版本胜负天然按侧（#63）；
// 双侧完成度徽章 + 缺侧「去创建对侧」引导（#64）。
import { ArrowLeftRight, ChevronRight, Copy, Star, Swords } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { OsPanel } from '../components/os-panel'
import { Badge, Button, Card, EmptyState, KeyValue } from '../components/ui'
import { cn } from '../lib/cn'
import { otherSide, sideRoleShort } from '../mock/data'
import { NPCS, SCENARIOS, store, useAppState } from '../mock/store'
import type { BuildMode, Match, Npc, Side } from '../mock/types'

const MODE_LABEL: Record<BuildMode, string> = { mcq: 'MCQ', basic: 'Basic', meta: '元提示词' }

/** 版本 id 可复制 chip（#25：按 id 约战的发现路径） */
function IdChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type='button'
      title='复制版本 id（可用于按 id 约战）'
      onClick={() => {
        void navigator.clipboard?.writeText(id)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      }}
      className='inline-flex items-center gap-1.5 rounded-full border border-(--border) bg-white/4 px-2.5 py-0.5 font-mono text-[11px] text-(--foreground-subtle) transition hover:bg-white/8 hover:text-(--foreground)'
    >
      {id}
      {copied ? <span className='text-emerald-300'>已复制</span> : <Copy className='h-3 w-3' />}
    </button>
  )
}

export function AgentViewPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const state = useAppState()
  const [osOpen, setOsOpen] = useState(() => searchParams.get('os') === '1')

  const agent = state.agents.find((a) => a.id === id)
  const scenario = SCENARIOS.find((s) => s.id === agent?.scenarioId)

  // B3：PVE-NPC 的视图（聚合数据，含两侧胜率语义 #34）
  const npc = !agent ? NPCS.find((n) => n.id === id) : undefined
  if (npc) return <NpcView npc={npc} />

  if (!agent || !scenario) {
    return <EmptyState title='未找到该智能体' hint='它可能已被删除，或链接有误。' />
  }

  const user = state.user
  const isOwner = user !== null && agent.ownerId === user.id
  const ownerName = agent.ownerName
  const versions = agent.versions.toSorted((a, b) => b.num - a.num)
  const tournamentVersion = agent.versions.find((v) => v.id === agent.tournamentVersionId)
  const agentMatches = state.matches
    .filter((m) => m.participants.A.refId === agent.id || m.participants.B.refId === agent.id)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))

  const roleName = sideRoleShort(scenario, agent.side)
  const oppRole = sideRoleShort(scenario, otherSide(agent.side))
  // 双侧完成度（#64）：仅所有者视角有意义
  const bySide = isOwner ? store.myAgentsBySide(agent.scenarioId) : null
  const readiness = isOwner ? store.entryReadiness(agent.scenarioId) : null
  const missingOpp = bySide !== null && bySide[otherSide(agent.side)].length === 0

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          {/* #63 展示名＝侧角色名 + 场景（agent 名天然含侧）；自起名并入主标题 */}
          <h1 className='text-2xl font-bold text-(--foreground)'>
            {roleName}「{agent.name}」 · {scenario.name}
          </h1>
          <div className='mt-1 flex flex-wrap items-center gap-2'>
            <Badge tone={agent.side === 'A' ? 'sideA' : 'sideB'}>执{agent.side} · {roleName}</Badge>
            <span className='text-sm text-(--foreground-subtle)'>{ownerName}</span>
            {!isOwner && <Badge tone='neutral'>公开视图</Badge>}
            {/* #33 参赛版本处处可见；参赛需双侧各标一个（#58） */}
            {tournamentVersion && <Badge tone='accent'>本侧参赛版本 v{tournamentVersion.num}</Badge>}
          </div>
        </div>
        {isOwner && (
          <Button onClick={() => setOsOpen(true)}>
            <Swords className='h-4 w-4' />
            出战
          </Button>
        )}
      </div>

      {/* 双侧完成度徽章 + 参赛资格 + 缺侧引导（#58/#64） */}
      {isOwner && bySide !== null && readiness !== null && (
        <Card className='flex flex-wrap items-center gap-3'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>双侧完成度</span>
          {(['A', 'B'] as const).map((side) => (
            <Badge key={side} tone={bySide[side].length > 0 ? 'success' : 'neutral'}>
              {sideRoleShort(scenario, side)} {bySide[side].length > 0 ? '✓' : '✗'}
            </Badge>
          ))}
          <span className='text-xs text-(--foreground-subtle)'>
            {readiness.eligible
              ? '双侧参赛版本已标——已具备参赛资格。'
              : missingOpp
                ? `还没有${oppRole}——参赛需两侧各标一个参赛版本，只写一侧不能参赛。`
                : `双侧智能体都有了，但${readiness.A === null ? sideRoleShort(scenario, 'A') : sideRoleShort(scenario, 'B')}侧还没标参赛版本。`}
          </span>
          {missingOpp && (
            <Link to={`/scenarios/${scenario.id}/build?side=${otherSide(agent.side)}`} className='ml-auto'>
              <Button size='sm' variant='secondary'>
                <ArrowLeftRight className='h-3.5 w-3.5' />
                去创建对侧（{oppRole}）
              </Button>
            </Link>
          )}
        </Card>
      )}

      <section className='flex flex-col gap-3'>
        <h2 className='panel-title'>版本（{versions.length}）</h2>
        {versions.length === 0 && <EmptyState title='还没有版本' hint='去构建器保存第一个版本。' />}
        {versions.map((v, idx) => {
          const prev = versions[idx + 1]
          const isTournament = v.id === agent.tournamentVersionId
          return (
            <Card key={v.id} className={cn(isTournament && 'border-(--accent)/40')}>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-base font-bold text-(--foreground)'>v{v.num}</span>
                <IdChip id={v.id} />
                <Badge tone='neutral'>{v.model}</Badge>
                <Badge tone='neutral'>{MODE_LABEL[v.mode]}</Badge>
                {isTournament && <Badge tone='accent'>参赛版本</Badge>}
                <span className='ml-auto text-xs text-(--foreground-muted)'>{new Date(v.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                {/* 逐版本胜负天然按侧（#63）——agent 即一侧，无需 A/B 拆列 */}
                <KeyValue label={`战绩（执${agent.side} · ${roleName}）`}>{v.record.wins} 胜 {v.record.losses} 负</KeyValue>
                {isOwner && <KeyValue label='备注'>{v.note || '—'}</KeyValue>}
              </div>
              {isOwner && (
                <>
                  {/* #20 提示词仅所有者；单侧提示词（#55） */}
                  <div className='mt-3'>
                    <details className='rounded-xl border border-(--border-soft) bg-white/[0.02] px-3 py-2'>
                      <summary className='cursor-pointer text-xs font-semibold text-(--foreground-subtle)'>提示词（执{agent.side} · {scenario[agent.side === 'A' ? 'sideA' : 'sideB'].name}）</summary>
                      <p className='mt-2 whitespace-pre-wrap text-sm text-(--foreground)'>{v.prompt}</p>
                    </details>
                  </div>
                  {/* diff 简化提示：备注 + 字数变化（完整 diff 超出 mock 范围） */}
                  {prev && (
                    <p className='mt-2 text-[11px] text-(--foreground-muted)'>
                      较 v{prev.num}：{v.note ? `「${v.note}」 · ` : ''}
                      字数 {formatDelta(v.prompt.length - prev.prompt.length)}
                      （完整 diff 仅所有者可见，mock 未实现）
                    </p>
                  )}
                  <div className='mt-3 flex items-center gap-2'>
                    <label className='inline-flex cursor-pointer items-center gap-2 text-xs text-(--foreground-subtle)'>
                      <input
                        type='radio'
                        name='tournament-version'
                        checked={isTournament}
                        onChange={() => store.markTournamentVersion(agent.id, v.id)}
                        className='accent-(--accent)'
                      />
                      <Star className={cn('h-3.5 w-3.5', isTournament ? 'text-(--accent)' : 'text-(--foreground-muted)')} />
                      设为本侧参赛版本{/* 参赛需两侧各标一个（#58） */}
                    </label>
                  </div>
                </>
              )}
            </Card>
          )
        })}
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='panel-title'>对局记录（{agentMatches.length}）</h2>
        {agentMatches.length === 0 && <EmptyState title='还没有对局' hint='派发一场对战后，战报会出现在这里。' />}
        <div className='flex flex-col gap-2'>
          {agentMatches.map((m) => (
            <MatchRow key={m.id} match={m} agentId={agent.id} onOpen={() => navigate(`/matches/${m.id}`)} />
          ))}
        </div>
      </section>

      <OsPanel open={osOpen} onClose={() => setOsOpen(false)} agentId={agent.id} />
    </div>
  )
}

function formatDelta(d: number): string {
  return d >= 0 ? `+${d}` : `${d}`
}

/** B3：PVE-NPC 的聚合视图——无版本/提示词，只有场景、两侧胜率（#34 语义）与对局记录 */
function NpcView({ npc }: { npc: Npc }) {
  const navigate = useNavigate()
  const state = useAppState()
  const scenario = SCENARIOS.find((s) => s.id === npc.scenarioId)
  const npcMatches = state.matches
    .filter((m) => m.participants.A.refId === npc.id || m.participants.B.refId === npc.id)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold text-(--foreground)'>{npc.name}</h1>
        <div className='mt-1 flex flex-wrap items-center gap-2'>
          <Badge tone='neutral'>PVE-NPC</Badge>
          <Badge tone='accent'>{scenario?.name ?? npc.scenarioId}</Badge>
          {npc.easeRank === 1 && <Badge tone='success'>最容易</Badge>}
          <span className='text-sm text-(--foreground-subtle)'>{npc.tagline}</span>
        </div>
      </div>
      <Card>
        <p className='panel-label'>聚合战绩</p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <KeyValue label={`执A（${scenario?.sideA.name ?? 'A'}）胜率`}>{Math.round(npc.sideWinRate.A * 100)}%</KeyValue>
          <KeyValue label={`执B（${scenario?.sideB.name ?? 'B'}）胜率`}>{Math.round(npc.sideWinRate.B * 100)}%</KeyValue>
        </div>
        {/* #34：显示的是该 NPC 两侧出战的胜率，不是玩家胜率 */}
        <p className='mt-3 text-xs text-(--foreground-muted)'>两侧胜率＝该 NPC 分别执 A/B 出战的胜率（非玩家胜率）；难度标注与胜率不冲突。</p>
      </Card>
      <section className='flex flex-col gap-3'>
        <h2 className='panel-title'>对局记录（{npcMatches.length}）</h2>
        {npcMatches.length === 0 && <EmptyState title='还没有对局' />}
        <div className='flex flex-col gap-2'>
          {npcMatches.map((m) => (
            <MatchRow key={m.id} match={m} agentId={npc.id} onOpen={() => navigate(`/matches/${m.id}`)} />
          ))}
        </div>
      </section>
    </div>
  )
}

function MatchRow({ match, agentId, onOpen }: { match: Match; agentId: string; onOpen: () => void }) {
  const mySide: Side | null =
    match.participants.A.refId === agentId ? 'A' : match.participants.B.refId === agentId ? 'B' : null
  const opp = mySide === 'A' ? match.participants.B : match.participants.A
  const winner = match.result?.winner
  return (
    <button
      type='button'
      onClick={onOpen}
      className='flex items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3 text-left transition hover:border-(--border) hover:bg-white/[0.04]'
    >
      <div className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium text-(--foreground)'>vs {opp.displayName}</span>
        <span className='text-[11px] text-(--foreground-muted)'>
          {new Date(match.createdAt).toLocaleString('zh-CN')} · 执{mySide ?? '?'}
        </span>
      </div>
      {match.status !== 'done' ? (
        <Badge tone='info'>{match.status === 'queued' ? '排队中' : '进行中'}</Badge>
      ) : winner === 'draw' ? (
        <Badge tone='neutral'>平局</Badge>
      ) : winner === mySide ? (
        <Badge tone='success'>胜</Badge>
      ) : (
        <Badge tone='neutral'>负</Badge>
      )}
      <ChevronRight className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
    </button>
  )
}
