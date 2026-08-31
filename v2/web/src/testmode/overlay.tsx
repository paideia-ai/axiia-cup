/* 测试模式的正文（按需分块）：徽标层 + 弹层，并把清单 / 导测 / 身份 / 提示装起来。
   徽标层是一整张 pointer-events:none 的透明片，只有徽标按钮本身可点，不挡产品。 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

import { DASHBOARD, journeyOf, ROUND_LABEL, STEPS } from './data'
import {
  scrollToMarker,
  useEscape,
  useMarkerRects,
  useNarrow,
  useReducedMotion,
} from './dom'
import { Guided, type GuidedHandle, type GuidedTarget } from './guided'
import type { SetUi, TmUi } from './index'
import {
  type BadgeSpec,
  badgeWidth,
  describeMarker,
  layoutBadges,
} from './markers'
import { Panel } from './panel'
import { STEP_HINTS, TM } from './registry/index'
import { TM_CSS } from './styles'
import { getIdentity, type Identity, setIdentity } from './supabase'
import {
  AnchorChips,
  type Box,
  ClauseRow,
  CopyButton,
  copyText,
  HighlightBox,
  IdentityDialog,
  Toast,
  type ToastMessage,
} from './ui'

/* ── 徽标 ──────────────────────────────────────────────────────────── */

function BadgesLayer(
  { specs, openKey, hoverKey, onHover, onOpen, flash }: {
    specs: BadgeSpec[]
    openKey: string | null
    hoverKey: string | null
    onHover: (key: string | null) => void
    onOpen: (spec: BadgeSpec, el: HTMLButtonElement) => void
    flash: { box: Box; n: number } | null
  },
) {
  const lit = specs.find((s) => s.key === hoverKey || s.key === openKey)
  return (
    <div className='tm-layer'>
      {lit ? <HighlightBox box={lit.box} /> : null}
      {flash ? <HighlightBox key={flash.n} box={flash.box} flash /> : null}
      {specs.map((s) => (
        <button
          key={s.key}
          type='button'
          className={`tm-badge${s.kind === 'gap' ? ' tm-badge--gap' : ''}${
            s.kind === 'unknown' ? ' tm-badge--unknown' : ''
          }`}
          style={{ transform: `translate(${s.x}px, ${s.y}px)` }}
          aria-label={s.aria}
          aria-expanded={s.key === openKey}
          title={s.aria}
          onMouseEnter={() => onHover(s.key)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(s.key)}
          onBlur={() => onHover(null)}
          onClick={(e) => onOpen(s, e.currentTarget)}
        >
          {s.id}
          <span className='tm-badge-n' aria-hidden='true'>{s.text}</span>
        </button>
      ))}
    </div>
  )
}

/* ── 弹层 ──────────────────────────────────────────────────────────── */

function CopyAndGoButton({ id }: { id: string }) {
  return (
    <button
      type='button'
      className='tm-btn tm-btn--sm tm-ext'
      title='复制这个 id，然后打开 spec 看板'
      onClick={() => {
        void copyText(id).then(() => {
          globalThis.open(`${DASHBOARD}/spec-v4`, '_blank', 'noopener')
        })
      }}
    >
      复制 id 并去看板
    </button>
  )
}

