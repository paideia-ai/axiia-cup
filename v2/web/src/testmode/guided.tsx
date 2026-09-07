/* 导测：按历史两轮手册或 B3/A5 固定版本交接旅程一步步走。每一步说网址、做什么、该看到什么、截图与规格；有落点就带路、有标记就聚光；
   确认（看到了 / 不是这样 / 跳过）才写看板——一条条款一条 set_pick，备注落在主条款的评论里，另记一条步骤级进度。 */
import {
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import {
  B3_A5_MANUAL_URL,
  DASHBOARD,
  type Journey,
  type JourneyRound,
  JOURNEYS,
  journeyUrl,
  manualUrl,
  markersOfStep,
  pageNameOfRoute,
  ROUND_LABEL,
  routeHasParams,
  routeMatches,
  type Step,
} from './data'
import {
  type MarkerRect,
  scrollToMarker,
  useNarrow,
  useReducedMotion,
} from './dom'
import {
  fillFixtureText,
  fixtureLabel,
  type FixtureValues,
  fixtureVariables,
  matchIdFromUrl,
  readFixtureValues,
  resolveFixtureUrl,
  writeFixtureValues,
} from './fixtures'
import { TM } from './registry/index'
import {
  type Choice,
  describeError,
  type Identity,
  type JourneyProgress,
  readProgress,
  recordStep,
  writeProgress,
} from './supabase'
import type { StepHints } from './types'
import { ClauseChips, type ToastMessage } from './ui'

export interface GuidedTarget {
  journeyId: string
  stepId?: string
}
export interface GuidedHandle {
  /** Esc：先收聚光；有聚光可收返回 true，否则 false（让上层继续关面板） */
  dismissSpotlight(): boolean
}

const CHOICE_LABEL: Record<Choice, string> = {
  pass: '看到了',
  fail: '不是这样',
  skip: '跳过',
}

const PROFILE_READINESS = {
  ready: 'ID 已预填',
  'refresh-required': '开测前刷新状态',
  'known-gap': '已知实现缺口',
} as const

function tally(j: Journey, p: JourneyProgress) {
  let pass = 0, fail = 0, skip = 0
  for (const s of j.steps) {
    const c = p[s.id]?.choice
    if (c === 'pass') pass++
    else if (c === 'fail') fail++
    else if (c === 'skip') skip++
  }
  return { pass, fail, skip, done: pass + fail + skip }
}

function localTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** 窄屏上折叠、桌面上平铺的小节 */
function Fold(
  { narrow, summary, children }: {
    narrow: boolean
    summary: string
    children: ReactNode
  },
) {
  if (!narrow) return <>{children}</>
  return (
    <details className='tm-details tm-details--fold'>
      <summary>
        <span className='tm-eyebrow'>{summary}</span>
      </summary>
      {children}
    </details>
  )
}

function FixtureUrlBlock(
  {
    journey,
    step,
    pathname,
    values,
    onChange,
  }: {
    journey: Journey
    step: Step
    pathname: string
    values: FixtureValues
    onChange: (name: string, value: string) => void
  },
) {
  if (!step.testUrl && !step.links?.length && !step.captures?.length) {
    return null
  }
  const links = [
    ...(step.testUrl
      ? [{ label: '本步起始页', url: step.testUrl, primary: true }]
      : []),
    ...(step.links ?? []).map((link) => ({ ...link, primary: false })),
  ]
  const variables = fixtureVariables(
    ...links.map((link) => link.url),
    step.action,
    step.expected,
  ).filter((name) => name !== 'appBaseUrl')
  const captureNames = new Set(
    (step.captures ?? []).map((capture) => capture.variable),
  )
  const usedNames = new Set([
    ...variables,
    ...(step.captures ?? []).map((capture) => capture.variable),
  ])
  const profiles = (step.fixtureRefs ?? []).map((id) =>
    journey.fixtureProfiles?.find((profile) => profile.id === id)
  ).filter((profile) => profile !== undefined)
  const fields = (journey.fixtureProfiles ?? []).flatMap((profile) =>
    profile.fields
  )
  const labelOf = (name: string) =>
    fields.find((field) => field.name === name)?.label ?? fixtureLabel(name)
  const currentMatchId = matchIdFromUrl(pathname)

  return (
    <div className='tm-block tm-fixture-card'>
      <div className='tm-block-t'>本步登录角色与网址</div>
      {profiles.length > 0
        ? (
          <div className='tm-fixture-profiles'>
            {profiles.map((profile) => {
              const fields = profile.fields.filter((field) =>
                usedNames.has(field.name) && !captureNames.has(field.name)
              )
              return (
                <section key={profile.id} className='tm-fixture-profile'>
                  <div className='tm-fixture-profile-title'>
                    <span>{profile.label}</span>
                    <span className='tm-profile-badges'>
                      {profile.readiness
                        ? (
                          <span
                            className={`tm-profile-state tm-profile-state--${profile.readiness}`}
                          >
                            {PROFILE_READINESS[profile.readiness]}
                          </span>
                        )
                        : null}
                      <span
                        className='tm-profile-id tm-mono'
                        title={`fixture profile: ${profile.id}`}
                      >
                        {profile.accountAlias ?? profile.id}
                      </span>
                    </span>
                  </div>
                  <p>{profile.description}</p>
                  {fields.length > 0
                    ? (
                      <div className='tm-fixture-fields'>
                        {fields.map((field) => {
                          const inputId =
                            `tm-fixture-${step.id}-${profile.id}-${field.name}`
                          return (
                            <label
                              key={field.name}
                              className='tm-fixture-field'
                              htmlFor={inputId}
                            >
                              <span>
                                {field.label}
                                {field.kind === 'runtime'
                                  ? (
                                    <span className='tm-runtime-badge'>
                                      本轮产生
                                    </span>
                                  )
                                  : null}
                                <span className='tm-mono'>{field.name}</span>
                              </span>
                              <input
                                id={inputId}
                                className='tm-input tm-mono'
                                value={values[field.name] ?? ''}
                                placeholder={`粘贴${field.label}`}
                                autoComplete='off'
                                spellCheck={false}
                                onChange={(event) => {
                                  const entered = event.target.value
                                  onChange(
                                    field.name,
                                    field.extract === 'matchId'
                                      ? matchIdFromUrl(entered) ?? entered
                                      : entered,
                                  )
                                }}
                              />
                              <small>{field.help}</small>
                            </label>
                          )
                        })}
                      </div>
                    )
                    : null}
                </section>
              )
            })}
          </div>
        )
        : null}
      {links.length > 0
        ? (
          <div className='tm-fixture-links'>
            {links.map((link) => {
              const resolution = resolveFixtureUrl(link.url, values)
              const missing = resolution.missing.map(labelOf).join('、')
              return (
                <div
                  key={`${link.label}:${link.url}`}
                  className='tm-fixture-link'
                >
                  <div>
                    <strong>{link.label}</strong>
                    <div className='tm-fixture-url tm-mono'>
                      {resolution.preview}
                    </div>
                  </div>
                  {resolution.href
                    ? (
                      <a
                        className={`tm-btn tm-ext${
                          link.primary ? ' tm-btn--primary' : ''
                        }`}
                        href={resolution.href}
                        target='_blank'
                        rel='noreferrer'
                        aria-label={`打开网页：${link.label}`}
                      >
                        打开网页
                      </a>
                    )
                    : (
                      <button
                        type='button'
                        className={`tm-btn${
                          link.primary ? ' tm-btn--primary' : ''
                        }`}
                        disabled
                        title={`请先填写${missing}`}
                      >
                        先填写：{missing}
                      </button>
                    )}
                </div>
              )
            })}
          </div>
        )
        : null}
      {step.captures?.map((capture) => {
        const inputId = `tm-capture-${step.id}-${capture.variable}`
        return (
          <section key={capture.variable} className='tm-runtime-capture'>
            <div className='tm-fixture-profile-title'>
              <span>{capture.label}</span>
              <span className='tm-runtime-badge'>运行时产生</span>
            </div>
            <div className='tm-capture-row'>
              <input
                id={inputId}
                className='tm-input tm-mono'
                value={values[capture.variable] ?? ''}
                placeholder={capture.placeholder}
                aria-label={capture.label}
                autoComplete='off'
                spellCheck={false}
                onChange={(event) => {
                  const entered = event.target.value
                  onChange(
                    capture.variable,
                    matchIdFromUrl(entered) ?? entered,
                  )
                }}
              />
              <button
                type='button'
                className='tm-btn'
                disabled={!currentMatchId}
                title={currentMatchId
                  ? `捕获 ${currentMatchId}`
                  : '请先打开本轮 /matches/:id 对局页'}
                onClick={() => {
                  if (currentMatchId) onChange(capture.variable, currentMatchId)
                }}
              >
                从当前对局网址捕获
              </button>
            </div>
            <small>{capture.hint}</small>
          </section>
        )
      })}
      <div className='tm-actions'>
        <a
          className='tm-btn tm-ext'
          href={manualUrl(step)}
          target='_blank'
          rel='noreferrer'
        >
          详细手册与 fixture 说明
        </a>
      </div>
      <div className='tm-fixture-help'>
        站点根地址自动使用当前环境；各旅程的值互相隔离。这里只填项目同学给的公开
        ID，账号密码不要填入 Test Mode。
      </div>
    </div>
  )
}

export function Guided(
  {
    ref,
    pathname,
    rects,
    target,
    hints,
    identity,
    identityOpen,
    panelOpen,
    onRequestIdentity,
    onSpotlight,
    onToast,
    onClose,
  }: {
    ref?: Ref<GuidedHandle>
    pathname: string
    rects: MarkerRect[]
    target: GuidedTarget | null
    hints: StepHints
    identity: Identity | null
    /** 身份对话框是否开着：关掉而没填身份 = 取消，那一下确认作废 */
    identityOpen: boolean
    /** 清单抽屉开着（桌面占右侧）：卡片就别挪去右下角 */
    panelOpen: boolean
    onRequestIdentity: (pendingLabel: string) => void
    /** 聚光正照着哪个标记（徽标层为它让路） */
    onSpotlight: (key: string | null) => void
    onToast: (t: ToastMessage) => void
    onClose: () => void
  },
) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const narrow = useNarrow()
  const [journeyId, setJourneyId] = useState<string | null>(
    target?.journeyId ?? null,
  )
  const [stepIdx, setStepIdx] = useState(0)
  const [progress, setProgress] = useState<JourneyProgress>({})
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<
    { choice: Choice; stepId: string } | null
  >(null)
  const [spotOff, setSpotOff] = useState(false)
  const [altMarker, setAltMarker] = useState<string | null>(null)
  const [dockRight, setDockRight] = useState(false)
  const [fixtureValuesByJourney, setFixtureValuesByJourney] = useState<
    Record<string, FixtureValues>
  >(() => {
    const initialId = target?.journeyId
    const initialJourney = JOURNEYS.find((item) => item.id === initialId)
    return initialId
      ? {
        [initialId]: readFixtureValues(
          initialId,
          initialJourney?.fixtureDefaults,
        ),
      }
      : {}
  })
  // 部件被卡片挡住又推不上去时（页面已到底），把正文收起只留头尾（确认按钮挪到页脚）；也可手动收起
  const [collapsed, setCollapsed] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const dockRef = useRef<HTMLElement>(null)
  // 读者手动点了「展开」之后，这一步内不再自动收起（否则页面推不动时会立刻又收回去）
  const manualExpand = useRef(false)

  const journey = useMemo(
    () => JOURNEYS.find((j) => j.id === journeyId) ?? null,
    [journeyId],
  )
  const fixtureValues = useMemo(
    () =>
      journeyId
        ? fixtureValuesByJourney[journeyId] ??
          readFixtureValues(journeyId, journey?.fixtureDefaults)
        : readFixtureValues(null),
    [fixtureValuesByJourney, journey, journeyId],
  )
  const step: Step | null = journey?.steps[stepIdx] ?? null
  const finished = journey !== null && stepIdx >= journey.steps.length

  // 外部指定落点（弹层 / 清单里的「在导测里打开」）
  useEffect(() => {
    if (!target) return
    const j = JOURNEYS.find((x) => x.id === target.journeyId)
    if (!j) return
    setJourneyId(j.id)
    const idx = target.stepId
      ? j.steps.findIndex((s) => s.id === target.stepId)
      : -1
    setStepIdx(idx >= 0 ? idx : 0)
  }, [target])

  useEffect(() => {
    if (journeyId) setProgress(readProgress(journeyId))
  }, [journeyId])

  useEffect(() => {
    if (!journeyId || fixtureValuesByJourney[journeyId] !== fixtureValues) {
      return
    }
    writeFixtureValues(journeyId, fixtureValues)
  }, [fixtureValues, fixtureValuesByJourney, journeyId])

  const setFixtureValue = useCallback((name: string, value: string) => {
    if (!journeyId) return
    setFixtureValuesByJourney((current) => ({
      ...current,
      [journeyId]: {
        ...(current[journeyId] ??
          readFixtureValues(journeyId, journey?.fixtureDefaults)),
        [name]: value,
      },
    }))
  }, [journey, journeyId])

  // 换步：清备注 / 错误 / 聚光的关闭状态 / 待补的确认
  useEffect(() => {
    setNote('')
    setErr(null)
    setSpotOff(false)
    setAltMarker(null)
    setPending(null)
    setCollapsed(false)
    manualExpand.current = false
  }, [journeyId, stepIdx])

  const hint = step ? hints[step.id] : undefined
  const route = hint?.route ?? step?.route ?? null
  const hintMarker = hint?.marker ?? step?.marker ?? null
  const marker = altMarker ?? hintMarker
  const onRoute = route ? routeMatches(route, pathname) : true
  const markerRect = useMemo(
    () =>
      marker
        ? rects.find((r) => r.id === marker && r.inView) ?? rects.find((r) =>
          r.id === marker
        ) ?? null
        : null,
    [rects, marker],
  )
  const spotlight = markerRect && markerRect.inView && !spotOff
    ? markerRect
    : null
  useEffect(() => {
    onSpotlight(spotlight?.key ?? null)
  }, [spotlight?.key, onSpotlight])
  useEffect(() => () => onSpotlight(null), [onSpotlight])

  // 到了这一步、标记在页上：滚过去一次
  useEffect(() => {
    if (!marker || !step) return
    const t = setTimeout(() => scrollToMarker(marker, !reduced), 60)
    return () => clearTimeout(t)
  }, [marker, step?.id, pathname, reduced])

  // 卡片别压住自己要聚光的部件：桌面上左下角挡住就挪到右下角（清单开着时右边是抽屉，不挪）
  useEffect(() => {
    if (narrow || panelOpen || !step || finished) {
      setDockRight(false)
      return
    }
    const dock = dockRef.current
    if (!spotlight || !dock) return
    const w = dock.offsetWidth
    const h = dock.offsetHeight
    const vw = globalThis.innerWidth
    const vh = globalThis.innerHeight
    const s = {
      l: spotlight.left - 6,
      r: spotlight.left + spotlight.width + 6,
      t: spotlight.top - 6,
      b: spotlight.top + spotlight.height + 6,
    }
    const hit = (l: number, r: number, t: number, b: number) =>
      s.l < r && s.r > l && s.t < b && s.b > t
    const leftHit = hit(12, 12 + w, vh - 12 - h, vh - 12)
    const rightHit = hit(vw - 12 - w, vw - 12, vh - 56 - h, vh - 56)
    if (!leftHit) setDockRight(false)
    else if (!rightHit && !panelOpen) setDockRight(true)
  }, [spotlight, narrow, step?.id, marker, panelOpen, finished])

  // 挪不开（窄屏的底部弹层 / 很宽的部件 / 清单占着右边）就把页面往上推一点，让部件露在卡片上方。
  // 等换步后的居中滚动（60ms 起步的 smooth）落定再量，一步只推一次。
  useEffect(() => {
    if (!marker || !step) return
    const t = setTimeout(() => {
      const dock = dockRef.current
      const el = document.querySelector<HTMLElement>(
        `[data-tm="${CSS.escape(marker)}"]:not([data-tm-root] *)`,
      )
      if (!dock || !el) return
      const d = dock.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const overlapsDock = r.left < d.right && r.right > d.left &&
        r.top < d.bottom && r.bottom > d.top
      if (!overlapsDock) return
      const delta = r.bottom + 16 - d.top
      if (delta <= 0 || r.top - delta < 8) return
      const room = document.documentElement.scrollHeight -
        globalThis.innerHeight - globalThis.scrollY
      if (room < delta) {
        // 页面已经到底，推不动：把卡片正文收起，只留头尾（读者手动展开过就尊重读者）
        if (!manualExpand.current) setCollapsed(true)
        return
      }
      globalThis.scrollBy({ top: delta, behavior: reduced ? 'auto' : 'smooth' })
    }, reduced ? 120 : 520)
    return () => clearTimeout(t)
  }, [marker, step?.id, pathname, reduced, narrow, dockRight, collapsed])

  // 卡片高度写进 --tm-dock，提示条就能贴在卡片正上方
  useEffect(() => {
    const dock = dockRef.current
    const host = dock?.closest<HTMLElement>('[data-tm-root]')
    if (!dock || !host) return
    // 卡片挪到右下角时左下角是空的，提示条就贴底
    const apply = () =>
      host.style.setProperty(
        '--tm-dock',
        dockRight ? '0px' : `${dock.offsetHeight}px`,
      )
    const ro = new ResizeObserver(apply)
    ro.observe(dock)
    apply()
    return () => {
      ro.disconnect()
      host.style.setProperty('--tm-dock', '0px')
    }
  }, [journeyId, finished, dockRight])

  useImperativeHandle(ref, () => ({
    dismissSpotlight() {
      if (spotlight) {
        setSpotOff(true)
        return true
      }
      return false
    },
  }), [spotlight])

  const submit = useCallback(async (choice: Choice, id: Identity) => {
    if (!journey || !step) return
    setBusy(true)
    setErr(null)
    try {
      const res = await recordStep({
        stepId: step.id,
        clauseIds: step.clauseIds,
        primary: step.primary,
        versionPins: step.versionPins,
        choice,
        note,
        identity: id,
      })
      const next = {
        ...progress,
        [step.id]: { choice, at: new Date().toISOString() },
      }
      setProgress(next)
      writeProgress(journey.id, next)
      const primary = step.primary[0] ?? step.clauseIds[0]
      onToast({
        kind: 'ok',
        body: (
          <div>
            <div>
              {step.id} {CHOICE_LABEL[choice]} · 已记录 {res.picks.length}{' '}
              条到看板：<span className='tm-mono'>{res.picks.join(' / ')}</span>
              {res.commentedOn ? `，备注留在 ${res.commentedOn} 下` : ''}
            </div>
            <a
              className='tm-ext'
              href={primary
                ? `${DASHBOARD}/spec-v4#${primary}`
                : `${DASHBOARD}/spec-v4`}
              target='_blank'
              rel='noreferrer'
            >
              去看板
            </a>
          </div>
        ),
      })
      setStepIdx((i) => i + 1)
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }, [journey, step, note, progress, onToast])

  const confirm = useCallback((choice: Choice) => {
    if (!step) return
    if (choice !== 'pass' && !note.trim()) {
      setErr(
        choice === 'fail'
          ? '「不是这样」要写一句你看到了什么，看板那边才知道差在哪。'
          : '「跳过」要写一句为什么跳过。',
      )
      noteRef.current?.focus()
      return
    }
    if (!identity) {
      setPending({ choice, stepId: step.id })
      onRequestIdentity(CHOICE_LABEL[choice])
      return
    }
    void submit(choice, identity)
  }, [note, identity, onRequestIdentity, submit, step])

  // 身份填好了就把刚才那一下补上——只补当时那一步；对话框被取消（关了还没身份）就作废
  useEffect(() => {
    if (pending && identity && pending.stepId === step?.id) {
      setPending(null)
      void submit(pending.choice, identity)
    }
  }, [pending, identity, submit, step?.id])
  useEffect(() => {
    if (!identityOpen && !identity) setPending(null)
  }, [identityOpen, identity])

  const goRoute = () => {
    if (route) navigate(route)
  }

  /* ── 旅程列表 ── */
  if (!journey) {
    const groups: [JourneyRound, Journey[]][] = [
      ['handoff', JOURNEYS.filter((j) => j.round === 'handoff')],
      ['r1', JOURNEYS.filter((j) => j.round === 'r1')],
      ['r2', JOURNEYS.filter((j) => j.round === 'r2')],
    ].filter(([, list]) => list.length > 0) as [JourneyRound, Journey[]][]
    return (
      <section
        ref={dockRef}
        className='tm-surface tm-dock'
        role='dialog'
        aria-label='导测'
      >
        <div className='tm-h'>
          <div className='tm-h-title'>
            <div>导测 · 选一条旅程</div>
            <div className='tm-eyebrow'>
              {JOURNEYS.length} 条旅程 · 当前 B3/A5 可交接 + 历史两轮
            </div>
          </div>
          <button
            type='button'
            className='tm-x'
            aria-label='关闭导测'
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className='tm-body'>
          {groups.map(([round, list]) => (
            <div key={round}>
              <div className='tm-sec'>
                <span className='tm-eyebrow'>{ROUND_LABEL[round]}</span>
                <span className='tm-sec-n'>{list.length}</span>
                {round === 'handoff'
                  ? (
                    <a
                      className='tm-ext'
                      href={B3_A5_MANUAL_URL}
                      target='_blank'
                      rel='noreferrer'
                    >
                      详细手册 · 截图提交
                    </a>
                  )
                  : null}
              </div>
              <div className='tm-jlist'>
                {list.map((j) => {
                  const t = tally(j, readProgress(j.id))
                  return (
                    <button
                      key={j.id}
                      type='button'
                      className='tm-jrow'
                      onClick={() => {
                        setJourneyId(j.id)
                        const first = j.steps.findIndex((s) =>
                          !readProgress(j.id)[s.id]
                        )
                        setStepIdx(first >= 0 ? first : 0)
                      }}
                      aria-label={`旅程 ${j.n}：${j.title}，已确认 ${t.done} / ${j.steps.length} 步`}
                    >
                      <span className='tm-jrow-n'>{j.n}</span>
                      <span className='tm-jrow-t' title={j.title}>
                        {j.title}
                      </span>
                      <span
                        className={`tm-jrow-p${
                          t.done === j.steps.length ? ' tm-done' : ''
                        }`}
                      >
                        {t.done}/{j.steps.length}
                      </span>
                      <span className='tm-bar' aria-hidden='true'>
                        <i
                          style={{
                            width: `${(t.done / j.steps.length) * 100}%`,
                          }}
                        />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <p className='tm-dimt' style={{ margin: '12px 0 0', fontSize: 11.5 }}>
            进度存在这台机器上；每一步的确认才会写进看板。
          </p>
        </div>
      </section>
    )
  }

  /* ── 旅程结束 ── */
  if (finished) {
    const t = tally(journey, progress)
    const total = journey.steps.length
    const firstOpen = journey.steps.findIndex((s) => !progress[s.id])
    return (
      <section
        ref={dockRef}
        className='tm-surface tm-dock'
        role='dialog'
        aria-label='导测'
      >
        <div className='tm-h'>
          <div className='tm-h-title'>
            <div>
              {t.done === total
                ? `旅程 ${journey.n} 走完了`
                : `旅程 ${journey.n} · 已确认 ${t.done} / ${total}`}
            </div>
            <div className='tm-eyebrow'>{journey.title}</div>
          </div>
          <button
            type='button'
            className='tm-x'
            aria-label='关闭导测'
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className='tm-body'>
          <div className='tm-summary'>
            <span style={{ color: 'var(--tm-pass)' }}>看到了 {t.pass}</span>
            <span style={{ color: 'var(--tm-fail)' }}>不是这样 {t.fail}</span>
            <span style={{ color: 'var(--tm-skip)' }}>跳过 {t.skip}</span>
            <span className='tm-dimt'>共 {total} 步</span>
          </div>
          {t.done < total
            ? (
              <div className='tm-hint'>
                <span>还有 {total - t.done} 步没确认。</span>
                <button
                  type='button'
                  className='tm-btn tm-btn--sm'
                  onClick={() => setStepIdx(Math.max(0, firstOpen))}
                >
                  回到第一个未确认的步
                </button>
              </div>
            )
            : null}
          {journey.completion || journey.evidenceRequirements?.length
            ? (
              <section className='tm-delivery' aria-label='交接完成标准'>
                <div className='tm-delivery-title'>交接完成标准</div>
                {journey.completion
                  ? (
                    <p className='tm-delivery-completion'>
                      {journey.completion}
                    </p>
                  )
                  : null}
                {journey.evidenceRequirements?.length
                  ? (
                    <details className='tm-details tm-delivery-evidence' open>
                      <summary>
                        <span>必须提交的证据</span>
                        <span className='tm-sec-n'>
                          {journey.evidenceRequirements.length} 项
                        </span>
                      </summary>
                      <ul>
                        {journey.evidenceRequirements.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  )
                  : null}
              </section>
            )
            : null}
          <div className='tm-actions'>
            {journey.round === 'handoff'
              ? (
                <a
                  className='tm-btn tm-btn--primary tm-ext'
                  href={journeyUrl(journey)}
                  target='_blank'
                  rel='noreferrer'
                >
                  详细手册 · 提交证据
                </a>
              )
              : null}
            <a
              className={`tm-btn tm-ext${
                journey.round === 'handoff' ? '' : ' tm-btn--primary'
              }`}
              href={`${DASHBOARD}/spec-v4#verification`}
              target='_blank'
              rel='noreferrer'
            >
              去看板核对
            </a>
            <button
              type='button'
              className='tm-btn'
              onClick={() => setStepIdx(0)}
            >
              再看一遍各步
            </button>
            <button
              type='button'
              className='tm-btn tm-btn--ghost'
              onClick={() => setJourneyId(null)}
            >
              换一条旅程
            </button>
          </div>
        </div>
      </section>
    )
  }

  /* ── 步骤卡 ── */
  const s = step as Step
  const total = journey.steps.length
  const done = progress[s.id]
  const related = markersOfStep(s.id).filter((id) => id !== hintMarker)
  // 紧凑形态：窄屏一律、桌面收起时——确认按钮在页脚，上一步/下一步缩成小字
  const compact = narrow || collapsed
  const onPage = new Set(rects.map((r) => r.id))

  const confirmActions = (
    <div className='tm-actions' role='group' aria-label='确认这一步'>
      <button
        type='button'
        className='tm-btn tm-btn--pass'
        disabled={busy}
        onClick={() =>
          confirm('pass')}
      >
        看到了 ✓
      </button>
      <button
        type='button'
        className='tm-btn tm-btn--fail'
        disabled={busy}
        onClick={() =>
          confirm('fail')}
      >
        不是这样 ✗
      </button>
      <button
        type='button'
        className='tm-btn tm-btn--skip'
        disabled={busy}
        onClick={() =>
          confirm('skip')}
      >
        跳过
      </button>
      {busy
        ? <span className='tm-muted' aria-live='polite'>正在写看板…</span>
        : null}
    </div>
  )
  const navButtons = (
    <>
      <button
        type='button'
        className={`tm-btn tm-btn--sm${compact ? ' tm-btn--ghost' : ''}`}
        disabled={stepIdx === 0}
        onClick={() => setStepIdx((i) => i - 1)}
      >
        ← 上一步
      </button>
      <button
        type='button'
        className={`tm-btn tm-btn--sm${compact ? ' tm-btn--ghost' : ''}`}
        onClick={() => setStepIdx((i) => i + 1)}
      >
        {stepIdx === total - 1 ? '看小结 →' : '下一步 →'}
      </button>
    </>
  )

  return (
    <>
      {spotlight
        ? (
          <div
            className='tm-spot'
            data-tm-spot={marker ?? ''}
            style={{
              top: spotlight.top - 6,
              left: spotlight.left - 6,
              width: spotlight.width + 12,
              height: spotlight.height + 12,
            }}
            aria-hidden='true'
          >
            <span className='tm-spot-tag'>{marker}</span>
          </div>
        )
        : null}
      <section
        ref={dockRef}
        className={`tm-surface tm-dock${dockRight ? ' tm-dock--right' : ''}`}
        role='dialog'
        aria-label='导测'
      >
        <div className='tm-h'>
          <div className='tm-h-title'>
            <div>
              旅程 {journey.n} · 第 {s.index} 步 / {total}
              <span className='tm-mono tm-dimt' style={{ marginLeft: 8 }}>
                {s.id}
              </span>
            </div>
            <div className='tm-eyebrow' title={journey.title}>
              {journey.title}
            </div>
          </div>
          <button
            type='button'
            className='tm-btn tm-btn--sm tm-btn--ghost'
            aria-expanded={!collapsed}
            title={collapsed ? '展开步骤卡' : '收起正文，只留确认按钮'}
            onClick={() => {
              manualExpand.current = collapsed
              setCollapsed((c) => !c)
            }}
          >
            {collapsed ? '展开' : '收起'}
          </button>
          <button
            type='button'
            className='tm-btn tm-btn--sm tm-btn--ghost'
            onClick={() => setJourneyId(null)}
            title='回到旅程列表'
          >
            旅程列表
          </button>
          <button
            type='button'
            className='tm-x'
            aria-label='关闭导测'
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className='tm-body' hidden={collapsed}>
          <div className='tm-steps-row'>
            <div className='tm-steps' role='group' aria-label='各步'>
              {journey.steps.map((st, i) => {
                const c = progress[st.id]?.choice
                return (
                  <button
                    key={st.id}
                    type='button'
                    className={`tm-step${c ? ` tm-step--${c}` : ''}`}
                    aria-current={i === stepIdx ? 'step' : undefined}
                    aria-label={`第 ${st.index} 步${
                      c ? `，${CHOICE_LABEL[c]}` : ''
                    }`}
                    title={st.action}
                    onClick={() => setStepIdx(i)}
                  >
                    {st.index}
                  </button>
                )
              })}
            </div>
            {compact ? <div className='tm-steps-nav'>{navButtons}</div> : null}
          </div>

          {stepIdx === 0 && journey.prerequisites?.length
            ? (
              <details className='tm-details'>
                <summary>
                  <span className='tm-eyebrow'>开测前准备</span>
                  <span className='tm-sec-n'>
                    {journey.prerequisites.length}
                  </span>
                </summary>
                <ul style={{ margin: '8px 0 2px', paddingLeft: 20 }}>
                  {journey.prerequisites.map((item) => (
                    <li key={item} style={{ marginBottom: 6 }}>{item}</li>
                  ))}
                </ul>
              </details>
            )
            : null}

          <FixtureUrlBlock
            journey={journey}
            step={s}
            pathname={pathname}
            values={fixtureValues}
            onChange={setFixtureValue}
          />
          {s.knownGap
            ? (
              <section className='tm-known-gap' role='status'>
                <div className='tm-known-gap-title'>{s.knownGap.title}</div>
                <p>{s.knownGap.detail}</p>
                <strong>{s.knownGap.instruction}</strong>
              </section>
            )
            : null}
          <div className='tm-block tm-block--action'>
            <div className='tm-block-t'>做什么</div>
            <div className='tm-block-b'>
              {fillFixtureText(s.action, fixtureValues).value}
            </div>
          </div>
          <div className='tm-block'>
            <div className='tm-block-t'>应该看到</div>
            <div className='tm-block-b'>
              {fillFixtureText(s.expected, fixtureValues).value.replace(
                /^应该看到：/,
                '',
              )}
            </div>
          </div>

          {s.screenshotEvidence?.length
            ? (
              <div className='tm-block tm-block--aside tm-block--human'>
                <div className='tm-block-t'>必须截图 / 提交</div>
                <div className='tm-block-b'>
                  <div className='tm-evidence-instruction'>
                    以下就是必须使用的准确文件名（包含 .png，请勿改名）：
                  </div>
                  <ul className='tm-file-list'>
                    {s.screenshotEvidence.map((name) => (
                      <li key={name} className='tm-file-name tm-mono'>
                        {name}
                      </li>
                    ))}
                  </ul>
                  <a
                    className='tm-btn tm-btn--sm tm-ext'
                    style={{ marginTop: 8 }}
                    href={manualUrl(s)}
                    target='_blank'
                    rel='noreferrer'
                  >
                    在详细手册提交这些文件
                  </a>
                </div>
              </div>
            )
            : null}

          {route && !onRoute && !s.testUrl
            ? (
              <div className='tm-hint'>
                {routeHasParams(route)
                  ? (
                    <span>
                      这一步发生在「{pageNameOfRoute(
                        route,
                      )}」页——先打开任一{pageNameOfRoute(route)}，再回来。
                    </span>
                  )
                  : (
                    <>
                      <span>这一步发生在「{pageNameOfRoute(route)}」页。</span>
                      <button
                        type='button'
                        className='tm-btn tm-btn--sm'
                        onClick={goRoute}
                      >
                        去这一页 →
                      </button>
                    </>
                  )}
              </div>
            )
            : null}
          {marker && onRoute
            ? (
              <div className='tm-hint'>
                {markerRect
                  ? (
                    <>
                      <span>
                        看这个部件：<span
                          className='tm-mono'
                          style={{ color: 'var(--tm)' }}
                        >
                          {marker}
                        </span>
                      </span>
                      <button
                        type='button'
                        className='tm-btn tm-btn--sm'
                        onClick={() => {
                          setSpotOff(false)
                          scrollToMarker(marker, !reduced)
                        }}
                      >
                        聚光
                      </button>
                      {spotlight
                        ? (
                          <button
                            type='button'
                            className='tm-btn tm-btn--sm tm-btn--ghost'
                            onClick={() => setSpotOff(true)}
                          >
                            收起聚光（Esc）
                          </button>
                        )
                        : null}
                    </>
                  )
                  : (
                    <span>
                      要看的部件 <span className='tm-mono'>{marker}</span>{' '}
                      现在不在页上——可能要先做前一步的操作让它出现。
                    </span>
                  )}
              </div>
            )
            : null}

          <Fold narrow={narrow} summary='对应规格 · 相关部件 · 已知问题'>
            <div className='tm-block'>
              <div className='tm-block-t'>
                对应规格 · {s.specLine.replace(/^规格\s*[·:：]?\s*/, '')}
                <a
                  className='tm-ext'
                  style={{ marginLeft: 8 }}
                  href={manualUrl(s)}
                  target='_blank'
                  rel='noreferrer'
                >
                  手册
                </a>
              </div>
              {s.clauseIds.length
                ? <ClauseChips ids={s.clauseIds} />
                : <span className='tm-dimt'>这一步没有归到具体条款</span>}
              {s.versionPins
                ? (
                  <div className='tm-chips' style={{ marginTop: 6 }}>
                    {Object.entries(s.versionPins).map(([id, version]) => (
                      <span key={id} className='tm-chip tm-mono'>
                        {id} · {version}
                      </span>
                    ))}
                  </div>
                )
                : null}
            </div>
            {related.length
              ? (
                <div className='tm-block'>
                  <div className='tm-block-t'>相关部件</div>
                  <div className='tm-chips'>
                    {related.map((id) => {
                      const here = onPage.has(id)
                      return (
                        <button
                          key={id}
                          type='button'
                          className={`tm-chip${here ? '' : ' tm-chip--out'}`}
                          title={here
                            ? `${TM[id]?.label ?? id}：聚光到它`
                            : `${TM[id]?.label ?? id}：现在不在页上${
                              TM[id]?.when ? `（${TM[id].when}）` : ''
                            }`}
                          disabled={!here}
                          onClick={() => {
                            setAltMarker(id)
                            setSpotOff(false)
                            scrollToMarker(id, !reduced)
                          }}
                        >
                          {id}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
              : null}
            {s.known
              ? (
                <div className='tm-block tm-block--aside tm-block--known'>
                  {s.known}
                </div>
              )
              : null}
            {s.humanOnly
              ? (
                <div className='tm-block tm-block--aside tm-block--human'>
                  {s.humanOnly}
                </div>
              )
              : null}
          </Fold>

          <label className='tm-label' htmlFor='tm-guided-note'>
            备注（看到了可不填；不是这样 / 跳过必填）
          </label>
          <textarea
            id='tm-guided-note'
            ref={noteRef}
            className='tm-textarea'
            value={note}
            placeholder='你看到了什么？和「应该看到」差在哪？'
            onChange={(e) => setNote(e.target.value)}
          />
          {err ? <div className='tm-err' role='alert'>{err}</div> : null}
          {done
            ? (
              <div className='tm-ok'>
                这一步已记过：{CHOICE_LABEL[done.choice]} · {localTime(done.at)}
                。再点会覆盖看板上的记录。
              </div>
            )
            : null}
          {compact ? null : confirmActions}
          <p className='tm-dimt' style={{ margin: '8px 0 0', fontSize: 11.5 }}>
            点确认才写看板：{s.clauseIds.length} 条条款各记一笔{identity
              ? `，署名 ${identity.name}`
              : '；第一次会先问你名字和口令'}。
          </p>
        </div>
        <div className='tm-foot'>
          {compact ? confirmActions : navButtons}
          <a
            className='tm-ext tm-dimt'
            style={{ marginLeft: 'auto', fontSize: 11.5 }}
            href={journeyUrl(journey)}
            target='_blank'
            rel='noreferrer'
          >
            这条旅程的手册
          </a>
        </div>
      </section>
    </>
  )
}
