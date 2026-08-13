import { Lock, Unlock, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { builder, catalog, config as configApi, matches } from '../api/client'
import type {
  AgentVersionDTO,
  ConfigResponse,
  OpponentAgentDTO,
  PresetOpponentDTO,
  ScenarioDetail,
  Side,
} from '../api/types'
import { gateMet, sideMet, sideProgressText } from '../lib/gate'
import { rejectCopy } from '../lib/reject-copy'
import { messageOf } from '../lib/use-async'
import { roleOfOptions, scenarioModule } from '../scenarios'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Select, SelectItem } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

// OS 出战面板（A5/G17）：桌面居中 Modal、移动端（<md）底部弹层。
// tabs：NPC 练习（PVE 预设）· 左右手互搏（#61——对手是你自己 isSelf 的对侧
// agent 的 PVP）· 玩家约战（P2：A5「门槛是状态」——按 gateProgress 呈现
// 锁定/已解锁两态与按侧进度徽章 #65/mock V16；真实约战控件在 P3，#18 不放假
// 控件）。派发版本 = ★参赛版本，否则最新版——与服务器对对手侧的取法一致
// （对侧版本指定需后端支持，本阶段不做假选择器）。配额脚注与拒绝文案的数字
// 来自 GET /v1/config，接口失败时静默降级（无脚注、无数字文案），不碍派发。

interface OsPanelProps {
  open: boolean
  onClose: () => void
  scenario: ScenarioDetail
  side: Side
  versions: AgentVersionDTO[]
  entryVersionID: number | null
}