function Popover(
  { id, anchor, onClose, onOpenGuided }: {
    id: string
    /** 徽标此刻在视口里的位置（随滚动更新） */
    anchor: Box
    onClose: () => void
    onOpenGuided: (t: GuidedTarget) => void
  },
) {
  const narrow = useNarrow()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const entry = TM[id]
  const d = describeMarker(id)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || narrow) return
    const W = el.offsetWidth
    const H = el.offsetHeight
    const vw = globalThis.innerWidth
    const vh = globalThis.innerHeight
    const left = Math.max(8, Math.min(anchor.left, vw - W - 8))
    let top = anchor.top + anchor.height + 6
    if (top + H > vh - 8) {
      const above = anchor.top - 6 - H
      top = above >= 8 ? above : Math.max(8, vh - H - 8)
    }
    setPos({ top, left })
  }, [anchor, narrow, id])

  // 定好位（或是底部抽屉）再把焦点挪进来：visibility:hidden 的元素接不住焦点
  const focused = useRef<string | null>(null)
  useEffect(() => {
    if (!narrow && !pos) return
    if (focused.current === id) return
    focused.current = id
    ref.current?.querySelector<HTMLElement>('.tm-x')?.focus()
  }, [id, pos, narrow])

  useEffect(() => {
    const on = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current && !ref.current.contains(t)) {
        // 点在别的徽标上：由徽标自己切换弹层；点在其它地方：关掉
        if ((t as Element).closest?.('.tm-badge')) return
        onClose()
      }
    }
    document.addEventListener('mousedown', on)
    return () => document.removeEventListener('mousedown', on)
  }, [onClose])

  const steps = (entry?.journeys ?? []).map((sid) => STEPS[sid]).filter((s) =>
    s
  )
  return (
    <div
      ref={ref}
      className={`tm-surface tm-pop${narrow ? ' tm-pop--sheet' : ''}`}
      role='dialog'
      aria-label={`标记 ${id}`}
      style={narrow
        ? undefined
        : pos
        ? { top: pos.top, left: pos.left }
        : { top: 0, left: 0, visibility: 'hidden' }}
    >
      <div className='tm-h'>
        <div className='tm-h-title'>
          <div>{d.label}</div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              marginTop: 2,
            }}
          >
            <span className='tm-mono' style={{ color: 'var(--tm)' }}>{id}</span>
            <CopyButton text={id} />
          </div>
        </div>
        <button
          type='button'
          className='tm-x'
          aria-label='关闭弹层'
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className='tm-body'>
        {!entry
          ? (
            <div className='tm-gapnote'>
              <div>
                这个部件还没登记，规格里也就没有它的条款。要记一笔，复制 id
                去看板新建条款。
              </div>
              <div className='tm-dimt' style={{ marginTop: 4 }}>
                （开发看）在 src/testmode/registry/
                里加一条，写上人话名字和对应条款。
              </div>
              <div style={{ marginTop: 8 }}>
                <CopyAndGoButton id={id} />
              </div>
            </div>
          )
          : null}
        {entry && d.kind === 'gap'
          ? (
            <div className='tm-gapnote'>
              <div>
                规格里没有写到这个部件。要记一笔，复制 id 去看板新建条款。
              </div>
              <div style={{ marginTop: 8 }}>
                <CopyAndGoButton id={id} />
              </div>
            </div>
          )
          : null}
        {entry?.clauses?.length
          ? (
            <>
              <div className='tm-sec'>
                <span className='tm-eyebrow'>规格条款</span>
                <span className='tm-sec-n'>{entry.clauses.length}</span>
              </div>
              <div className='tm-rows'>
                {entry.clauses.map((c) => <ClauseRow key={c} id={c} />)}
              </div>
            </>
          )
          : null}
        {entry?.anchors?.length
          ? (
            <>
              <div className='tm-sec'>
                <span className='tm-eyebrow'>规格锚</span>
                <span className='tm-sec-n'>{entry.anchors.length}</span>
              </div>
              <AnchorChips anchors={entry.anchors} />
            </>
          )
          : null}
        {steps.length
          ? (
            <>
              <div className='tm-sec'>
                <span className='tm-eyebrow'>旅程步骤</span>
                <span className='tm-sec-n'>{steps.length}</span>
              </div>
              <div className='tm-rows'>
                {steps.map((s) => {
                  const j = journeyOf(s)
                  return (
                    <div
                      key={s.id}
                      className='tm-row'
                      style={{ flexDirection: 'column', gap: 4 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <span className='tm-row-id'>{s.id}</span>
                        <span
                          className='tm-muted'
                          style={{ fontSize: 11.5, minWidth: 0 }}
                        >
                          {ROUND_LABEL[s.round]} · 旅程{' '}
                          {s.journey}「{j.title}」· 第 {s.index} 步
                        </span>
                        <a
                          className='tm-ext'
                          style={{
                            marginLeft: 'auto',
                            fontSize: 11.5,
                            flex: 'none',
                          }}
                          href={`${DASHBOARD}${s.manualUrl}`}
                          target='_blank'
                          rel='noreferrer'
                        >
                          手册
                        </a>
                      </div>
                      <div className='tm-row-q' title={s.action}>
                        {s.action}
                      </div>
                      <button
                        type='button'
                        className='tm-btn tm-btn--sm'
                        onClick={() =>
                          onOpenGuided({ journeyId: j.id, stepId: s.id })}
                      >
                        在导测里打开
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )
          : null}
        {entry?.note || entry?.when
          ? (
            <dl className='tm-kv' style={{ marginTop: 12 }}>
              {entry.note
                ? (
                  <>
                    <dt>说明</dt>
                    <dd>{entry.note}</dd>
                  </>
                )
                : null}
              {entry.when
                ? (
                  <>
                    <dt>何时出现</dt>
                    <dd>{entry.when}</dd>
                  </>
                )
                : null}
            </dl>
          )
          : null}
      </div>
    </div>
  )
}

/* ── 总装 ──────────────────────────────────────────────────────────── */

export default function Surface({ ui, setUi }: { ui: TmUi; setUi: SetUi }) {
  const { pathname } = useLocation()
  const narrow = useNarrow()
  const reduced = useReducedMotion()
  const rects = useMarkerRects(ui.badges !== 'off' || ui.panel || ui.guided)
  const [popover, setPopover] = useState<
    { key: string; id: string; el: HTMLButtonElement } | null
  >(null)
  const [hover, setHover] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ box: Box; n: number } | null>(null)
  const [guidedTarget, setGuidedTarget] = useState<GuidedTarget | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [identity, setIdentityState] = useState<Identity | null>(getIdentity)
  const [pendingLabel, setPendingLabel] = useState<string | null>(null)
  const [spotKey, setSpotKey] = useState<string | null>(null)
  const guidedRef = useRef<GuidedHandle>(null)

  const specs = useMemo(
    () =>
      ui.badges === 'off' ? [] : layoutBadges(rects, {
        vw: globalThis.innerWidth,
        mode: ui.badges,
        skipKey: spotKey,
      }),
    [rects, ui.badges, spotKey],
  )

  // 换页：弹层没意义了
  useEffect(() => {
    setPopover(null)
  }, [pathname])
  // 窄屏：清单 / 导测是底部弹层，弹层（也是底部弹层）让位
  useEffect(() => {
    if (narrow && (ui.panel || ui.guided)) setPopover(null)
  }, [narrow, ui.panel, ui.guided])

  // 弹层跟着徽标走：徽标滚出视口（或被 只标有条款 滤掉）就收起
  const popSpec = popover ? specs.find((s) => s.key === popover.key) : undefined
  useEffect(() => {
    if (popover && !popSpec) setPopover(null)
  }, [popover, popSpec])
  const anchor: Box | null = useMemo(
    () =>
      popSpec
        ? {
          top: popSpec.y,
          left: popSpec.x,
          width: badgeWidth(popSpec.id, popSpec.text),
          height: 16,
        }
        : null,
    [popSpec],
  )

  const closePopover = useCallback(() => {
    setPopover((p) => {
      p?.el.isConnected && p.el.focus()
      return null
    })
  }, [])

  const focusMarker = useCallback((id: string) => {
    const el = scrollToMarker(id, !reduced)
    if (!el) return
    const show = () => {
      const r = el.getBoundingClientRect()
      setFlash((f) => ({
        box: { top: r.top, left: r.left, width: r.width, height: r.height },
        n: (f?.n ?? 0) + 1,
      }))
    }
    setTimeout(show, reduced ? 0 : 360)
  }, [reduced])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 1500)
    return () => clearTimeout(t)
  }, [flash])

  const openGuided = useCallback((t: GuidedTarget) => {
    setGuidedTarget(t)
    setPopover(null)
    setUi({ guided: true })
  }, [setUi])

  const closeToast = useCallback(() => setToast(null), [])
  const closeIdentity = useCallback(() => {
    setPendingLabel(null)
    setUi({ identity: false })
  }, [setUi])
  const requestIdentity = useCallback((label: string) => {
    setPendingLabel(label)
    setUi({ identity: true })
  }, [setUi])

  // 返回 true = 测试模式确实关掉了什么；false = 什么都没开，Esc 放行给产品
  const onEscape = useCallback((): boolean => {
    if (ui.identity) {
      closeIdentity()
      return true
    }
    if (popover) {
      closePopover()
      return true
    }
    if (ui.guided && guidedRef.current?.dismissSpotlight()) return true
    if (ui.panel) {
      setUi({ panel: false })
      return true
    }
    if (ui.guided) {
      setUi({ guided: false })
      return true
    }
    return false
  }, [
    ui.identity,
    ui.guided,
    ui.panel,
    popover,
    setUi,
    closePopover,
    closeIdentity,
  ])
  useEscape(true, onEscape)

  return (
    <>
      <style>{TM_CSS}</style>
      {ui.badges !== 'off'
        ? (
          <BadgesLayer
            specs={specs}
            openKey={popover?.key ?? null}
            hoverKey={hover}
            onHover={setHover}
            flash={flash}
            onOpen={(s, el) =>
              setPopover((p) =>
                p?.key === s.key ? null : { key: s.key, id: s.id, el }
              )}
          />
        )
        : flash
        ? (
          <div className='tm-layer'>
            <HighlightBox key={flash.n} box={flash.box} flash />
          </div>
        )
        : null}
      {popover && anchor
        ? (
          <Popover
            id={popover.id}
            anchor={anchor}
            onClose={closePopover}
            onOpenGuided={openGuided}
          />
        )
        : null}
      {ui.panel
        ? (
          <Panel
            pathname={pathname}
            rects={rects}
            onFocusMarker={focusMarker}
            onOpenGuided={openGuided}
            onClose={() => setUi({ panel: false })}
          />
        )
        : null}
      {ui.guided
        ? (
          <Guided
            ref={guidedRef}
            pathname={pathname}
            rects={rects}
            target={guidedTarget}
            hints={STEP_HINTS}
            identity={identity}
            identityOpen={ui.identity}
            panelOpen={ui.panel}
            onRequestIdentity={requestIdentity}
            onSpotlight={setSpotKey}
            onToast={setToast}
            onClose={() => setUi({ guided: false })}
          />
        )
        : null}
      {ui.identity
        ? (
          <IdentityDialog
            initial={identity}
            pending={pendingLabel}
            onSave={(id) => {
              setIdentity(id)
              setIdentityState(id)
              setPendingLabel(null)
              setUi({ identity: false })
            }}
            onClose={closeIdentity}
          />
        )
        : null}
      <Toast toast={toast} onClose={closeToast} />
    </>
  )
}
