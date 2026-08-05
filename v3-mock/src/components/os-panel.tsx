// OS — 选择对手（派发面板，§A5）。
// v3.4：执方由所选 agent 隐含（#62）；「切到对侧」＝切到你另一侧的 agent（没有则引导创建，#64）；
// hotseat（自打）保留（#61）——打自己对侧的 agent，对侧多个时需选择打哪个。
import { ArrowLeftRight, Lock, Search, Swords, User, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { otherSide, sideRoleShort } from '../mock/data'
import { CONFIG, SCENARIOS, store, useAppState } from '../mock/store'
import type { MatchKind } from '../mock/types'
import { Badge, Button, EmptyState, Modal, ProgressDots, Tabs } from './ui'

type OsTab = 'pve' | 'hotseat' | 'pvp-id' | 'pvp-top' | 'auto'

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

  const unlocked = agent ? store.pvpUnlocked(agent.scenarioId) : false
  const progress = agent ? store.pvpProgress(agent.scenarioId) : { beaten: 0, needed: CONFIG.pvpUnlockDistinctNpcs }
  const npcs = agent ? store.npcsFor(agent.scenarioId) : []
  // PVP 候选：约战＝选对手「对侧」的 agent-version（#62）
  const rankedCandidates = useMemo(
    () => state.publicVersions.filter((p) => p.scenarioId === scenario?.id && p.side === oppSide),
    [state.publicVersions, scenario?.id, oppSide],
  )
  const idMatchAny = state.publicVersions.find((p) => p.versionId === idInput.trim() && p.scenarioId === scenario?.id)
  const idMatch = idMatchAny?.side === oppSide ? idMatchAny : undefined

  if (!agent || !scenario) return null

  const myRole = sideRoleShort(scenario, agent.side)
  const oppRole = sideRoleShort(scenario, oppSide)
  const dispatching = confirmation !== null

  function run(kind: MatchKind, opponent: { npcId?: string; publicVersionId?: string; myVersion?: { agentId: string; versionId: string } }) {
    if (!agent || dispatching) return
    setAlert(null)
    const result = store.dispatch({ kind, scenarioId: agent.scenarioId, agentId: agent.id, versionId, opponent })
    if (!result.ok) {
      // #52 触顶：按钮可点 → 提示 → 拒绝入队；#46 限次/并发；#47 赛事阻挡；#62 对侧校验
      if (result.reason === 'daily-limit') setAlert(`今日次数已用完（${CONFIG.dailyBattleLimit}/${CONFIG.dailyBattleLimit}），明天再来`)
      else if (result.reason === 'pvp-daily-limit') setAlert(`PVP 每日限次已用完（${CONFIG.pvpDailyLimit}/${CONFIG.pvpDailyLimit}），明天再来`)
      else if (result.reason === 'concurrency') setAlert(`同时进行的对战已达上限（${CONFIG.concurrencyLimit} 场），等一场结束再派发`)
      else if (result.reason === 'trials-blocked') setAlert('赛事运行期间，试炼暂时关闭')
      else if (result.reason === 'wrong-side') setAlert(`对手必须执对侧（${oppRole}）——你执${myRole}，只能约执${oppRole}的版本`)
      else setAlert('对手无效：请检查版本 id（需与本场景匹配）')
      return
    }
    // B5 I-1：ETA + 完成后通知你；随后关闭，进行中的对战条接手
    setConfirmation('已入队 · 完成后通知你（预计 ~2 分钟）')
    closeTimer.current = window.setTimeout(() => {
      setConfirmation(null)
      onClose()
    }, 1400)
  }

  const lockBadge = !unlocked ? <Lock className='h-3 w-3' /> : undefined
  const buildOppUrl = `/scenarios/${scenario.id}/build?side=${oppSide}`

  // 「切到对侧」affordance（#62/#64）：有对侧 agent 就切过去；没有则引导创建
  const switchSide = () => {
    const target = myOppAgents[0]
    if (target) {
      setActiveAgentId(target.id)
      setVersionId(target.versions.at(-1)?.id ?? '')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`选择对手 · ${scenario.name}`} wide>
      {/* agent 预选 + 版本下拉；执方由所选 agent 隐含（#62） */}
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

          {/* 门槛锁定可见 + 进度徽章（A5/#46）；任一侧的 NPC 胜利都算（#60） */}
          {!unlocked && (
            <div className='mb-3 flex items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-2.5'>
              <Lock className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
              <ProgressDots done={progress.beaten} total={progress.needed} />
              <span className='text-xs text-(--foreground-subtle)'>
                赢过 {progress.beaten}/{progress.needed} 个不同 NPC 解锁 PVP（任一侧的胜利都算）
              </span>
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
              {/* #62：NPC 填对侧槽位；测另一侧＝换用对侧 agent */}
              <p className='text-xs text-(--foreground-muted)'>
                NPC 将执对侧（{oppRole}）。想测另一侧？切到你的{oppRole}智能体再派发。
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
                    拿当前智能体打你自己的对侧智能体——不计天梯、不算 NPC 门槛，纯自测。
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
              <div className='flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-elevated) px-3 py-2'>
                <Search className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
                <input
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  placeholder={`输入对方版本 id（需执${oppRole}；战报 / EA 页面可见）`}
                  className='w-full bg-transparent text-sm text-(--foreground) outline-none placeholder:text-(--foreground-muted)'
                />
              </div>
              {idInput.trim() && !idMatch && (
                <p className='text-xs text-amber-300'>
                  {idMatchAny
                    ? `该版本执${myRole}，与你同侧——约战需选择对手执${oppRole}的版本。`
                    : `未找到该版本 id（需属于本场景「${scenario.name}」且执${oppRole}）。`}
                </p>
              )}
              {/* A5：默认打对方最新版——不填 id 也可以直接选玩家（只列对侧 #62） */}
              {!idInput.trim() && rankedCandidates.length > 0 && (
                <div className='flex flex-col gap-2'>
                  <p className='text-[11px] text-(--foreground-muted)'>或直接选玩家的{oppRole}智能体（默认打其最新版）：</p>
                  {rankedCandidates.map((p) => (
                    <div key={p.versionId} className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-2.5'>
                      <div className='min-w-0 flex-1'>
                        <span className='text-sm font-semibold text-(--foreground)'>{p.playerName}</span>
                        <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
                          {sideRoleShort(scenario, p.side)} · {p.agentName} · 最新版 · {p.model}
                        </p>
                      </div>
                      <Button size='sm' variant='secondary' disabled={dispatching} onClick={() => run('pvp-friendly', { publicVersionId: p.versionId })}>
                        发起友谊赛
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {idMatch && (
                <div className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
                  <div className='min-w-0 flex-1'>
                    <span className='text-sm font-semibold text-(--foreground)'>{idMatch.agentName}</span>
                    <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
                      玩家 {idMatch.playerName} · 执{sideRoleShort(scenario, idMatch.side)} · 模型 {idMatch.model}
                    </p>
                  </div>
                  <Button size='sm' disabled={dispatching} onClick={() => run('pvp-friendly', { publicVersionId: idMatch.versionId })}>
                    发起友谊赛
                  </Button>
                </div>
              )}
              <ul className='flex flex-col gap-1 text-[11px] text-(--foreground-muted)'>
                <li>友谊赛不计分。对方会收到通知，无需同意、不能拒绝。{/* #29 */}</li>
                <li>约战＝选对手对侧的 agent-version：你执{myRole}，对方必须执{oppRole}。{/* #62 */}</li>
                <li>默认打对方最新版，按 id 可指定版本。</li>
                <li>PVP 每日限 {CONFIG.pvpDailyLimit} 场（发起方计次，被挑战不消耗对方次数）。{/* #46/#52 */}</li>
              </ul>
            </div>
          )}

          {tab === 'pvp-top' && (
            <div className='flex flex-col gap-3'>
              <p className='text-xs text-(--foreground-muted)'>按近期锦标赛战绩排序（天梯未建，W11 前的临时排序）。排名按玩家（#64）；挑战需选其对侧智能体。</p>
              {state.topPlayers.map((p, i) => {
                const ref = state.publicVersions.find((x) => x.versionId === p.versionRef)
                const sameScenario = p.scenarioId === scenario.id
                const oppositeSide = ref?.side === oppSide
                const clickable = sameScenario && oppositeSide
                const hint = !sameScenario
                  ? '只能挑战同场景的对手'
                  : !oppositeSide
                    ? `其公开智能体执${myRole}，与你同侧——切到对侧再挑战`
                    : undefined
                return (
                  <div key={p.versionRef} className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
                    <span className='w-6 text-center text-sm font-bold text-(--foreground-muted)'>{i + 1}</span>
                    <div className='min-w-0 flex-1'>
                      <span className='text-sm font-semibold text-(--foreground)'>{p.name}</span>
                      <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
                        锦标赛 {p.wins} 胜
                        {!sameScenario && ` · 场景不同（${SCENARIOS.find((s) => s.id === p.scenarioId)?.name ?? p.scenarioId}）`}
                        {sameScenario && ref && ` · 公开智能体执${sideRoleShort(scenario, ref.side)}`}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      variant='secondary'
                      disabled={dispatching || !clickable}
                      title={hint}
                      onClick={() => run('pvp-friendly', { publicVersionId: p.versionRef })}
                    >
                      挑战
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'auto' && (
            <div className='flex flex-col items-start gap-3'>
              <p className='text-sm text-(--foreground)'>计分对战，影响天梯。</p>
              <p className='text-xs text-(--foreground-muted)'>系统将为你匹配同场景、执{oppRole}的对手。（匹配算法为 mock，W11 待设计）</p>
              {rankedCandidates.length === 0 ? (
                <p className='text-xs text-amber-300'>本场景暂无执{oppRole}的可匹配对手。</p>
              ) : (
                <Button
                  disabled={dispatching}
                  onClick={() => {
                    const pick = rankedCandidates[Math.floor(Math.random() * rankedCandidates.length)]
                    run('pvp-ranked', { publicVersionId: pick.versionId })
                  }}
                >
                  <Zap className='h-4 w-4' />
                  开始匹配
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
