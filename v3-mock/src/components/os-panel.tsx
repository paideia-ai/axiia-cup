// OS — 选择对手（派发面板，§A5）。
// v3.4：执方由所选 agent 隐含（#62）；「切到对侧」＝切到你另一侧的 agent（没有则引导创建，#64）；
// hotseat（自打）保留（#61）——打自己对侧的 agent，对侧多个时需选择打哪个。
// #65：PVP 门槛按侧——每侧各赢 ≥N 场 PVE 才解锁。
// #66：PVP 约战＝双侧成对——选「对手玩家」，一次产生两场（正：我A vs 他B / 反：他A vs 我B）；
//      双方都须双侧齐备；发起人自选双侧出战阵容（默认参赛版本/最新版）。
import { ArrowLeftRight, Lock, Search, Swords, User, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { otherSide, sideRoleShort } from '../mock/data'
import { CONFIG, SCENARIOS, store, useAppState } from '../mock/store'
import type { Side } from '../mock/types'
import { Badge, Button, EmptyState, Modal, Tabs } from './ui'

type OsTab = 'pve' | 'hotseat' | 'pvp-id' | 'pvp-top' | 'auto'

type Lineup = { A: { agentId: string; versionId: string }; B: { agentId: string; versionId: string } }

export function OsPanel({
  open,
  onClose,
  agentId,
  initialVersionId,
}: {
  open: boolean
  onClose: () => void
  agentId: string
  initialVersionId?: string
}) {
  const state = useAppState()
  // 执方由所选 agent 隐含（#62）——面板内可切换到同场景的其它 agent（含对侧）
  const [activeAgentId, setActiveAgentId] = useState(agentId)
  const agent = state.agents.find((a) => a.id === activeAgentId)
  const scenario = SCENARIOS.find((s) => s.id === agent?.scenarioId)

  const [tab, setTab] = useState<OsTab>('pve')
  const [versionId, setVersionId] = useState('')
  const [idInput, setIdInput] = useState('')
  // hotseat（#61）：对侧多个 agent 时需选择打哪个
  const [hotAgentId, setHotAgentId] = useState('')
  const [hotVersionId, setHotVersionId] = useState('')
  // #66：PVP 双侧出战阵容（各侧一个 agent+version）
  const [lineup, setLineup] = useState<Lineup | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const closeTimer = useRef<number | null>(null)

  const myAgents = useMemo(
    () =>
      state.agents.filter(
        (a) => a.ownerId === state.user?.id && a.scenarioId === agent?.scenarioId,
      ),
    [state.agents, state.user?.id, agent?.scenarioId],
  )
  const oppSide = agent ? otherSide(agent.side) : 'B'
  const myOppAgents = myAgents.filter((a) => a.side === oppSide)

  useEffect(() => {
    if (!open) return
    setActiveAgentId(agentId)
    setTab('pve')
    const initial = state.agents.find((a) => a.id === agentId)
    setVersionId(initialVersionId ?? initial?.versions.at(-1)?.id ?? '')
    setIdInput('')
    setAlert(null)
    setConfirmation(null)
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agentId, initialVersionId])

  // 切换 agent 时同步版本与 hotseat 选择
  useEffect(() => {
    if (!open || !agent) return
    setVersionId((v) => (agent.versions.some((x) => x.id === v) ? v : agent.versions.at(-1)?.id ?? ''))
    const firstOpp = myOppAgents[0]
    setHotAgentId((id) => (myOppAgents.some((a) => a.id === id) ? id : firstOpp?.id ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeAgentId, agent?.versions.length])

  const hotAgent = myOppAgents.find((a) => a.id === hotAgentId)
  useEffect(() => {
    setHotVersionId((v) => (hotAgent?.versions.some((x) => x.id === v) ? v : hotAgent?.versions.at(-1)?.id ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotAgentId, hotAgent?.versions.length])

  // #66：初始化/修复双侧阵容——默认各侧参赛版本（未标记则最新版）
  useEffect(() => {
    if (!open) return
    const defaultPick = (side: Side) => {
      const candidates = myAgents.filter((a) => a.side === side && a.versions.length > 0)
      const a = candidates.find((x) => x.versions.some((v) => v.id === x.tournamentVersionId)) ?? candidates[0]
      if (!a) return null
      const v = a.versions.find((x) => x.id === a.tournamentVersionId) ?? a.versions.at(-1)
      return v ? { agentId: a.id, versionId: v.id } : null
    }
    setLineup((prev) => {
      const stillValid =
        prev !== null &&
        (['A', 'B'] as const).every((s) => {
          const a = myAgents.find((x) => x.id === prev[s].agentId && x.side === s)
          return a?.versions.some((v) => v.id === prev[s].versionId) ?? false
        })
      if (stillValid) return prev
      const A = defaultPick('A')
      const B = defaultPick('B')
      return A && B ? { A, B } : null
    })
  }, [open, myAgents])

  const unlocked = agent ? store.pvpUnlocked(agent.scenarioId) : false
  const progress = agent
    ? store.pvpProgress(agent.scenarioId)
    : { A: { beaten: 0, needed: CONFIG.pvpUnlockPerSideWins }, B: { beaten: 0, needed: CONFIG.pvpUnlockPerSideWins } }
  const npcs = agent ? store.npcsFor(agent.scenarioId) : []
  const lineupReady = agent ? store.pvpLineupReady(agent.scenarioId) : { A: false, B: false, ready: false }
  // #66：PVP 候选＝对手「玩家」（双侧公开版本分组）
  const publicPlayers = agent ? store.publicPlayersFor(agent.scenarioId) : []
  const idMatchAny = state.publicVersions.find((p) => p.versionId === idInput.trim() && p.scenarioId === scenario?.id)
  const idPlayer = idMatchAny ? publicPlayers.find((g) => g.name === idMatchAny.playerName) : undefined
  const idPlayerDual = idPlayer !== undefined && idPlayer.A !== null && idPlayer.B !== null

  if (!agent || !scenario) return null

  const myRole = sideRoleShort(scenario, agent.side)
  const oppRole = sideRoleShort(scenario, oppSide)
  const roleOf = (s: Side) => sideRoleShort(scenario, s)
  const dispatching = confirmation !== null

  function confirmAndClose(text: string) {
    setConfirmation(text)
    closeTimer.current = window.setTimeout(() => {
      setConfirmation(null)
      onClose()
    }, 1600)
  }

  /** 单场派发：PVE / hotseat（#61）——PVP 一律走 runPaired（#66） */
  function run(kind: 'pve' | 'hotseat', opponent: { npcId?: string; myVersion?: { agentId: string; versionId: string } }) {
    if (!agent || dispatching) return
    setAlert(null)
    const result = store.dispatch({ kind, scenarioId: agent.scenarioId, agentId: agent.id, versionId, opponent })
    if (!result.ok) {
      // #52 触顶：按钮可点 → 提示 → 拒绝入队；#46 并发；#47 赛事阻挡
      if (result.reason === 'daily-limit') setAlert(`今日次数已用完（${CONFIG.dailyBattleLimit}/${CONFIG.dailyBattleLimit}），明天再来`)
      else if (result.reason === 'concurrency') setAlert(`同时进行的对战已达上限（${CONFIG.concurrencyLimit} 场），等一场结束再派发`)
      else if (result.reason === 'trials-blocked') setAlert('赛事运行期间，试炼暂时关闭')
      else if (result.reason === 'wrong-side') setAlert(`自打对手必须是你的对侧（${oppRole}）智能体`)
      else setAlert('对手无效，请重试')
      return
    }
    // B5 I-1：ETA + 完成后通知你；随后关闭，进行中的对战条接手
    confirmAndClose('已入队 · 完成后通知你（预计 ~2 分钟）')
  }

  /** #66：双侧成对约战——一次产生两场（正/反） */
  function runPaired(kind: 'pvp-friendly' | 'pvp-ranked', playerName: string, pinnedVersionId?: string) {
    if (!agent || dispatching || !lineup) return
    setAlert(null)
    const res = store.dispatchPairedPvp({
      kind,
      scenarioId: agent.scenarioId,
      mine: lineup,
      opponent: { playerName, pinnedVersionId },
    })
    if (!res.ok) {
      if (res.reason === 'daily-limit') setAlert(`今日剩余次数不足——一次约战计 2 场（${state.user?.battlesToday ?? 0}/${CONFIG.dailyBattleLimit}），明天再来`)
      else if (res.reason === 'pvp-daily-limit') setAlert(`PVP 每日剩余次数不足——一次约战计 2 场（${state.user?.pvpBattlesToday ?? 0}/${CONFIG.pvpDailyLimit}）`)
      else if (res.reason === 'concurrency') setAlert(`并发名额不足 2 场（同时进行上限 ${CONFIG.concurrencyLimit}），等一场结束再约`)
      else if (res.reason === 'trials-blocked') setAlert('赛事运行期间，试炼暂时关闭')
      else if (res.reason === 'both-sides-required') setAlert(`PVP 约战需双方双侧齐备——你这边还缺${lineupReady.A ? roleOf('B') : roleOf('A')}`)
      else if (res.reason === 'opponent-both-sides-required') setAlert('PVP 约战需双方双侧齐备——对方还没有公开的双侧智能体')
      else setAlert('对手无效：请检查版本 id（需与本场景匹配）')
      return
    }
    confirmAndClose('已入队 2 场（正/反）· 完成后通知你（预计 ~2 分钟）')
  }

  const lockBadge = !unlocked ? <Lock className='h-3 w-3' /> : undefined
  const buildOppUrl = `/scenarios/${scenario.id}/build?side=${oppSide}`
  const buildSideUrl = (side: Side) => `/scenarios/${scenario.id}/build?side=${side}`

  // 「切到对侧」affordance（#62/#64）：有对侧 agent 就切过去；没有则引导创建
  const switchSide = () => {
    const target = myOppAgents[0]
    if (target) {
      setActiveAgentId(target.id)
      setVersionId(target.versions.at(-1)?.id ?? '')
    }
  }

  // #66：我的双侧出战阵容选择器（PVP 三个 tab 共用）
  const lineupBlock = lineup !== null && (
    <div className='rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
      <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>
        我的双侧出战阵容——一次约战＝两场：正（我{roleOf('A')} vs 他{roleOf('B')}）· 反（他{roleOf('A')} vs 我{roleOf('B')}）
      </p>
      <div className='flex flex-wrap gap-5'>
        {(['A', 'B'] as const).map((side) => {
          const candidates = myAgents.filter((a) => a.side === side && a.versions.length > 0)
          const sel = lineup[side]
          const selAgent = candidates.find((a) => a.id === sel.agentId)
          return (
            <div key={side} className='flex flex-col gap-1'>
              <span className='text-[11px] font-semibold text-(--foreground-subtle)'>
                执{side} · {roleOf(side)}
              </span>
              <div className='flex items-center gap-2'>
                <select
                  value={sel.agentId}
                  onChange={(e) => {
                    const a = candidates.find((x) => x.id === e.target.value)
                    if (!a) return
                    const v = a.versions.find((x) => x.id === a.tournamentVersionId) ?? a.versions.at(-1)
                    setLineup((prev) => (prev ? { ...prev, [side]: { agentId: a.id, versionId: v?.id ?? '' } } : prev))
                  }}
                  className='rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-1.5 text-sm text-(--foreground) outline-none focus:border-(--accent)'
                >
                  {candidates.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <select
                  value={sel.versionId}
                  onChange={(e) => setLineup((prev) => (prev ? { ...prev, [side]: { ...prev[side], versionId: e.target.value } } : prev))}
                  className='rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-1.5 text-sm text-(--foreground) outline-none focus:border-(--accent)'
                >
                  {(selAgent?.versions ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.num}{v.id === selAgent?.tournamentVersionId ? ' ★' : ''} · {v.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>
      <p className='mt-2 mb-0 text-[11px] text-(--foreground-muted)'>默认各侧参赛版本（★，未标记则最新版）。</p>
    </div>
  )

  // #66：我方未双侧齐备 → PVP tab 内引导（单侧玩家不能约战）
  const lineupGuidance = (
    <div className='flex flex-col gap-2 rounded-xl border border-amber-800/60 bg-amber-950/25 px-4 py-3'>
      <p className='m-0 text-sm font-semibold text-amber-300'>PVP 约战需双方双侧齐备</p>
      <p className='m-0 text-xs text-(--foreground-muted)'>
        一次约战＝两场（你的{roleOf('A')}打他的{roleOf('B')}，他的{roleOf('A')}打你的{roleOf('B')}）。
        你还缺{!lineupReady.A ? roleOf('A') : ''}{!lineupReady.A && !lineupReady.B ? '与' : ''}{!lineupReady.B ? roleOf('B') : ''}（有版本的智能体）。
      </p>
      <div className='flex flex-wrap gap-2'>
        {(['A', 'B'] as const).filter((s) => !lineupReady[s]).map((s) => (
          <Link key={s} to={buildSideUrl(s)} onClick={onClose}>
            <Button size='sm' variant='secondary'>去创建{roleOf(s)}</Button>
          </Link>
        ))}
      </div>
    </div>
  )

  /** #66 对手玩家行（双侧齐备可约战；单侧不可被约战） */
  const playerRow = (g: { name: string; A: { versionId: string; agentName: string; model: string } | null; B: { versionId: string; agentName: string; model: string } | null }, kind: 'pvp-friendly' | 'pvp-ranked') => {
    const dual = g.A !== null && g.B !== null
    return (
      <div key={g.name} className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-2.5'>
        <div className='min-w-0 flex-1'>
          <span className='text-sm font-semibold text-(--foreground)'>{g.name}</span>
          <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
            {g.A ? `${roleOf('A')}·${g.A.agentName}` : `${roleOf('A')} ✗`}
            <span className='mx-1.5 text-(--foreground-muted)'>/</span>
            {g.B ? `${roleOf('B')}·${g.B.agentName}` : `${roleOf('B')} ✗`}
          </p>
        </div>
        <Button
          size='sm'
          variant='secondary'
          disabled={dispatching || !dual || lineup === null}
          title={dual ? undefined : '对方未双侧齐备，不能被约战'}
          onClick={() => runPaired(kind, g.name)}
        >
          发起双侧约战
        </Button>
      </div>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={`选择对手 · ${scenario.name}`} wide>
      {/* agent 预选 + 版本下拉；执方由所选 agent 隐含（#62）——用于 PVE / 自打；PVP 用下方双侧阵容 */}
      <div className='mb-4 flex flex-wrap items-end gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>智能体（执方随之而定）</span>
          <div className='flex items-center gap-2'>
            <select
              value={activeAgentId}
              onChange={(e) => setActiveAgentId(e.target.value)}
              className='rounded-lg border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-sm text-(--foreground) outline-none focus:border-(--accent)'
            >
              {myAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {sideRoleShort(scenario, a.side)} · {a.name}
                </option>
              ))}
            </select>
            <Badge tone={agent.side === 'A' ? 'sideA' : 'sideB'}>执{agent.side} · {myRole}</Badge>
          </div>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>版本</span>
          <select
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
            className='rounded-lg border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-sm text-(--foreground) outline-none focus:border-(--accent)'
          >
            {agent.versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.num} · {v.model}{v.id === agent.tournamentVersionId ? ' · ★参赛版本' : ''}{v.note ? ` · ${v.note}` : ''}
              </option>
            ))}
          </select>
        </div>
        {/* 「切到对侧」＝切到你另一侧的 agent；没有则引导创建（#62/#64） */}
        {myOppAgents.length > 0 ? (
          <Button size='sm' variant='secondary' onClick={switchSide} title={`切换到你的${oppRole}智能体`}>
            <ArrowLeftRight className='h-3.5 w-3.5' />
            切到对侧（{oppRole}）
          </Button>
        ) : (
          <Link
            to={buildOppUrl}
            onClick={onClose}
            className='inline-flex items-center gap-1.5 rounded-full border border-dashed border-(--accent)/50 px-3 py-1.5 text-xs font-semibold text-(--accent) transition hover:bg-(--accent)/10'
          >
            <ArrowLeftRight className='h-3.5 w-3.5' />
            还没有{oppRole}——去创建对侧
          </Link>
        )}
        <span className='ml-auto text-xs text-(--foreground-muted)'>
          今日对战 {state.user?.battlesToday ?? 0}/{CONFIG.dailyBattleLimit}
        </span>
      </div>

      {agent.versions.length === 0 ? (
        <EmptyState title='还没有版本' hint='先去构建器保存一个版本，才能派发对战。' />
      ) : (
        <>
          {/* tabs 顺序：PVE → 自打 → 按 id → 顶尖玩家 → 自动匹配（A5，hotseat 为「另」项 #61） */}
          <Tabs
            className='mb-3'
            value={tab}
            onChange={(k) => setTab(k as OsTab)}
            items={[
              { key: 'pve', label: 'PVE' },
              { key: 'hotseat', label: '自打（hotseat）' },
              { key: 'pvp-id', label: 'PVP · 按 id', disabled: !unlocked, badge: lockBadge },
              { key: 'pvp-top', label: 'PVP · 顶尖玩家', disabled: !unlocked, badge: lockBadge },
              { key: 'auto', label: '自动匹配', disabled: !unlocked, badge: lockBadge },
            ]}
          />

          {/* 门槛锁定可见 + 按侧进度（#65：每侧各赢 ≥N 场 PVE） */}
          {!unlocked && (
            <div className='mb-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-2.5'>
              <Lock className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
              <span className='text-xs text-(--foreground-subtle)'>每侧各赢 ≥{progress.A.needed} 场 PVE 解锁 PVP：</span>
              {(['A', 'B'] as const).map((s) => (
                <Badge key={s} tone={progress[s].beaten >= progress[s].needed ? 'success' : 'neutral'}>
                  {roleOf(s)} {Math.min(progress[s].beaten, progress[s].needed)}/{progress[s].needed}
                  {progress[s].beaten >= progress[s].needed ? ' ✓' : ''}
                </Badge>
              ))}
            </div>
          )}

          {alert && (
            <div className='mb-3 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-2.5 text-sm text-amber-300'>{alert}</div>
          )}
          {confirmation && (
            <div className='mb-3 rounded-xl border border-emerald-800/60 bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-300'>{confirmation}</div>
          )}

          {tab === 'pve' && (
            <div className='flex flex-col gap-3'>
              {/* #62：NPC 填对侧槽位；#65：两侧都得练——门槛每侧各赢 ≥N 场 */}
              <p className='text-xs text-(--foreground-muted)'>
                NPC 将执对侧（{oppRole}）。门槛按侧计：想点亮{oppRole}那一格，切到你的{oppRole}智能体再打。
              </p>
              {npcs.map((npc) => (
                <div key={npc.id} className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-(--foreground)'>{npc.name}</span>
                      {npc.easeRank === 1 && <Badge tone='success'>最容易</Badge>}
                    </div>
                    <p className='mt-0.5 text-xs text-(--foreground-subtle)'>{npc.tagline}</p>
                    {/* #34：两侧胜率＝该 NPC 出战胜率，不是玩家胜率 */}
                    <p className='mt-1 text-[11px] text-(--foreground-muted)'>
                      该 NPC 执A {Math.round(npc.sideWinRate.A * 100)}% / 执B {Math.round(npc.sideWinRate.B * 100)}% 胜率（非玩家胜率）
                    </p>
                  </div>
                  <Button size='sm' disabled={dispatching} onClick={() => run('pve', { npcId: npc.id })}>
                    <Swords className='h-3.5 w-3.5' />
                    对战
                  </Button>
                </div>
              ))}
            </div>
          )}

          {tab === 'hotseat' && (
            <div className='flex flex-col gap-3'>
              {myOppAgents.length === 0 ? (
                /* 没有对侧 agent → 引导创建（#61/#64；文案为 mock 自拟） */
                <EmptyState
                  title={`自打需要一个${oppRole}`}
                  hint={`hotseat＝拿「${agent.name}」打你自己的对侧智能体。你还没有${oppRole}——两边都要会写才是真本事。`}
                  action={
                    <Link to={buildOppUrl} onClick={onClose}>
                      <Button size='sm'>去创建{oppRole}</Button>
                    </Link>
                  }
                />
              ) : (
                <>
                  <p className='text-xs text-(--foreground-muted)'>
                    拿当前智能体打你自己的对侧智能体——不计天梯、不算 NPC 门槛，纯自测。（自打不成对，单场，#66 只管 PVP 约战）
                  </p>
                  <div className='flex flex-wrap items-end gap-4 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>
                        对侧智能体（{oppRole}）
                      </span>
                      {/* 对侧多个时需选择打哪个（#61） */}
                      {myOppAgents.length > 1 ? (
                        <select
                          value={hotAgentId}
                          onChange={(e) => setHotAgentId(e.target.value)}
                          className='rounded-lg border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-sm text-(--foreground) outline-none focus:border-(--accent)'
                        >
                          {myOppAgents.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}（{a.versions.length} 个版本）</option>
                          ))}
                        </select>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 text-sm font-semibold text-(--foreground)'>
                          <User className='h-3.5 w-3.5 text-(--foreground-muted)' />
                          {myOppAgents[0].name}
                        </span>
                      )}
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>版本</span>
                      <select
                        value={hotVersionId}
                        onChange={(e) => setHotVersionId(e.target.value)}
                        className='rounded-lg border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-sm text-(--foreground) outline-none focus:border-(--accent)'
                      >
                        {(hotAgent?.versions ?? []).map((v) => (
                          <option key={v.id} value={v.id}>v{v.num} · {v.model}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      size='sm'
                      disabled={dispatching || !hotAgent || hotAgent.versions.length === 0}
                      title={hotAgent && hotAgent.versions.length === 0 ? '该对侧智能体还没有版本' : undefined}
                      onClick={() => run('hotseat', { myVersion: { agentId: hotAgentId, versionId: hotVersionId } })}
                    >
                      <Swords className='h-3.5 w-3.5' />
                      自打一场
                    </Button>
                  </div>
                  {hotAgent && hotAgent.versions.length === 0 && (
                    <p className='text-xs text-amber-300'>「{hotAgent.name}」还没有版本——先去构建器保存一个。</p>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'pvp-id' && (
            <div className='flex flex-col gap-3'>
              {!lineupReady.ready ? (
                lineupGuidance
              ) : (
                <>
                  {lineupBlock}
                  <div className='flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-elevated) px-3 py-2'>
                    <Search className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
                    <input
                      value={idInput}
                      onChange={(e) => setIdInput(e.target.value)}
                      placeholder='输入对方任一版本 id（战报 / EA 页面可见）——约的是这个玩家的双侧'
                      className='w-full bg-transparent text-sm text-(--foreground) outline-none placeholder:text-(--foreground-muted)'
                    />
                  </div>
                  {idInput.trim() && !idMatchAny && (
                    <p className='text-xs text-amber-300'>未找到该版本 id（需属于本场景「{scenario.name}」）。</p>
                  )}
                  {idMatchAny && !idPlayerDual && (
                    <p className='text-xs text-amber-300'>
                      该 id 属于 {idMatchAny.playerName}（执{roleOf(idMatchAny.side)}），但对方未双侧齐备——PVP 约战需双方双侧齐备。
                    </p>
                  )}
                  {/* #66：约战按「玩家」成对——不填 id 直接选玩家（默认各侧最新公开版） */}
                  {!idInput.trim() && publicPlayers.length > 0 && (
                    <div className='flex flex-col gap-2'>
                      <p className='text-[11px] text-(--foreground-muted)'>或直接选对手玩家（约其双侧，默认各侧最新公开版）：</p>
                      {publicPlayers.map((g) => playerRow(g, 'pvp-friendly'))}
                    </div>
                  )}
                  {idMatchAny && idPlayerDual && idPlayer && (
                    <div className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
                      <div className='min-w-0 flex-1'>
                        <span className='text-sm font-semibold text-(--foreground)'>{idPlayer.name}</span>
                        <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
                          {roleOf('A')}·{idPlayer.A?.agentName} / {roleOf('B')}·{idPlayer.B?.agentName} · 按 id 固定其
                          {roleOf(idMatchAny.side)}版本 <code className='font-mono'>{idMatchAny.versionId}</code>，另一侧取最新公开版
                        </p>
                      </div>
                      <Button size='sm' disabled={dispatching || lineup === null} onClick={() => runPaired('pvp-friendly', idMatchAny.playerName, idMatchAny.versionId)}>
                        发起双侧约战
                      </Button>
                    </div>
                  )}
                  <ul className='flex flex-col gap-1 text-[11px] text-(--foreground-muted)'>
                    <li>一次约战＝两场：你的{roleOf('A')} vs 他的{roleOf('B')}，他的{roleOf('A')} vs 你的{roleOf('B')}（正/反）。{/* #66 */}</li>
                    <li>PVP 约战需双方双侧齐备；单侧玩家不能约战、也不能被约战。{/* #66 */}</li>
                    <li>友谊赛不计分。对方会收到通知，无需同意、不能拒绝。{/* #29 */}</li>
                    <li>PVP 每日限 {CONFIG.pvpDailyLimit} 场——一次约战对发起人计 2 场，被挑战不消耗对方次数。{/* #46/#52/Q7 */}</li>
                  </ul>
                </>
              )}
            </div>
          )}

          {tab === 'pvp-top' && (
            <div className='flex flex-col gap-3'>
              {!lineupReady.ready ? (
                lineupGuidance
              ) : (
                <>
                  {lineupBlock}
                  <p className='text-xs text-(--foreground-muted)'>按近期锦标赛战绩排序（天梯未建，W11 前的临时排序）。排名按玩家（#64）；约战＝双侧成对（#66）。</p>
                  {state.topPlayers.map((p, i) => {
                    const ref = state.publicVersions.find((x) => x.versionId === p.versionRef)
                    const sameScenario = p.scenarioId === scenario.id
                    const group = sameScenario ? publicPlayers.find((g) => g.name === p.name) : undefined
                    const dual = group !== undefined && group.A !== null && group.B !== null
                    const clickable = sameScenario && dual
                    const hint = !sameScenario
                      ? '只能挑战同场景的对手'
                      : !dual
                        ? '对方未双侧齐备，不能被约战'
                        : undefined
                    return (
                      <div key={p.versionRef} className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
                        <span className='w-6 text-center text-sm font-bold text-(--foreground-muted)'>{i + 1}</span>
                        <div className='min-w-0 flex-1'>
                          <span className='text-sm font-semibold text-(--foreground)'>{p.name}</span>
                          <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
                            锦标赛 {p.wins} 胜
                            {!sameScenario && ` · 场景不同（${SCENARIOS.find((s) => s.id === p.scenarioId)?.name ?? p.scenarioId}）`}
                            {sameScenario && group && ` · ${group.A ? `${roleOf('A')} ✓` : `${roleOf('A')} ✗`} / ${group.B ? `${roleOf('B')} ✓` : `${roleOf('B')} ✗`}`}
                          </p>
                        </div>
                        <Button
                          size='sm'
                          variant='secondary'
                          disabled={dispatching || !clickable || lineup === null}
                          title={hint}
                          onClick={() => ref && runPaired('pvp-friendly', p.name, ref.versionId)}
                        >
                          发起双侧约战
                        </Button>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {tab === 'auto' && (
            <div className='flex flex-col items-start gap-3'>
              {!lineupReady.ready ? (
                lineupGuidance
              ) : (
                <>
                  {lineupBlock}
                  <p className='text-sm text-(--foreground)'>计分对战，影响天梯。</p>
                  <p className='text-xs text-(--foreground-muted)'>
                    系统将为你匹配同场景、双侧齐备的对手玩家，一次匹配＝两场（正/反）。（匹配算法为 mock，W11 待设计；#66 成对语义为 mock 推及）
                  </p>
                  {(() => {
                    const dualPlayers = publicPlayers.filter((g) => g.A !== null && g.B !== null)
                    return dualPlayers.length === 0 ? (
                      <p className='text-xs text-amber-300'>本场景暂无双侧齐备的可匹配对手。</p>
                    ) : (
                      <Button
                        disabled={dispatching || lineup === null}
                        onClick={() => {
                          const pick = dualPlayers[Math.floor(Math.random() * dualPlayers.length)]
                          runPaired('pvp-ranked', pick.name)
                        }}
                      >
                        <Zap className='h-4 w-4' />
                        开始匹配
                      </Button>
                    )
                  })()}
                </>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
