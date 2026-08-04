// OS — 选择对手（派发面板，§A5）。
import { Lock, Search, Swords, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '../lib/cn'
import { CONFIG, SCENARIOS, store, useAppState } from '../mock/store'
import type { MatchKind, Side } from '../mock/types'
import { Badge, Button, EmptyState, Modal, ProgressDots, Tabs } from './ui'

type OsTab = 'pve' | 'pvp-id' | 'pvp-top' | 'auto'

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
  const agent = state.agents.find((a) => a.id === agentId)
  const scenario = SCENARIOS.find((s) => s.id === agent?.scenarioId)

  const [tab, setTab] = useState<OsTab>('pve')
  const [versionId, setVersionId] = useState('')
  const [mySide, setMySide] = useState<Side>('A')
  const [idInput, setIdInput] = useState('')
  const [alert, setAlert] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setTab('pve')
    setVersionId(initialVersionId ?? agent?.versions.at(-1)?.id ?? '')
    setMySide('A')
    setIdInput('')
    setAlert(null)
    setConfirmation(null)
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agentId, initialVersionId])

  const unlocked = agent ? store.pvpUnlocked(agent.scenarioId) : false
  const progress = agent ? store.pvpProgress(agent.scenarioId) : { beaten: 0, needed: CONFIG.pvpUnlockDistinctNpcs }
  const npcs = agent ? store.npcsFor(agent.scenarioId) : []
  const rankedCandidates = useMemo(
    () => state.publicVersions.filter((p) => p.scenarioId === scenario?.id),
    [state.publicVersions, scenario?.id],
  )
  const idMatch = state.publicVersions.find((p) => p.versionId === idInput.trim() && p.scenarioId === scenario?.id)

  if (!agent || !scenario) return null

  const dispatching = confirmation !== null

  function run(kind: MatchKind, opponent: { npcId?: string; publicVersionId?: string }) {
    if (!agent || dispatching) return
    setAlert(null)
    const result = store.dispatch({ kind, scenarioId: agent.scenarioId, agentId: agent.id, versionId, mySide, opponent })
    if (!result.ok) {
      // #52 触顶：按钮可点 → 提示 → 拒绝入队；#46 限次/并发；#47 赛事阻挡
      if (result.reason === 'daily-limit') setAlert(`今日次数已用完（${CONFIG.dailyBattleLimit}/${CONFIG.dailyBattleLimit}），明天再来`)
      else if (result.reason === 'pvp-daily-limit') setAlert(`PVP 每日限次已用完（${CONFIG.pvpDailyLimit}/${CONFIG.pvpDailyLimit}），明天再来`)
      else if (result.reason === 'concurrency') setAlert(`同时进行的对战已达上限（${CONFIG.concurrencyLimit} 场），等一场结束再派发`)
      else if (result.reason === 'trials-blocked') setAlert('赛事运行期间，试炼暂时关闭')
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

  return (
    <Modal open={open} onClose={onClose} title={`选择对手 · ${scenario.name}`} wide>
      {/* agent 预选 + 版本下拉 + 执方任选（#36） */}
      <div className='mb-4 flex flex-wrap items-end gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>智能体</span>
          <span className='text-sm font-semibold text-(--foreground)'>{agent.name}</span>
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
        <div className='flex flex-col gap-1'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>执方（任一侧）</span>
          <div className='flex items-center gap-1 rounded-full border border-(--border-soft) bg-white/[0.02] p-1'>
            {(['A', 'B'] as const).map((side) => (
              <button
                key={side}
                type='button'
                onClick={() => setMySide(side)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition',
                  mySide === side
                    ? side === 'A' ? 'bg-sky-950/60 text-sky-300' : 'bg-amber-950/60 text-amber-300'
                    : 'text-(--foreground-subtle) hover:text-(--foreground)',
                )}
              >
                执{side}（{side === 'A' ? scenario.sideA.name : scenario.sideB.name}）
              </button>
            ))}
          </div>
        </div>
        <span className='ml-auto text-xs text-(--foreground-muted)'>
          今日对战 {state.user?.battlesToday ?? 0}/{CONFIG.dailyBattleLimit}
        </span>
      </div>

      {agent.versions.length === 0 ? (
        <EmptyState title='还没有版本' hint='先去构建器保存一个版本，才能派发对战。' />
      ) : (
        <>
          {/* tabs 顺序：PVE → 按 id → 顶尖玩家 → 自动匹配（A5） */}
          <Tabs
            className='mb-3'
            value={tab}
            onChange={(k) => setTab(k as OsTab)}
            items={[
              { key: 'pve', label: 'PVE' },
              { key: 'pvp-id', label: 'PVP · 按 id', disabled: !unlocked, badge: lockBadge },
              { key: 'pvp-top', label: 'PVP · 顶尖玩家', disabled: !unlocked, badge: lockBadge },
              { key: 'auto', label: '自动匹配', disabled: !unlocked, badge: lockBadge },
            ]}
          />

          {/* 门槛锁定可见 + 进度徽章（A5/#46） */}
          {!unlocked && (
            <div className='mb-3 flex items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-2.5'>
              <Lock className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
              <ProgressDots done={progress.beaten} total={progress.needed} />
              <span className='text-xs text-(--foreground-subtle)'>
                赢过 {progress.beaten}/{progress.needed} 个不同 NPC 解锁 PVP
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
              {/* #28：可切换执方，双方都能测 */}
              <p className='text-xs text-(--foreground-muted)'>可随时切换自己的执方，把两侧都练一遍。</p>
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

          {tab === 'pvp-id' && (
            <div className='flex flex-col gap-3'>
              <div className='flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-elevated) px-3 py-2'>
                <Search className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
                <input
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  placeholder='输入对方版本 id（战报 / EA 页面可见）'
                  className='w-full bg-transparent text-sm text-(--foreground) outline-none placeholder:text-(--foreground-muted)'
                />
              </div>
              {idInput.trim() && !idMatch && (
                <p className='text-xs text-amber-300'>未找到该版本 id（需属于本场景「{scenario.name}」）。</p>
              )}
              {/* A5：默认打对方最新版——不填 id 也可以直接选玩家 */}
              {!idInput.trim() && rankedCandidates.length > 0 && (
                <div className='flex flex-col gap-2'>
                  <p className='text-[11px] text-(--foreground-muted)'>或直接选玩家（默认打其最新版）：</p>
                  {rankedCandidates.map((p) => (
                    <div key={p.versionId} className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-2.5'>
                      <div className='min-w-0 flex-1'>
                        <span className='text-sm font-semibold text-(--foreground)'>{p.playerName}</span>
                        <p className='mt-0.5 text-xs text-(--foreground-subtle)'>{p.agentName} · 最新版 · {p.model}</p>
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
                      玩家 {idMatch.playerName} · 模型 {idMatch.model}
                    </p>
                  </div>
                  <Button size='sm' disabled={dispatching} onClick={() => run('pvp-friendly', { publicVersionId: idMatch.versionId })}>
                    发起友谊赛
                  </Button>
                </div>
              )}
              <ul className='flex flex-col gap-1 text-[11px] text-(--foreground-muted)'>
                <li>友谊赛不计分。对方会收到通知，无需同意、不能拒绝。{/* #29 */}</li>
                <li>默认打对方最新版，按 id 可指定版本。</li>
                <li>PVP 每日限 {CONFIG.pvpDailyLimit} 场（发起方计次，被挑战不消耗对方次数）。{/* #46/#52 */}</li>
              </ul>
            </div>
          )}

          {tab === 'pvp-top' && (
            <div className='flex flex-col gap-3'>
              <p className='text-xs text-(--foreground-muted)'>按近期锦标赛战绩排序（天梯未建，W11 前的临时排序）。</p>
              {state.topPlayers.map((p, i) => {
                const sameScenario = p.scenarioId === scenario.id
                return (
                  <div key={p.versionRef} className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
                    <span className='w-6 text-center text-sm font-bold text-(--foreground-muted)'>{i + 1}</span>
                    <div className='min-w-0 flex-1'>
                      <span className='text-sm font-semibold text-(--foreground)'>{p.name}</span>
                      <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
                        锦标赛 {p.wins} 胜{!sameScenario && ` · 场景不同（${SCENARIOS.find((s) => s.id === p.scenarioId)?.name ?? p.scenarioId}）`}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      variant='secondary'
                      disabled={dispatching || !sameScenario}
                      title={sameScenario ? undefined : '只能挑战同场景的对手'}
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
              <p className='text-xs text-(--foreground-muted)'>系统将为你匹配同场景的对手。（匹配算法为 mock，W11 待设计）</p>
              {rankedCandidates.length === 0 ? (
                <p className='text-xs text-amber-300'>本场景暂无可匹配的对手。</p>
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
