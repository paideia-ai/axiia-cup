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
  const suppressRailClick = useRef(false)
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
    let momentumFrame = 0
    let position = 0
    let pointerY = 0
    let pointerTime = 0
    let velocity = 0
    let moved = false
    let scrollSource: 'page' | 'rail' = 'page'
    let targets = scrollTargets(root.current)
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'))
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    nav.style.setProperty('--version-count', String(links.length))
    const reveal = (link: HTMLAnchorElement) => {
      const index = links.indexOf(link)
      // Pin the end groups before advancing through them. In particular,
      // v3, v2 and v1 share exactly the same directory position.
      if (index >= links.length - 3) {
        nav.scrollTo({
          top: nav.scrollHeight - nav.clientHeight,
          behavior: 'instant',
        })
        return
      }
      if (index < 3) {
        nav.scrollTo({ top: 0, behavior: 'instant' })
        return
      }
      const top = link.offsetTop - nav.scrollTop
      const bottom = top + link.offsetHeight
      const lookAhead = link.offsetHeight * 2
      // Keep the list still while its current row is visible. Reveal a small
      // neighboring group only at an edge; the final group stays bottom-aligned.
      if (top < 48) {
        nav.scrollTo({
          top: link.offsetTop - 48 - lookAhead,
          behavior: 'instant',
        })
      } else if (bottom > nav.clientHeight - 68) {
        nav.scrollTo({
          top: link.offsetTop + link.offsetHeight - nav.clientHeight + 68 +
            lookAhead,
          behavior: 'instant',
        })
      }
    }
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
      }
      // Only one surface leads at a time. A rail gesture must not be pulled
      // back by the page scroll it produces.
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
      if (link) reveal(link)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    const release = () => {
      driving = false
      held = false
      cancelAnimationFrame(momentumFrame)
      clearTimeout(settleTimer)
    }
    releaseRail.current = release
    const drive = (next: number) => {
      position = Math.max(0, Math.min(links.length - 1, next))
      const index = Math.floor(position)
      const after = Math.min(index + 1, links.length - 1)
      const selected = Math.round(position)
      const target = targets[selected]
      if (!target) return
      clickedID.current = Number(target.card.dataset.versionId)
      setActiveID(clickedID.current)
      reveal(links[selected])
      globalThis.scrollTo({
        top: targets[index].top +
          (targets[after].top - targets[index].top) * (position - index),
        behavior: 'instant',
      })
      wake('rail')
    }
    const settle = () => {
      if (!driving || held) return
      const target = targets[Math.round(position)]
      release()
      if (!target) return idle()
      navigating = true
      wake('rail')
      cancelScroll.current = scrollToVersion(target.top, finishNavigation)
      schedule()
    }
    const begin = () => {
      cancelScroll.current()
      cancelAnimationFrame(momentumFrame)
      clearTimeout(settleTimer)
      targets = scrollTargets(root.current)
      let index = 0
      while (index < targets.length - 1 && targets[index + 1].top <= scrollY) {
        index++
      }
      const after = Math.min(index + 1, targets.length - 1)
      const span = targets[after].top - targets[index].top
      position = index +
        (span > 0 ? Math.max(0, (scrollY - targets[index].top) / span) : 0)
      driving = true
      wake('rail')
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      focused = false
      held = true
      moved = false
      suppressRailClick.current = false
      velocity = 0
      pointerY = event.clientY
      pointerTime = performance.now()
      begin()
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!held) return
      const delta = (pointerY - event.clientY) / 44
      if (!delta) return
      if (!moved && Math.abs(delta * 44) < 4) return
      const now = performance.now()
      velocity = delta / Math.max(16, now - pointerTime)
      pointerY = event.clientY
      pointerTime = now
      moved = true
      suppressRailClick.current = true
      if (event.cancelable) event.preventDefault()
      drive(position + delta)
    }
    const onPointerUp = () => {
      if (!held) return
      held = false
      if (!moved) {
        release()
        idle()
        return
      }
      if (reduced.matches || performance.now() - pointerTime > 100) velocity = 0
      velocity = Math.max(-0.035, Math.min(0.035, velocity))
      let previous = performance.now()
      const coast = (now: number) => {
        const elapsed = Math.min(32, now - previous)
        previous = now
        const before = position
        if (Math.abs(velocity) < 0.0006) return settle()
        drive(position + velocity * elapsed)
        velocity *= Math.exp(-elapsed / 160)
        if (position === before) return settle()
        momentumFrame = requestAnimationFrame(coast)
      }
      if (Math.abs(velocity) < 0.0006) settle()
      else momentumFrame = requestAnimationFrame(coast)
    }
    const onPointerCancel = () => {
      velocity = 0
      onPointerUp()
    }
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.deltaY) return
      event.preventDefault()
      cancelAnimationFrame(momentumFrame)
      if (!driving) begin()
      const units = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
        ? nav.clientHeight
        : 1
      drive(position + event.deltaY * units / 44)
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, 100)
    }
    const preventDrag = (event: Event) => event.preventDefault()
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
      if (focused) {
        suppressRailClick.current = false
        wake('rail')
      }
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
    nav.addEventListener('wheel', onWheel, { passive: false })
    nav.addEventListener('dragstart', preventDrag)
    globalThis.addEventListener('pointermove', onPointerMove, {
      passive: false,
    })
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
      cancelAnimationFrame(momentumFrame)
      clearTimeout(idleTimer)
      clearTimeout(settleTimer)
      cancelScroll.current()
      observer.disconnect()
      nav.removeEventListener('dragstart', preventDrag)
      globalThis.removeEventListener('pointermove', onPointerMove)
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
      nav.style.removeProperty('--version-count')
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
                    if (mobile && suppressRailClick.current) {
                      suppressRailClick.current = false
                      event.preventDefault()
                      return
                    }
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
