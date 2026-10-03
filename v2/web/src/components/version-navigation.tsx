import { Tooltip } from '@base-ui-components/react/tooltip'
import { Check } from 'lucide-react'
import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import type { AgentVersionDTO } from '../api/types'
import { versionOrdinal, versionTag } from '../lib/version-label'

export const VERSION_NAVIGATION_THRESHOLD = 2
export const versionAnchor = (id: number) => `version-${id}`

// Fit card anchors into the actual page scroll range. Near the end of a short
// list, several native scrollIntoView targets would otherwise clamp to the same
// position. Both navigation and scroll tracking use these distinct targets.
function scrollTargets(root: HTMLElement | null) {
  const cards = Array.from(
    root?.querySelectorAll<HTMLElement>('[data-version-id]') ?? [],
  )
  const offsets = cards.map((card) =>
    card.getBoundingClientRect().top + scrollY -
    Number.parseFloat(getComputedStyle(card).scrollMarginTop)
  )
  const first = offsets[0] ?? 0
  const last = offsets.at(-1) ?? first
  const max = Math.max(0, document.documentElement.scrollHeight - innerHeight)
  const start = Math.max(0, Math.min(first, max))
  const end = Math.max(0, Math.min(last, max))
  return cards.map((card, index) => ({
    card,
    top: last > first
      ? start + (offsets[index] - first) / (last - first) * (end - start)
      : start,
  }))
}

// Browser-native smooth scrolling slows down on long jumps. Keep version
// navigation brief and let any new user input interrupt it immediately.
function scrollToVersion(top: number, onComplete?: () => void): () => void {
  const start = scrollY
  const distance = top - start
  if (
    Math.abs(distance) < 1 ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    globalThis.scrollTo({ top, behavior: 'instant' })
    onComplete?.()
    return () => {}
  }
  const duration = Math.min(260, Math.max(140, Math.abs(distance) * 0.18))
  const started = performance.now()
  const controller = new AbortController()
  let frame = 0
  const cancel = () => {
    if (controller.signal.aborted) return
    cancelAnimationFrame(frame)
    controller.abort()
    onComplete?.()
  }
  for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    globalThis.addEventListener(type, cancel, {
      passive: true,
      signal: controller.signal,
    })
  }
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / duration)
    const eased = 1 - (1 - progress) ** 3
    globalThis.scrollTo({ top: start + distance * eased, behavior: 'instant' })
    if (progress < 1) frame = requestAnimationFrame(step)
    else cancel()
  }
  frame = requestAnimationFrame(step)
  return cancel
}

