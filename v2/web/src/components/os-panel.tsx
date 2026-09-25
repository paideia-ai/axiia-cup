import { roleIdentity } from '../lib/role-identity'
import { Dialog } from '@base-ui-components/react/dialog'
import { Lock, Unlock, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  ApiError,
  catalog,
  challenges,
  config as configApi,
  matches,
  versions as versionsApi,
} from '../api/client'
import type {
  AgentVersionDTO,
  ChallengeOpponentRequest,
  ChallengeResponse,
  ConfigResponse,
  OpponentAgentDTO,
  PresetOpponentDTO,
  ScenarioDetail,
  Side,
  VersionRefResponse,
} from '../api/types'
import { gateMet, sideMet, sideProgressText } from '../lib/gate'
import { BattleOpponentRow } from './battle-opponent-row'
import { useBattleQuote } from '../context/rewards'
import { playSound, unlockAudio } from '../lib/sound'
import { trackSoundMatch } from '../lib/match-sound'
import { challengeRejectCopy, rejectCopy } from '../lib/reject-copy'
import { messageOf } from '../lib/use-async'
import { versionTag } from '../lib/version-label'
import { roleOfOptions, scenarioModule } from '../scenarios'
import { tm } from '../testmode/mark'
import { Badge } from './ui/badge'
import { Button, ButtonLink } from './ui/button'
import { agentEntryUrl } from '../lib/agent-entry'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface OsPanelProps {
  open: boolean
  onClose: () => void
  scenario: ScenarioDetail
  side: Side
  versions: AgentVersionDTO[]
  agentName?: string | null
  entryVersionID: number | null
  // #88：从版本卡「出战」呼出时，钉住玩家点的那一版（否则回落 ★ / 最新版）。
  preferVersionID?: number | null
}