export function OsPanel({
  open,
  onClose,
  scenario,
  side,
  versions,
  entryVersionID,
}: OsPanelProps) {
  const navigate = useNavigate()
  const scenarioID = scenario.summary.id
  const roleModule = scenarioModule(scenarioID)

  const [presetKey, setPresetKey] = useState<string | null>(null)
  // null = 未加载：hotseat 区在拿到对手列表前显示加载态，而非误报空态。
  const [opponents, setOpponents] = useState<OpponentAgentDTO[] | null>(null)
  const [opponentAgentID, setOpponentAgentID] = useState<number | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [creatingOpposite, setCreatingOpposite] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 受控 tab：锁定态的「去练习该侧」要能把玩家切回 NPC 练习页签。
  const [tab, setTab] = useState('pve')
  // null 双关「未加载」与「加载失败」：两种情况都按无 config 降级渲染。
  const [cfg, setCfg] = useState<ConfigResponse | null>(null)

  // 与原构建器派发区同一语义：对手侧的预设就是本侧的 PVE 对手。
  const opponentPresets: PresetOpponentDTO[] = scenario.presets.filter(
    (preset) => preset.side !== side,
  )
  // 预设若带角色 options 则标出角色名；没有就用它自己的 label。
  const presetLabel = (preset: PresetOpponentDTO) => {
    const role = roleOfOptions(roleModule, preset.options)
    return role ? `${preset.label} · ${role.name}` : preset.label
  }

  // 与原构建器一致：不预选，占位符「选择预设对手」引导玩家自己挑；
  // 场景/侧变化时只清掉失效的选择。
  useEffect(() => {
    setPresetKey((current) =>
      opponentPresets.some((preset) => preset.key === current) ? current : null
    )
  }, [scenario, side])

  useEffect(() => {
    if (!open) return
    let live = true
    // 左右手互搏的候选：对侧的可对战 agent 中 isSelf 的那些。
    void catalog
      .opponents(scenarioID, side === 'a' ? 'b' : 'a')
      .then((list) => {
        if (live) setOpponents(list.opponents)
      })
      .catch(() => {
        if (live) setOpponents([])
      })
    return () => {
      live = false
    }
  }, [open, scenarioID, side])

  useEffect(() => {
    if (!open) return
    let live = true
    // 配额脚注 + 拒绝文案数字 + 试炼开关；失败降级为 null（脚注隐藏、
    // 文案无数字），派发本身不受影响。
    void configApi
      .get()
      .then((value) => {
        if (live) setCfg(value)
      })
      .catch(() => {
        if (live) setCfg(null)
      })
    return () => {
      live = false
    }
  }, [open])

  const selfOpponents = (opponents ?? []).filter(
    (opponent) => opponent.isSelf,
  )

  useEffect(() => {
    setOpponentAgentID((current) =>
      selfOpponents.some((opponent) => opponent.agentID === current)
        ? current
        : selfOpponents[0]?.agentID ?? null
    )
  }, [opponents])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 出战版本 = ★参赛版本，否则最新版（与服务器选对手版本的规则一致）。
  const fieldedVersionID = entryVersionID ??
    versions[versions.length - 1]?.id ?? null
  const fieldedVersion = versions.find(
    (version) => version.id === fieldedVersionID,
  )

  const dispatchPVE = async () => {
    if (fieldedVersionID == null || presetKey == null) return
    setDispatching(true)
    setError(null)
    try {
      const response = await matches.dispatchPVE({
        versionID: fieldedVersionID,
        presetKey,
      })
      navigate(`/matches/${response.matchID}`)
    } catch (cause) {
      // #52/#47：按钮保持可点，拒绝在点击后给产品文案（数字来自 config）。
      setError(rejectCopy(cause, cfg, '发起对战失败'))
      setDispatching(false)
    }
  }

  const dispatchHotseat = async () => {
    if (fieldedVersionID == null || opponentAgentID == null) return
    setDispatching(true)
    setError(null)
    try {
      const response = await matches.dispatchPVP({
        versionID: fieldedVersionID,
        opponentAgentID,
      })
      navigate(`/matches/${response.matchID}`)
    } catch (cause) {
      setError(rejectCopy(cause, cfg, '发起对战失败'))
      setDispatching(false)
    }
  }

  // ── 门槛态（A5/#65，mock V16/V7）────────────────────────────────────────
  const oppositeSide: Side = side === 'a' ? 'b' : 'a'
  const sideNameOf = (which: Side) =>
    which === 'a' ? scenario.summary.sideAName : scenario.summary.sideBName
  const gateProgress = scenario.summary.gateProgress ?? null
  // 有按侧进度就按它判定（A6 双侧过线）；老服务器没有 → 沿用 gateUnlocked。
  const pvpUnlocked = gateProgress
    ? gateMet(gateProgress)
    : scenario.summary.gateUnlocked

  // 「去创建对侧」（mock V7）：懒 ensure（get-or-create）后带预选参数进构建器。
  const createOpposite = async () => {
    setCreatingOpposite(true)
    setError(null)
    try {
      const { agentID } = await builder.ensure({
        scenarioID,
        side: oppositeSide,
      })
      onClose()
      navigate(
        `/agents/${agentID}/build?scenario=${scenarioID}&side=${oppositeSide}`,
      )
    } catch (cause) {
      setError(messageOf(cause, '创建对侧智能体失败'))
      setCreatingOpposite(false)
    }
  }

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border border-(--border-soft) bg-(--surface) shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:max-w-xl md:rounded-xl'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex items-start justify-between gap-3 border-b border-(--border-soft) px-5 py-4'>
          <div className='min-w-0'>
            <h2 className='text-base font-semibold text-(--foreground)'>
              出战 · {scenario.summary.title}
            </h2>
            <p className='mt-0.5 text-xs text-(--foreground-muted)'>
              {fieldedVersion
                ? entryVersionID != null
                  ? `出战版本：★参赛版本 v${fieldedVersion.snapshotSeq}`
                  : `出战版本：最新版 v${fieldedVersion.snapshotSeq}`
                : '先保存一个版本才能出战。'}
            </p>
          </div>
          <button
            type='button'
            aria-label='关闭'
            onClick={onClose}
            className='rounded-md p-1.5 text-(--foreground-muted) transition hover:bg-white/4 hover:text-(--foreground)'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='px-5 py-4'>
          {/* #47 被阻挡态：提前告知；按钮仍可点，点了由 trials_blocked 拒绝 */}
          {cfg?.trialsBlocked
            ? (
              <p className='mb-3 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] px-3 py-2 text-sm text-(--warning)'>
                赛事进行中，试炼暂时关闭——请稍后再来
              </p>
            )
            : null}
          {error
            ? <p className='mb-3 text-sm text-(--accent)'>{error}</p>
            : null}

          <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
            <TabsList>
              <TabsTrigger value='pve'>NPC 练习</TabsTrigger>
              <TabsTrigger value='hotseat'>左右手互搏</TabsTrigger>
              <TabsTrigger value='pvp'>
                {pvpUnlocked
                  ? <Unlock className='mr-1.5 h-3.5 w-3.5' />
                  : <Lock className='mr-1.5 h-3.5 w-3.5' />}
                玩家约战
              </TabsTrigger>
            </TabsList>

            <TabsContent value='pve' className='space-y-3'>
              {opponentPresets.length === 0
                ? (
                  <p className='text-sm text-(--foreground-muted)'>
                    该场景暂无对手侧的预设对手。
                  </p>
                )
                : (
                  <>
                    <div className='w-full max-w-xs'>
                      <Select
                        placeholder='选择预设对手'
                        value={presetKey ?? undefined}
                        renderValue={(v) => {
                          const preset = opponentPresets.find(
                            (item) => item.key === v,
                          )
                          return preset ? presetLabel(preset) : v
                        }}
                        onValueChange={(v) => setPresetKey(v ?? null)}
                      >
                        {opponentPresets.map((preset) => (
                          <SelectItem key={preset.key} value={preset.key}>
                            {presetLabel(preset)}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <Button
                      data-testid='dispatch-match'
                      onClick={() => void dispatchPVE()}
                      disabled={dispatching ||
                        presetKey == null ||
                        fieldedVersionID == null}
                    >
                      {dispatching ? '派发中…' : '发起对战'}
                    </Button>
                  </>
                )}
            </TabsContent>

            <TabsContent value='hotseat' className='space-y-3'>
              {opponents === null
                ? (
                  <p className='text-sm text-(--foreground-subtle)'>
                    加载中…
                  </p>
                )
                : selfOpponents.length === 0
                ? (
                  <div className='rounded-lg border border-dashed border-(--border-soft) px-4 py-6 text-center'>
                    <p className='text-sm font-medium text-(--foreground)'>
                      你还没有对侧智能体
                    </p>
                    <p className='mt-1 text-xs text-(--foreground-muted)'>
                      左右手互搏＝拿本方打你自己的对侧。先为另一方构建并保存版本。
                    </p>
                    <div className='mt-4 flex justify-center'>
                      <Link to='/my-agents' onClick={onClose}>
                        <Button size='sm' variant='secondary'>
                          去我的智能体
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
                : (
                  <>
                    {selfOpponents.length > 1
                      ? (
                        <div className='w-full max-w-xs'>
                          <Select
                            placeholder='选择你的对侧智能体'
                            value={opponentAgentID != null
                              ? String(opponentAgentID)
                              : undefined}
                            renderValue={(v) => {
                              const opponent = selfOpponents.find(
                                (item) => String(item.agentID) === v,
                              )
                              return opponent
                                ? `${opponent.displayName} · agent #${opponent.agentID}`
                                : v
                            }}
                            onValueChange={(v) =>
                              setOpponentAgentID(v ? Number(v) : null)}
                          >
                            {selfOpponents.map((opponent) => (
                              <SelectItem
                                key={opponent.agentID}
                                value={String(opponent.agentID)}
                              >
                                {opponent.displayName} · agent #
                                {opponent.agentID}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      )
                      : (
                        <p className='text-sm text-(--foreground)'>
                          对侧：{selfOpponents[0].displayName} · agent #
                          {selfOpponents[0].agentID}
                        </p>
                      )}
                    {/* #18：对侧版本选择需后端支持（后续阶段），不放假选择器 */}
                    <p className='text-xs text-(--foreground-muted)'>
                      对侧将以其★参赛版本（否则最新版）出战 ·
                      指定具体版本将在后续版本开放。
                    </p>
                    <Button
                      onClick={() => void dispatchHotseat()}
                      disabled={dispatching ||
                        opponentAgentID == null ||
                        fieldedVersionID == null}
                    >
                      {dispatching ? '派发中…' : '自打一场'}
                    </Button>
                  </>
                )}
            </TabsContent>

            <TabsContent value='pvp'>
              {/* A5 门槛是状态：锁定/已解锁都如实呈现；真实约战控件在 P3（#18 不放假控件） */}
              {pvpUnlocked
                ? (
                  <div className='flex flex-col items-center gap-2 rounded-lg border border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.06)] px-4 py-8 text-center'>
                    <Unlock className='h-5 w-5 text-(--success)' />
                    <p className='text-sm font-medium text-(--foreground)'>
                      已解锁（对手玩家约战将在下一版本上线）
                    </p>
                    {gateProgress
                      ? (
                        <div className='flex flex-wrap justify-center gap-2'>
                          {(['a', 'b'] as const).map((which) => (
                            <Badge key={which} tone='success'>
                              {sideNameOf(which)}{' '}
                              {sideProgressText(gateProgress[which])} ✓
                            </Badge>
                          ))}
                        </div>
                      )
                      : null}
                  </div>
                )
                : gateProgress
                ? (
                  <div className='flex flex-col items-center gap-3 rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'>
                    <Lock className='h-5 w-5 text-(--foreground-muted)' />
                    <p className='text-sm font-medium text-(--foreground-subtle)'>
                      每侧各赢 ≥{gateProgress.a.needed} 场 NPC 练习解锁玩家约战
                    </p>
                    {/* 按侧进度徽章（#65，mock V16）：如 商鞅 1/1 ✓ · 甘龙 0/1 */}
                    <div className='flex flex-wrap justify-center gap-2'>
                      {(['a', 'b'] as const).map((which) => (
                        <Badge
                          key={which}
                          tone={sideMet(gateProgress[which])
                            ? 'success'
                            : 'info'}
                        >
                          {sideNameOf(which)}{' '}
                          {sideProgressText(gateProgress[which])}
                          {sideMet(gateProgress[which]) ? ' ✓' : ''}
                        </Badge>
                      ))}
                    </div>
                    {
                      /* 差哪侧补哪侧（#62/#64，mock V7）：本侧未达标 → 切回
                      NPC 练习页签；对侧未达标 → 有对侧 agent 去我的智能体换
                      执侧，没有则懒创建进构建器 */
                    }
                    <div className='flex flex-wrap justify-center gap-2'>
                      {!sideMet(gateProgress[side])
                        ? (
                          <Button
                            size='sm'
                            variant='secondary'
                            onClick={() => setTab('pve')}
                          >
                            去练习该侧（{sideNameOf(side)}）
                          </Button>
                        )
                        : null}
                      {!sideMet(gateProgress[oppositeSide])
                        ? selfOpponents.length > 0
                          ? (
                            <Button
                              size='sm'
                              variant='secondary'
                              onClick={() => {
                                onClose()
                                navigate('/my-agents')
                              }}
                            >
                              去练习对侧（{sideNameOf(oppositeSide)}）
                            </Button>
                          )
                          : (
                            <Button
                              size='sm'
                              variant='secondary'
                              disabled={creatingOpposite}
                              onClick={() => void createOpposite()}
                            >
                              {creatingOpposite
                                ? '创建中…'
                                : `去创建对侧（${sideNameOf(oppositeSide)}）`}
                            </Button>
                          )
                        : null}
                    </div>
                  </div>
                )
                : (
                  // 老服务器（无 gateProgress）：保留 P1 的锁定占位，不摆假进度
                  <div className='flex flex-col items-center gap-2 rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'>
                    <Lock className='h-5 w-5 text-(--foreground-muted)' />
                    <p className='text-sm font-medium text-(--foreground-subtle)'>
                      双侧各自赢下 PVE 练习后解锁玩家约战
                    </p>
                    <p className='text-xs text-(--foreground-muted)'>
                      解锁进度将在数据接入后点亮
                    </p>
                  </div>
                )}
            </TabsContent>
          </Tabs>
        </div>

        {/* 面板脚注：三类配额中的两条日额（#52/#46），数字来自 /v1/config */}
        {cfg
          ? (
            <div className='border-t border-(--border-soft) px-5 py-3 text-xs text-(--foreground-muted)'>
              今日已用 {cfg.usage.battlesToday}/{cfg.dailyBattleLimit}（PVP{' '}
              {cfg.usage.pvpBattlesToday}/{cfg.pvpDailyLimit}）
            </div>
          )
          : null}
      </div>
    </div>
  )
}