// Match the application's phone layout. Desktop keeps its original directory,
// including the horizontal layout below 1320px.
const MOBILE_RAIL_QUERY = '(max-width: 767px)'
function subscribeToMobileRail(notify: () => void) {
  const media = matchMedia(MOBILE_RAIL_QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const isMobileRail = () => matchMedia(MOBILE_RAIL_QUERY).matches

// The directory follows the same order as the cards, including a linked version
// promoted to the top. It navigates the document; it never selects an entry.
export function VersionNavigation({
  versions,
  children,
}: { versions: AgentVersionDTO[]; children: ReactNode }) {
  const mobile = useSyncExternalStore(
    subscribeToMobileRail,
    isMobileRail,
    () => false,
  )
  const previewID = useId()
  const root = useRef<HTMLDivElement>(null)
  const navigation = useRef<HTMLElement>(null)
  const clickedID = useRef<number | null>(null)
  const cancelScroll = useRef<() => void>(() => {})
  useEffect(() => () => cancelScroll.current(), [])
  const releaseRail = useRef<() => void>(() => {})
  const wakeRail = useRef<() => void>(() => {})
  const finishRail = useRef<() => void>(() => {})
  const [activity, setActivity] = useState<'idle' | 'page' | 'rail'>('idle')
  const [activeID, setActiveID] = useState<number | null>(null)
  const visible = versions.length >= VERSION_NAVIGATION_THRESHOLD
  const order = versions.map(({ id }) => id).join(',')
  const latestID = Math.max(...versions.map(({ id }) => id))

  useEffect(() => {
    if (!visible || mobile) return
    let frame = 0
    const measure = () => {
      frame = 0
      const targets = scrollTargets(root.current)
      const nav = navigation.current
      const bounds = root.current?.getBoundingClientRect()
      if (nav && bounds) {
        // Anchor to the content's outer gutter while CSS keeps the rail
        // vertically centered in the viewport, independent of list scrolling.
        nav.style.setProperty(
          '--version-directory-left',
          `${bounds.left - 116}px`,
        )
      }
      let current = targets[0]
      for (const target of targets) {
        if (target.top <= scrollY + 1) current = target
        else break
      }
      // When the whole list fits without scrolling, an explicit click still
      // identifies the chosen version instead of always selecting the last one.
      if (targets.at(-1)?.top === targets[0]?.top) {
        current = targets.find(({ card }) =>
          Number(card.dataset.versionId) === clickedID.current
        ) ?? targets[0]
      }
      setActiveID(current ? Number(current.card.dataset.versionId) : null)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    schedule()
    globalThis.addEventListener('scroll', schedule, { passive: true })
    globalThis.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    if (root.current) observer.observe(root.current)
    return () => {
      cancelAnimationFrame(frame)
      globalThis.removeEventListener('scroll', schedule)
      globalThis.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [visible, order, mobile])

  // Reveal the current item by scrolling only the directory, never the page.
  useEffect(() => {
    if (mobile) return
    const nav = navigation.current
    const link = nav?.querySelector<HTMLElement>('[aria-current="location"]')
    if (!nav || !link) return
    const bounds = nav.getBoundingClientRect()
    const item = link.getBoundingClientRect()
    if (getComputedStyle(nav).flexDirection === 'column') {
      if (item.top < bounds.top) nav.scrollTop -= bounds.top - item.top
      else if (item.bottom > bounds.bottom) {
        nav.scrollTop += item.bottom - bounds.bottom
      }
    } else {
      if (item.left < bounds.left) nav.scrollLeft -= bounds.left - item.left
      else if (item.right > bounds.right) {
        nav.scrollLeft += item.right - bounds.right
      }
    }
  }, [activeID, mobile])

  useEffect(() => {
    const nav = navigation.current
    if (!visible || !nav || !mobile) return
    let frame = 0
    let idleTimer: ReturnType<typeof setTimeout>
    let settleTimer: ReturnType<typeof setTimeout>
    let driving = false
    let held = false
    let focused = false
    let navigating = false
    let railMoving = false
    let scrollSource: 'page' | 'rail' = 'page'
    let targets = scrollTargets(root.current)
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'))
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const centerOf = (link: HTMLElement) =>
      link.offsetTop - (nav.clientHeight - link.offsetHeight) / 2
    const idle = () => {
      clearTimeout(idleTimer)
      if (held || focused || driving || navigating) return
      scrollSource = 'page'
      setActivity('idle')
    }
    const scheduleIdle = () => {
      clearTimeout(idleTimer)
      if (!held && !focused && !navigating) {
        // Native scrollend idles immediately. This only covers browsers or
        // blocked wheel gestures that never deliver that event.
        idleTimer = setTimeout(idle, 100)
      }
    }
    const wake = (source: 'page' | 'rail') => {
      scrollSource = source
      setActivity(focused ? 'rail' : source)
      scheduleIdle()
    }
    wakeRail.current = () => {
      navigating = true
      wake('rail')
    }
    const finishNavigation = () => {
      navigating = false
      if (scrollSource === 'rail') idle()
    }
    finishRail.current = finishNavigation
    setActivity('idle')
    const measure = () => {
      frame = 0
      targets = scrollTargets(root.current)
      const bounds = root.current?.getBoundingClientRect()
      if (bounds) {
        nav.style.setProperty(
          '--version-directory-left',
          `${Math.max(4, bounds.left - 112)}px`,
        )
        nav.dataset.inView = String(
          focused || (bounds.bottom > 96 && bounds.top < innerHeight - 96),
        )
        if (!driving) {
          // The first tick belongs beside the cards, not over their heading.
          // Keep this position fixed under the finger throughout a gesture.
          nav.style.setProperty(
            '--version-directory-top',
            `${
              Math.min(
                innerHeight - 118,
                Math.max(innerHeight / 2, bounds.top + 22),
              )
            }px`,
          )
        }
      }
      // Only one surface leads at a time. A rail gesture must not be pulled
      // back by the page scroll it produces (or by native scroll snapping).
      if (driving) return
      let current = targets[0]
      for (const target of targets) {
        if (target.top <= scrollY + 1) current = target
        else break
      }
      if (targets.at(-1)?.top === targets[0]?.top) {
        current = targets.find(({ card }) =>
          Number(card.dataset.versionId) === clickedID.current
        ) ?? targets[0]
      }
      const id = current ? Number(current.card.dataset.versionId) : null
      setActiveID(id)
      const link = links.find((item) => item.hash === `#version-${id}`)
      if (link && Math.abs(nav.scrollTop - centerOf(link)) > 1) {
        // Page-driven positioning is immediate; animating it would introduce
        // a second scroll clock and fight an incoming touch gesture.
        nav.scrollTo({ top: centerOf(link), behavior: 'instant' })
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    const release = () => {
      driving = false
      held = false
      railMoving = false
      clearTimeout(settleTimer)
    }
    releaseRail.current = release
    const settle = () => {
      if (!driving || held) return
      const nearest = links.reduce((best, link) =>
        Math.abs(centerOf(link) - nav.scrollTop) <
            Math.abs(centerOf(best) - nav.scrollTop)
          ? link
          : best
      )
      if (Math.abs(nav.scrollTop - centerOf(nearest)) > 1) {
        nav.scrollTo({
          top: centerOf(nearest),
          behavior: reduced.matches ? 'instant' : 'smooth',
        })
        settleTimer = setTimeout(settle, 180)
        return
      }
      release()
      idle()
      schedule()
    }
    const scheduleSettle = () => {
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, 180)
    }
    const begin = () => {
      cancelScroll.current()
      targets = scrollTargets(root.current)
      driving = true
      wake('rail')
      scheduleSettle()
    }
    const onPointerDown = () => {
      focused = false
      held = true
      begin()
    }
    const onPointerUp = () => {
      if (!held && !driving) return
      held = false
      if (railMoving) scheduleSettle()
      else settle()
    }
    const onPointerCancel = (event: PointerEvent) => {
      // Native touch panning cancels the pointer while the finger is still
      // down. Only touchend/touchcancel may end that gesture, even if the
      // reader pauses mid-swipe longer than our scroll-settle debounce.
      if (event.pointerType !== 'touch') onPointerUp()
    }
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaY) > 0) begin()
    }
    const onRailScroll = () => {
      if (!driving) return
      railMoving = true
      wake('rail')
      const offset = nav.scrollTop
      let index = 0
      while (index < links.length - 1 && centerOf(links[index + 1]) <= offset) {
        index++
      }
      const next = Math.min(index + 1, links.length - 1)
      const span = centerOf(links[next]) - centerOf(links[index])
      const progress = span > 0
        ? Math.max(0, Math.min(1, (offset - centerOf(links[index])) / span))
        : 0
      const selected = progress < 0.5 ? index : next
      const target = targets[selected]
      if (!target || !targets[index] || !targets[next]) return
      clickedID.current = Number(target.card.dataset.versionId)
      setActiveID(clickedID.current)
      // Direct manipulation: interpolate with native touch momentum instead
      // of restarting a smooth page animation at every crossed version.
      globalThis.scrollTo({
        top: targets[index].top +
          (targets[next].top - targets[index].top) * progress,
        behavior: 'instant',
      })
      scheduleSettle()
    }
    const onRailScrollEnd = () => {
      railMoving = false
      settle()
    }
    const onPageScroll = () => {
      // Window scrolling can come from a rail tap or its final snap. Keep
      // that gesture's brightness until outside input takes over or it idles.
      if (!driving) wake(scrollSource)
      schedule()
    }
    const onPageScrollEnd = (event: Event) => {
      // A page-synchronized directory can emit its own bubbling scrollend
      // while the document is still moving.
      if (event.target === document || event.target === globalThis) idle()
    }
    const onOutsideInput = (event: Event) => {
      if (nav.contains(event.target as Node)) return
      release()
      focused = false
      navigating = false
      scrollSource = 'page'
      clearTimeout(idleTimer)
      setActivity('idle')
    }
    const onOutsideWheel = (event: WheelEvent) => {
      if (
        nav.contains(event.target as Node) || event.ctrlKey || !event.deltaY
      ) {
        return
      }
      release()
      focused = false
      navigating = false
      wake('page')
    }
    const onFocus = () => {
      // Touch focus and a parked mouse must not keep the overlay opaque.
      focused = Boolean(nav.querySelector(':focus-visible'))
      if (focused) wake('rail')
    }
    const onBlur = (event: FocusEvent) => {
      if (nav.contains(event.relatedTarget as Node)) return
      focused = false
      idle()
    }
    const onKey = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      event.stopPropagation()
      cancelScroll.current()
      release()
      focused = true
      navigating = true
      wake('rail')
      const index = Math.max(
        0,
        links.indexOf(document.activeElement as HTMLAnchorElement),
      )
      const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
        ? links.length - 1
        : Math.max(
          0,
          Math.min(
            links.length - 1,
            index + (event.key === 'ArrowDown' ? 1 : -1),
          ),
        )
      const target = targets[next]
      if (!target) return
      clickedID.current = Number(target.card.dataset.versionId)
      links[next].focus({ preventScroll: true })
      cancelScroll.current = scrollToVersion(target.top, finishNavigation)
      schedule()
    }
    schedule()
    const observer = new ResizeObserver(schedule)
    if (root.current) observer.observe(root.current)
    observer.observe(nav)
    nav.addEventListener('scroll', onRailScroll, { passive: true })
    nav.addEventListener('scrollend', onRailScrollEnd)
    nav.addEventListener('wheel', onWheel, { passive: true })
    nav.addEventListener('pointerdown', onPointerDown)
    nav.addEventListener('focusin', onFocus)
    nav.addEventListener('focusout', onBlur)
    nav.addEventListener('keydown', onKey)
    globalThis.addEventListener('pointerdown', onOutsideInput, {
      passive: true,
    })
    globalThis.addEventListener('keydown', onOutsideInput)
    globalThis.addEventListener('wheel', onOutsideWheel, { passive: true })
    globalThis.addEventListener('pointerup', onPointerUp, { passive: true })
    globalThis.addEventListener('pointercancel', onPointerCancel, {
      passive: true,
    })
    globalThis.addEventListener('touchend', onPointerUp, { passive: true })
    globalThis.addEventListener('touchcancel', onPointerUp, { passive: true })
    globalThis.addEventListener('scroll', onPageScroll, { passive: true })
    globalThis.addEventListener('scrollend', onPageScrollEnd)
    globalThis.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(idleTimer)
      clearTimeout(settleTimer)
      cancelScroll.current()
      observer.disconnect()
      nav.removeEventListener('scroll', onRailScroll)
      nav.removeEventListener('scrollend', onRailScrollEnd)
      nav.removeEventListener('wheel', onWheel)
      nav.removeEventListener('pointerdown', onPointerDown)
      nav.removeEventListener('focusin', onFocus)
      nav.removeEventListener('focusout', onBlur)
      nav.removeEventListener('keydown', onKey)
      globalThis.removeEventListener('pointerdown', onOutsideInput)
      globalThis.removeEventListener('keydown', onOutsideInput)
      globalThis.removeEventListener('wheel', onOutsideWheel)
      globalThis.removeEventListener('pointerup', onPointerUp)
      globalThis.removeEventListener('pointercancel', onPointerCancel)
      globalThis.removeEventListener('touchend', onPointerUp)
      globalThis.removeEventListener('touchcancel', onPointerUp)
      globalThis.removeEventListener('scroll', onPageScroll)
      globalThis.removeEventListener('scrollend', onPageScrollEnd)
      globalThis.removeEventListener('resize', schedule)
      nav.style.removeProperty('--version-directory-top')
      delete nav.dataset.inView
    }
  }, [visible, order, mobile])

  return (
    <div ref={root} className={visible ? 'version-directory' : undefined}>
      {visible && (
        <nav
          ref={navigation}
          aria-label='版本快速导航'
          className='version-directory-nav'
          data-activity={mobile ? activity : undefined}
          aria-description={mobile
            ? '上下滑动目录浏览版本，也可点击版本或使用上下方向键。'
            : undefined}
        >
          {versions.map((version) => {
            const tag = versionTag(version, versions)
            const current = version.id === (activeID ?? versions[0]?.id)
            const latest = version.id === latestID
            return (
              <Tooltip.Root key={version.id}>
                <Tooltip.Trigger
                  render={<a href={`#${versionAnchor(version.id)}`} />}
                  delay={150}
                  closeDelay={100}
                  aria-label={`跳转到 ${tag}${latest ? '，最新版本' : ''}${
                    version.isEntry ? '，参赛版本' : ''
                  }`}
                  aria-current={current ? 'location' : undefined}
                  aria-describedby={`${previewID}-${version.id}`}
                  className='version-directory-link'
                  onClick={(event) => {
                    if (
                      event.metaKey || event.ctrlKey || event.shiftKey ||
                      event.altKey
                    ) return
                    const targets = scrollTargets(root.current)
                    const target = targets.find(({ card }) =>
                      Number(card.dataset.versionId) === version.id
                    )
                    if (!target) return
                    event.preventDefault()
                    clickedID.current = version.id
                    // Follow the actual reading position during smooth scroll.
                    // Only a list with no scroll travel needs explicit selection.
                    if (targets[0]?.top === targets.at(-1)?.top) {
                      setActiveID(version.id)
                    }
                    target.card.focus({ preventScroll: true })
                    cancelScroll.current()
                    if (mobile) {
                      releaseRail.current()
                      wakeRail.current()
                    }
                    cancelScroll.current = scrollToVersion(
                      target.top,
                      mobile ? finishRail.current : undefined,
                    )
                  }}
                >
                  <span aria-hidden='true' className='version-directory-number'>
                    {versionOrdinal(version, versions)}
                  </span>
                  <span aria-hidden='true' className='version-directory-tick' />
                  <span className='version-directory-label'>
                    <span className='font-semibold'>{tag}</span>
                    {latest && <span className='text-[11px]'>最新</span>}
                    {version.isEntry && (
                      <Check
                        aria-hidden='true'
                        className='ml-auto h-3.5 w-3.5 shrink-0'
                      />
                    )}
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner
                    side='right'
                    align='center'
                    sideOffset={12}
                    collisionPadding={16}
                    className='z-50'
                  >
                    <Tooltip.Popup
                      role='tooltip'
                      id={`${previewID}-${version.id}`}
                      className='version-directory-preview'
                    >
                      <div className='flex items-center gap-2 text-sm font-semibold text-(--foreground)'>
                        <span>
                          {tag}
                          {version.note?.trim()
                            ? ` · ${version.note.trim()}`
                            : ''}
                        </span>
                        {version.isEntry && (
                          <Check
                            aria-label='参赛版本'
                            className='ml-auto h-4 w-4 shrink-0'
                          />
                        )}
                      </div>
                      {latest && (
                        <p className='mt-1 text-xs text-(--foreground-subtle)'>
                          最新版本
                        </p>
                      )}
                      <p className='mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-(--foreground-subtle)'>
                        {version.prompt}
                      </p>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            )
          })}
        </nav>
      )}
      <div className='version-directory-content min-w-0 space-y-3'>
        {children}
      </div>
    </div>
  )
}