export function OsPanel({
  open,
  onClose,
  scenario,
  side,
  versions,
  entryVersionID,
  agentName,
  preferVersionID = null,
}: OsPanelProps) {
  const navigate = useNavigate()
  const liveRef = useRef(true)
  const dialogRef = useRef<HTMLDivElement>(null)
  const dispatchRef = useRef(false)
  const [pendingOpponent, setPendingOpponent] = useState<string | null>(null)
  const [opponentError, setOpponentError] = useState(false)
  const [opponentRetry, setOpponentRetry] = useState(0)
  const [search, setSearch] = useState('')
  const scenarioID = scenario.summary.id
  const roleModule = scenarioModule(scenarioID)

  // null = 未加载：hotseat 区在拿到对手列表前显示加载态，而非误报空态。
  const [opponents, setOpponents] = useState<OpponentAgentDTO[] | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 受控 tab：锁定态的「去练习该侧」要能把玩家切回 NPC 练习页签。
  const [tab, setTab] = useState('pve')
  const quoteState = useBattleQuote(
    scenarioID,
    side,
    tab,
    open,
  )
  const insufficientPoints = quoteState.blocked
  // null 双关「未加载」与「加载失败」：两种情况都按无 config 降级渲染。
  const [cfg, setCfg] = useState<ConfigResponse | null>(null)
  const configRequestRef = useRef(0)

  const [pvpMode, setPvpMode] = useState<'players' | 'byid'>('players')
  const [idInput, setIdInput] = useState('')
  const [idRef, setIdRef] = useState<VersionRefResponse | null>(null)
  const [idError, setIdError] = useState<string | null>(null)
  const [idLooking, setIdLooking] = useState(false)
  const idInputRef = useRef('')
  const idLookupRequestRef = useRef(0)
  const [challengeDone, setChallengeDone] = useState<ChallengeResponse | null>(
    null,
  )
  // POST /v1/challenges 在老服务器上 404/405：降级为功能提示，不摆假表单。
  const [challengeUnavailable, setChallengeUnavailable] = useState(false)
  const dismissLocked = dispatching

  useEffect(() => {
    liveRef.current = true
    return () => {
      liveRef.current = false
    }
  }, [])

  // 与原构建器派发区同一语义：对手侧的预设就是本侧的 PVE 对手。
  const opponentPresets: PresetOpponentDTO[] = scenario.presets.filter(
    (preset) => preset.side !== side,
  )
  // 预设若带角色 options 则标出角色名；没有就用它自己的 label。
  const presetLabel = (preset: PresetOpponentDTO) => {
    const role = roleOfOptions(roleModule, preset.options)
    return role ? `${preset.label} · ${role.name}` : preset.label
  }

  useEffect(() => {
    if (!open) return
    let live = true
    setOpponents(null)
    setOpponentError(false)
    // 左右手互搏的候选：对侧的可对战 agent 中 isSelf 的那些。
    void catalog
      .opponents(scenarioID, side === 'a' ? 'b' : 'a')
      .then((list) => {
        if (live) setOpponents(list.opponents)
      })
      .catch(() => {
        if (live) setOpponentError(true)
      })
    return () => {
      live = false
    }
  }, [open, scenarioID, side, opponentRetry])

  useEffect(() => {
    if (!open) return
    let live = true
    const requestID = ++configRequestRef.current
    // Keep config for rejection copy and the trial availability notice.
    void configApi
      .get()
      .then((value) => {
        if (live && requestID === configRequestRef.current) setCfg(value)
      })
      .catch(() => {
        if (live && requestID === configRequestRef.current) setCfg(null)
      })
    return () => {
      live = false
      configRequestRef.current += 1
    }
  }, [open])

  const configAfterRejection = async (cause: unknown) => {
    if (
      !(cause instanceof ApiError) ||
      !['daily_limit', 'pvp_daily_limit'].includes(cause.code)
    ) return cfg
    const requestID = ++configRequestRef.current
    // Another tab or an in-flight battle can consume the last slot after this
    // panel opens. Re-read before deciding between exhausted and one-slot copy.
    // This read improves a rejection already received. A stalled read must not
    // hide that rejection or leave the dispatch button disabled indefinitely.
    const fresh = await configApi.get({ signal: AbortSignal.timeout(3000) })
      .catch(() => null)
    if (!liveRef.current || requestID !== configRequestRef.current) return null
    setCfg(fresh)
    return fresh
  }

  const selfOpponents = (opponents ?? []).filter(
    (opponent) => opponent.isSelf,
  )

  // 出战版本 = ★参赛版本，否则最新版（与服务器选对手版本的规则一致）。
  // 派发取版：玩家点的那一版 > ★参赛版本 > 最新版（与服务器对对手侧的取法
  // 一致）。preferVersionID 只在版本卡「出战」路径上有值（#88）。
  const fieldedVersionID = preferVersionID ?? entryVersionID ??
    versions[versions.length - 1]?.id ?? null
  const fieldedVersion = versions.find(
    (version) => version.id === fieldedVersionID,
  )

  const dispatchPVE = async (presetKey: string) => {
    if (fieldedVersion == null || dispatchRef.current || insufficientPoints) {
      return
    }
    dispatchRef.current = true
    setPendingOpponent(`pve:${presetKey}`)
    unlockAudio()
    playSound('click')
    setDispatching(true)
    setError(null)
    try {
      const response = await matches.dispatchPVE({
        versionID: fieldedVersion.id,
        presetKey,
      })
      if (!liveRef.current) return
      playSound('dispatch', String(response.matchID))
      trackSoundMatch(response.matchID)
      navigate(`/matches/${response.matchID}`)
    } catch (cause) {
      if (!liveRef.current) return
      // #52/#47：按钮保持可点，拒绝在点击后给产品文案（数字来自 config）。
      const freshConfig = await configAfterRejection(cause)
      if (!liveRef.current) return
      setError(rejectCopy(cause, freshConfig, '发起对战失败'))
      dispatchRef.current = false
      setPendingOpponent(null)
      setDispatching(false)
    }
  }

  const dispatchHotseat = async (opponentAgentID: number) => {
    if (
      fieldedVersion == null || dispatchRef.current || insufficientPoints
    ) return
    dispatchRef.current = true
    setPendingOpponent(`self:${opponentAgentID}`)
    unlockAudio()
    playSound('click')
    setDispatching(true)
    setError(null)
    try {
      const response = await matches.dispatchPVP({
        versionID: fieldedVersion.id,
        opponentAgentID,
      })
      if (!liveRef.current) return
      playSound('dispatch', String(response.matchID))
      trackSoundMatch(response.matchID)
      navigate(`/matches/${response.matchID}`)
    } catch (cause) {
      if (!liveRef.current) return
      const freshConfig = await configAfterRejection(cause)
      if (!liveRef.current) return
      setError(rejectCopy(cause, freshConfig, '发起对战失败'))
      dispatchRef.current = false
      setPendingOpponent(null)
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

  // ── P3 约战（#66，mock V20） ──────────────────────────────────────────

  // 面板每次打开重置约战流的一次性状态。
  useEffect(() => {
    if (!open) {
      idLookupRequestRef.current += 1
      return
    }
    dispatchRef.current = false
    setPendingOpponent(null)
    setDispatching(false)
    setError(null)
    setSearch('')
    setIdLooking(false)
    setChallengeDone(null)
    setChallengeUnavailable(false)
    setPvpMode('players')
    setIdInput('')
    idInputRef.current = ''
    idLookupRequestRef.current += 1
    setIdRef(null)
    setIdError(null)
  }, [open])

  // 对手玩家（#66①）：对侧可对战 agent 中非 isSelf 的，按 ownerAccountID
  // 去重成「玩家」行；老服务器条目无 ownerAccountID → 过滤掉（不给假按钮）。
  const rivals = useMemo(() => {
    const seen = new Set<string>()
    const list: {
      accountID: string
      displayName: string
    }[] = []
    for (const opponent of opponents ?? []) {
      if (opponent.isSelf) continue
      const accountID = opponent.ownerAccountID
      if (accountID == null || accountID === '' || seen.has(accountID)) {
        continue
      }
      seen.add(accountID)
      list.push({
        accountID,
        displayName: opponent.displayName,
      })
    }
    return list
  }, [opponents])
  // 有对手却全都缺 ownerAccountID＝老服务器：提示改走按 id。
  const rivalsUnattributed = rivals.length === 0 &&
    (opponents ?? []).some((opponent) => !opponent.isSelf)

  const submitChallenge = async (opponent: ChallengeOpponentRequest) => {
    if (
      fieldedVersion == null || dispatchRef.current || insufficientPoints ||
      !pvpUnlocked
    ) {
      return
    }
    if (opponent.pinnedVersionID != null) {
      const currentID = Number(idInputRef.current.trim())
      if (
        !Number.isInteger(currentID) || currentID <= 0 || idRef == null ||
        idRef.versionID !== currentID || opponent.pinnedVersionID !== currentID
      ) {
        setIdRef(null)
        setIdError('版本 id 已变化，请重新查询后再约战')
        return
      }
    }
    dispatchRef.current = true
    setPendingOpponent(
      opponent.pinnedVersionID != null
        ? `version:${opponent.pinnedVersionID}`
        : `player:${opponent.accountID}`,
    )
    unlockAudio()
    playSound('click')
    setDispatching(true)
    setError(null)
    try {
      const response = await challenges.create({
        scenarioID,
        mine: { [side]: { versionID: fieldedVersion.id } },
        opponent,
      })
      if (!liveRef.current) return
      playSound('dispatch', `challenge:${response.challengeID}`)
      for (const matchID of response.matchIDs) trackSoundMatch(matchID)
      if (response.matchIDs.length > 0) {
        onClose()
        navigate(`/matches/${response.matchIDs[0]}`)
      } else {
        setChallengeDone(response)
      }
    } catch (cause) {
      if (!liveRef.current) return
      if (
        cause instanceof ApiError && cause.code === 'unknown' &&
        (cause.status === 404 || cause.status === 405)
      ) {
        setChallengeUnavailable(true)
      } else {
        const freshConfig = await configAfterRejection(cause)
        if (!liveRef.current) return
        setError(challengeRejectCopy(cause, freshConfig))
      }
    } finally {
      if (liveRef.current) {
        dispatchRef.current = false
        setPendingOpponent(null)
        setDispatching(false)
      }
    }
  }

  // 指定版本约战（#66②/#25）：版本 id → 公开身份卡；跨场景就地报错。
  const lookupRef = async () => {
    const normalizedInput = idInputRef.current.trim()
    const id = Number(normalizedInput)
    const requestID = ++idLookupRequestRef.current
    setIdRef(null)
    if (!Number.isInteger(id) || id <= 0) {
      setIdError('请输入数字版本 id（战报页可复制）')
      return
    }
    setIdLooking(true)
    setIdError(null)
    try {
      const ref = await versionsApi.ref(id)
      if (
        !liveRef.current || requestID !== idLookupRequestRef.current ||
        idInputRef.current.trim() !== normalizedInput
      ) return
      if (ref.scenarioID !== scenarioID) {
        setIdError(
          `该版本属于其他场景（${ref.scenarioID}），不能用于本场景约战`,
        )
      } else if (ref.side !== oppositeSide) {
        setIdError(
          `请选择对方的${sideNameOf(oppositeSide)}版本，与当前${
            sideNameOf(side)
          }对战`,
        )
      } else {
        setIdRef(ref)
      }
    } catch (cause) {
      if (
        !liveRef.current || requestID !== idLookupRequestRef.current ||
        idInputRef.current.trim() !== normalizedInput
      ) return
      if (cause instanceof ApiError && cause.code === 'not_found') {
        setIdError('未找到该版本 id')
      } else if (
        cause instanceof ApiError && cause.code === 'unknown' &&
        (cause.status === 404 || cause.status === 405)
      ) {
        setIdError('服务器版本暂不支持按 id 查询——该功能即将上线')
      } else {
        setIdError(messageOf(cause, '查询失败'))
      }
    } finally {
      if (liveRef.current && requestID === idLookupRequestRef.current) {
        setIdLooking(false)
      }
    }
  }

  const rowDisabled = dispatching || insufficientPoints ||
    fieldedVersion == null
  const fieldedRoleName = roleIdentity({
    scenarioID,
    side,
    role: fieldedVersion?.role,
    options: fieldedVersion?.options,
    fallback: sideNameOf(side),
  }).name
  const modelLabel = (modelID: string) =>
    cfg?.models.find((model) => model.id === modelID)?.label ?? modelID
  const filteredRivals = rivals.filter((rival) =>
    rival.displayName.toLocaleLowerCase().includes(
      search.trim().toLocaleLowerCase(),
    )
  )

  return (
    <Dialog.Root
      open={open}
      modal
      disablePointerDismissal={dismissLocked}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !dismissLocked) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm' />
        <Dialog.Viewport className='fixed inset-0 z-[51] flex items-end justify-center md:items-center md:p-6'>
          <Dialog.Popup
            ref={dialogRef}
            initialFocus={dialogRef}
            finalFocus
            className='flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-(--border-soft) bg-(--surface) text-(--foreground) shadow-[0_20px_60px_rgba(0,0,0,0.5)] outline-none md:max-w-xl md:rounded-xl'
            {...tm('OS.panel')}
          >
            <header className='shrink-0 px-5 pt-5 pb-4 md:px-6 md:pt-6'>
              <div className='flex items-start justify-between gap-3'>
                <Dialog.Title
                  className='text-base font-semibold leading-6 text-(--foreground)'
                  {...tm('OS.panel-title')}
                >
                  出战{' '}
                  <span className='font-normal text-(--foreground-muted)'>
                    · {scenario.summary.title}
                  </span>
                </Dialog.Title>
                <Dialog.Close
                  aria-label='关闭'
                  disabled={dismissLocked}
                  className='-m-2 rounded-md p-3.5 text-(--foreground-muted) transition hover:bg-white/4 hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-50'
                  {...tm('OS.close-button')}
                >
                  <X aria-hidden='true' className='h-4 w-4' />
                </Dialog.Close>
              </div>
              <Dialog.Description className='sr-only'>
                选择对手
              </Dialog.Description>
              <div
                className='mt-5 flex items-start justify-between gap-4'
                {...tm('OS.lineup')}
              >
                <div className='min-w-0'>
                  <p className='flex flex-wrap items-baseline gap-x-2 text-[18px] leading-7 font-semibold'>
                    {agentName || fieldedRoleName}
                    {agentName && (
                      <span className='text-xs font-normal text-(--foreground-subtle)'>
                        {fieldedRoleName}
                      </span>
                    )}
                  </p>
                  <p className='mt-1 text-xs leading-5 text-(--foreground-muted)'>
                    {fieldedVersion
                      ? modelLabel(fieldedVersion.modelID)
                      : '先保存一个版本才能出战。'}
                  </p>
                </div>
                {fieldedVersion && (
                  <div
                    className='shrink-0 pt-1 text-right'
                    {...tm('OS.fielded-version')}
                  >
                    <span className='text-sm font-medium text-(--foreground-subtle)'>
                      {versionTag(fieldedVersion, versions)}
                    </span>
                    {fieldedVersionID === entryVersionID && (
                      <p className='mt-1 text-[11px] leading-5 text-(--foreground-muted)'>
                        ★参赛版本
                      </p>
                    )}
                  </div>
                )}
              </div>
            </header>
            <div className='min-h-0 overflow-y-auto overscroll-contain px-5 pt-0 pb-5 md:px-6 md:pb-6'>
              {cfg?.trialsBlocked && (
                <p
                  className='mb-3 text-sm text-(--warning)'
                  {...tm('OS.trials-blocked-notice')}
                >
                  赛事进行中，试炼暂时关闭——请稍后再来
                </p>
              )}
              {error && (
                <p
                  role='alert'
                  className='mb-3 text-sm text-(--warning)'
                  {...tm('OS.error-notice')}
                >
                  {error}
                </p>
              )}
              {quoteState.loading
                ? (
                  <p
                    role='status'
                    className='mb-3 text-xs text-(--foreground-subtle)'
                  >
                    正在确认对战资格…
                  </p>
                )
                : quoteState.error
                ? (
                  <div
                    className='mb-3 flex items-center justify-between gap-2 text-xs text-(--warning)'
                    role='alert'
                  >
                    <span>暂时无法开始对战，请重试。</span>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={quoteState.retry}
                    >
                      重试
                    </Button>
                  </div>
                )
                : insufficientPoints
                ? (
                  <p role='status' className='mb-3 text-xs text-(--warning)'>
                    积分不足
                  </p>
                )
                : null}
              <div className='sr-only' role='status'>
                {dispatching ? '正在创建对战，请稍候。' : ''}
              </div>
              <Tabs
                value={tab}
                onValueChange={(value) => {
                  if (dispatching) return
                  setTab(value)
                  setError(null)
                  setSearch('')
                }}
                className='space-y-0'
              >
                <TabsList className='mb-5 gap-1' {...tm('OS.tabs')}>
                  <TabsTrigger
                    value='pve'
                    disabled={dispatching}
                    className='min-w-0 flex-1 px-3 max-[360px]:px-2 max-[360px]:text-xs'
                    {...tm('OS.tab-pve')}
                  >
                    NPC 练习
                  </TabsTrigger>
                  <TabsTrigger
                    value='pvp'
                    disabled={dispatching}
                    className='min-w-0 flex-1 px-3 max-[360px]:px-2 max-[360px]:text-xs'
                    {...tm('OS.tab-pvp')}
                  >
                    {pvpUnlocked
                      ? (
                        <Unlock
                          aria-hidden='true'
                          className='mr-1.5 h-3.5 w-3.5'
                        />
                      )
                      : (
                        <Lock
                          aria-hidden='true'
                          className='mr-1.5 h-3.5 w-3.5'
                        />
                      )}玩家约战
                  </TabsTrigger>
                  <TabsTrigger
                    value='hotseat'
                    disabled={dispatching}
                    className='min-w-0 flex-1 px-3 max-[360px]:px-2 max-[360px]:text-xs'
                    {...tm('OS.tab-hotseat')}
                  >
                    左右手互搏
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='pve' className='space-y-2.5'>
                  {opponentPresets.length === 0
                    ? (
                      <p
                        className='text-sm text-(--foreground-muted)'
                        {...tm('OS.pve-empty')}
                      >
                        该场景暂无对手侧的预设对手。
                      </p>
                    )
                    : opponentPresets.map((preset) => (
                      <BattleOpponentRow
                        key={preset.key}
                        label={presetLabel(preset)}
                        detail={`${sideNameOf(oppositeSide)} · ${
                          modelLabel(preset.modelID)
                        }`}
                        disabled={rowDisabled}
                        pending={pendingOpponent === `pve:${preset.key}`}
                        onClick={() => void dispatchPVE(preset.key)}
                        data-testid='dispatch-match'
                        data-spec='U19-C07 U19-C19 U19-C20'
                        {...tm('OS.pve-dispatch-button')}
                      />
                    ))}
                </TabsContent>
                <TabsContent value='hotseat' className='space-y-2.5'>
                  {opponentError
                    ? (
                      <div role='alert' className='space-y-3'>
                        <p className='text-sm text-(--foreground-subtle)'>
                          对手暂时没有加载出来
                        </p>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => setOpponentRetry((value) => value + 1)}
                        >
                          重新加载
                        </Button>
                      </div>
                    )
                    : opponents === null
                    ? (
                      <p
                        className='text-sm text-(--foreground-subtle)'
                        {...tm('OS.hotseat-loading')}
                      >
                        加载中…
                      </p>
                    )
                    : selfOpponents.length === 0
                    ? (
                      <div
                        className='rounded-lg border border-dashed border-(--border-soft) px-4 py-6 text-center'
                        {...tm('OS.hotseat-empty')}
                      >
                        <p className='mb-4 text-sm font-medium'>
                          你还没有对侧智能体
                        </p>
                        <ButtonLink
                          to='/my-agents'
                          size='sm'
                          variant='secondary'
                          {...tm('OS.hotseat-go-my-agents')}
                        >
                          去我的智能体
                        </ButtonLink>
                      </div>
                    )
                    : selfOpponents.map((opponent) => (
                      <BattleOpponentRow
                        key={opponent.agentID}
                        label={opponent.name ||
                          `${sideNameOf(oppositeSide)} #${opponent.agentID}`}
                        detail={`${sideNameOf(oppositeSide)} · 我的智能体`}
                        disabled={rowDisabled}
                        pending={pendingOpponent === `self:${opponent.agentID}`}
                        onClick={() => void dispatchHotseat(opponent.agentID)}
                        data-spec='U19-C07 U19-C19 U19-C20'
                        {...tm('OS.hotseat-dispatch-button')}
                      />
                    ))}
                </TabsContent>
                <TabsContent value='pvp' className='space-y-3'>
                  {pvpUnlocked
                    ? challengeDone
                      ? (
                        <div
                          className='space-y-3'
                          {...tm('OS.challenge-success')}
                        >
                          <p className='text-sm font-semibold'>
                            已发起约战 · 对局已入队
                          </p>
                          {challengeDone.matchIDs.map((matchID) => (
                            <Link
                              key={matchID}
                              to={`/matches/${matchID}`}
                              className='text-sm underline'
                            >
                              对局 · #{matchID}
                            </Link>
                          ))}
                        </div>
                      )
                      : challengeUnavailable
                      ? (
                        <p
                          className='text-sm text-(--foreground-muted)'
                          {...tm('OS.challenge-unavailable')}
                        >
                          约战功能尚未在该服务器启用——敬请期待
                        </p>
                      )
                      : (
                        <>
                          <div
                            className='flex flex-wrap items-center justify-between gap-2'
                            {...tm('OS.pvp-mode-switch')}
                          >
                            <p className='text-sm text-(--foreground-subtle)'>
                              {pvpMode === 'byid'
                                ? '指定对方版本'
                                : '选择对手玩家'}
                            </p>
                            <Button
                              variant='ghost'
                              size='sm'
                              disabled={dispatching}
                              onClick={() => {
                                setPvpMode(
                                  pvpMode === 'players' ? 'byid' : 'players',
                                )
                                setError(null)
                                setIdError(null)
                              }}
                              {...tm('OS.pvp-mode-button')}
                            >
                              {pvpMode === 'players'
                                ? '指定版本 ID'
                                : '返回玩家列表'}
                            </Button>
                          </div>
                          {pvpMode === 'players'
                            ? opponentError
                              ? (
                                <div role='alert' className='space-y-3'>
                                  <p className='text-sm text-(--foreground-subtle)'>
                                    对手暂时没有加载出来
                                  </p>
                                  <Button
                                    variant='secondary'
                                    size='sm'
                                    onClick={() =>
                                      setOpponentRetry((value) => value + 1)}
                                  >
                                    重新加载
                                  </Button>
                                </div>
                              )
                              : opponents === null
                              ? (
                                <p
                                  className='text-sm text-(--foreground-subtle)'
                                  {...tm('OS.rivals-loading')}
                                >
                                  加载中…
                                </p>
                              )
                              : rivals.length === 0
                              ? (
                                <p
                                  className='text-sm text-(--foreground-muted)'
                                  {...tm('OS.rivals-empty')}
                                >
                                  {rivalsUnattributed
                                    ? '暂不支持按玩家约战，请使用指定版本 ID'
                                    : '暂无可约战的对手玩家'}
                                </p>
                              )
                              : (
                                <div className='space-y-2.5'>
                                  {rivals.length > 6 && (
                                    <Input
                                      type='search'
                                      aria-label='搜索玩家'
                                      placeholder='输入玩家名称'
                                      value={search}
                                      disabled={dispatching}
                                      onChange={(event) =>
                                        setSearch(event.target.value)}
                                    />
                                  )}
                                  {filteredRivals.map((rival) => (
                                    <div
                                      key={rival.accountID}
                                      {...tm('OS.rival-row')}
                                    >
                                      <BattleOpponentRow
                                        label={rival.displayName}
                                        detail={`对方执${
                                          sideNameOf(oppositeSide)
                                        }`}
                                        disabled={rowDisabled}
                                        pending={pendingOpponent ===
                                          `player:${rival.accountID}`}
                                        onClick={() =>
                                          void submitChallenge({
                                            accountID: rival.accountID,
                                          })}
                                        data-spec='U19-C07 U19-C19 U19-C20'
                                        {...tm('OS.challenge-button')}
                                      />
                                    </div>
                                  ))}
                                  {filteredRivals.length === 0 && (
                                    <p
                                      role='status'
                                      className='text-sm text-(--foreground-muted)'
                                    >
                                      没有找到这位玩家，试试其他名称。
                                    </p>
                                  )}
                                </div>
                              )
                            : (
                              <div className='space-y-2'>
                                <form
                                  className='flex gap-2'
                                  onSubmit={(event) => {
                                    event.preventDefault()
                                    if (
                                      !dispatching && !idLooking
                                    ) void lookupRef()
                                  }}
                                >
                                  <Input
                                    value={idInput}
                                    disabled={dispatching}
                                    aria-label='对方版本 ID'
                                    aria-invalid={!!idError}
                                    inputMode='numeric'
                                    onChange={(event) => {
                                      const value = event.target.value
                                      idInputRef.current = value
                                      idLookupRequestRef.current += 1
                                      setIdInput(value)
                                      setIdRef(null)
                                      setIdError(null)
                                      setIdLooking(false)
                                    }}
                                    placeholder='输入对方版本 ID'
                                    {...tm('OS.byid-input')}
                                  />
                                  <Button
                                    type='submit'
                                    size='sm'
                                    variant='secondary'
                                    className='h-10 shrink-0'
                                    disabled={dispatching || idLooking ||
                                      idInput.trim() === ''}
                                    {...tm('OS.byid-lookup-button')}
                                  >
                                    {idLooking ? '查询中…' : '查询'}
                                  </Button>
                                </form>
                                {idError && (
                                  <p
                                    role='alert'
                                    className='text-xs text-(--warning)'
                                    {...tm('OS.byid-error')}
                                  >
                                    {idError}
                                  </p>
                                )}
                                {idRef && (
                                  <div {...tm('OS.byid-ref-card')}>
                                    <BattleOpponentRow
                                      label={idRef.ownerDisplayName}
                                      detail={`${
                                        roleIdentity({
                                          scenarioID,
                                          side: oppositeSide,
                                          role: idRef.role,
                                          fallback: sideNameOf(oppositeSide),
                                        }).name
                                      } · ${
                                        modelLabel(idRef.modelID)
                                      } · #${idRef.versionID}`}
                                      disabled={rowDisabled}
                                      pending={pendingOpponent ===
                                        `version:${idRef.versionID}`}
                                      onClick={() =>
                                        void submitChallenge({
                                          pinnedVersionID: idRef.versionID,
                                        })}
                                      data-spec='U19-C07 U19-C19 U19-C20'
                                      {...tm('OS.challenge-button')}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                        </>
                      )
                    : gateProgress
                    ? (
                      <div
                        className='flex flex-col items-center gap-3 rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'
                        {...tm('OS.gate-locked')}
                      >
                        <Lock
                          aria-hidden='true'
                          className='h-5 w-5 text-(--foreground-muted)'
                        />
                        <p
                          className='text-sm font-medium text-(--foreground-subtle)'
                          {...tm('OS.gate-rule-text')}
                        >
                          每侧各赢 ≥{gateProgress.a.needed}{' '}
                          场 NPC 练习解锁玩家约战
                        </p>
                        <div className='flex flex-wrap justify-center gap-2'>
                          {(['a', 'b'] as const).map((which) => (
                            <Badge
                              key={which}
                              tone={sideMet(gateProgress[which])
                                ? 'success'
                                : 'info'}
                              {...tm('OS.gate-side-badge')}
                            >
                              {sideNameOf(which)}{' '}
                              {sideProgressText(gateProgress[which])}
                              {sideMet(gateProgress[which]) ? ' ✓' : ''}
                            </Badge>
                          ))}
                        </div>
                        <div className='flex flex-wrap justify-center gap-2'>
                          {!sideMet(gateProgress[side]) && (
                            <Button
                              size='sm'
                              variant='secondary'
                              onClick={() => setTab('pve')}
                              {...tm('OS.gate-practice-this-side')}
                            >
                              去练习该侧（{sideNameOf(side)}）
                            </Button>
                          )}
                          {!sideMet(gateProgress[oppositeSide]) &&
                            (opponents === null || opponentError ||
                                selfOpponents.length > 0
                              ? (
                                <ButtonLink
                                  size='sm'
                                  variant='secondary'
                                  to='/my-agents'
                                  {...tm('OS.gate-practice-opposite')}
                                >
                                  去练习对侧（{sideNameOf(oppositeSide)}）
                                </ButtonLink>
                              )
                              : (
                                <ButtonLink
                                  size='sm'
                                  variant='secondary'
                                  to={agentEntryUrl(scenarioID, oppositeSide)}
                                  {...tm('OS.gate-create-opposite')}
                                >
                                  去创建对侧（{sideNameOf(oppositeSide)}）
                                </ButtonLink>
                              ))}
                        </div>
                      </div>
                    )
                    : (
                      <div
                        className='flex flex-col items-center gap-2 rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'
                        {...tm('OS.gate-locked-legacy')}
                      >
                        <Lock
                          aria-hidden='true'
                          className='h-5 w-5 text-(--foreground-muted)'
                        />
                        <p className='text-sm text-(--foreground-subtle)'>
                          双侧各自赢下 PVE 练习后解锁玩家约战
                        </p>
                      </div>
                    )}
                </TabsContent>
              </Tabs>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
