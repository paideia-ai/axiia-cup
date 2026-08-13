import { Lock, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { catalog, matches } from '../api/client'
import type {
  AgentVersionDTO,
  OpponentAgentDTO,
  PresetOpponentDTO,
  ScenarioDetail,
  Side,
} from '../api/types'
import { messageOf } from '../lib/use-async'
import { roleOfOptions, scenarioModule } from '../scenarios'
import { Button } from './ui/button'
import { Select, SelectItem } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

// OS 出战面板 v0（A5/G17）：桌面居中 Modal、移动端（<md）底部弹层。
// tabs：NPC 练习（PVE 预设）· 左右手互搏（#61——对手是你自己 isSelf 的对侧
// agent 的 PVP）· 玩家约战（P1 仅锁定占位：A5「门槛是状态」，真实解锁判定
// 在 P2；#18 不放假控件）。派发版本 = ★参赛版本，否则最新版——与服务器对
// 对手侧的取法一致（对侧版本指定需后端支持，P1 不做假选择器）。

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
  const [error, setError] = useState<string | null>(null)

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
      setError(messageOf(cause, '发起对战失败'))
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
      setError(messageOf(cause, '发起对战失败'))
      setDispatching(false)
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
          {error
            ? <p className='mb-3 text-sm text-(--accent)'>{error}</p>
            : null}

          <Tabs defaultValue='pve' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='pve'>NPC 练习</TabsTrigger>
              <TabsTrigger value='hotseat'>左右手互搏</TabsTrigger>
              <TabsTrigger value='pvp'>
                <Lock className='mr-1.5 h-3.5 w-3.5' />
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
              {/* A5 门槛是状态：P1 只呈现锁定占位，解锁判定在 P2 点亮（#18 零活动控件） */}
              <div className='flex flex-col items-center gap-2 rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'>
                <Lock className='h-5 w-5 text-(--foreground-muted)' />
                <p className='text-sm font-medium text-(--foreground-subtle)'>
                  双侧各自赢下 PVE 练习后解锁玩家约战
                </p>
                <p className='text-xs text-(--foreground-muted)'>
                  解锁判定将在下一版本上线
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
