import { Tooltip } from '@base-ui-components/react/tooltip'
import { Check } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

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
function scrollToVersion(top: number): () => void {
  const start = scrollY
  const distance = top - start
  if (
    Math.abs(distance) < 1 ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    globalThis.scrollTo({ top, behavior: 'instant' })
    return () => {}
  }
  const duration = Math.min(260, Math.max(140, Math.abs(distance) * 0.18))
  const started = performance.now()
  const controller = new AbortController()
  let frame = 0
  const cancel = () => {
    cancelAnimationFrame(frame)
    controller.abort()
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

// The directory follows the same order as the cards, including a linked version
// promoted to the top. It navigates the document; it never selects an entry.
export function VersionNavigation({
  versions,
  children,
}: { versions: AgentVersionDTO[]; children: ReactNode }) {
  const previewID = useId()
  const root = useRef<HTMLDivElement>(null)
  const navigation = useRef<HTMLElement>(null)
  const clickedID = useRef<number | null>(null)
  const cancelScroll = useRef<() => void>(() => {})
  useEffect(() => () => cancelScroll.current(), [])
  const [activeID, setActiveID] = useState<number | null>(null)
  const visible = versions.length >= VERSION_NAVIGATION_THRESHOLD
  const order = versions.map(({ id }) => id).join(',')
  const latestID = Math.max(...versions.map(({ id }) => id))

  const [mobile, setMobile] = useState(() =>
    matchMedia('(max-width: 767px)').matches
  )
  useEffect(() => {
    const media = matchMedia('(max-width: 767px)')
    const update = () => {
      cancelScroll.current()
      const nav = navigation.current
      if (nav) {
        nav.scrollTop = 0
        nav.scrollLeft = 0
        delete nav.dataset.activity
        delete nav.dataset.driving
      }
      setMobile(media.matches)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

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

  // On mobile, the native scroll container owns touch momentum and snapping. While it is
  // being scrolled, map its position continuously onto the document; otherwise
  // the document owns the selection. Never let the two scroll listeners feed
  // back into one another.
  useEffect(() => {
    const nav = navigation.current
    if (!visible || !nav || !mobile) return
    let frame = 0
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    let held = false
    let driving = false
    const links = () => Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'))
    const centers = () =>
      links().map((link) =>
        link.offsetTop + link.offsetHeight / 2 - nav.clientHeight / 2
      )
    const wake = () => {
      clearTimeout(idleTimer)
      nav.dataset.activity = 'rail'
    }
    const rest = () => {
      clearTimeout(idleTimer)
      idleTimer = globalThis.setTimeout(() => {
        if (!held && !driving) nav.dataset.activity = 'idle'
      }, 180)
    }
    const finish = () => {
      if (held) return
      driving = false
      nav.dataset.driving = 'false'
      nav.dataset.activity = 'idle'
    }
    const settle = () => {
      clearTimeout(settleTimer)
      settleTimer = globalThis.setTimeout(finish, 180)
    }
    const begin = () => {
      cancelScroll.current()
      clearTimeout(settleTimer)
      driving = true
      nav.dataset.driving = 'true'
      wake()
    }
    const measure = () => {
      frame = 0
      const bounds = root.current?.getBoundingClientRect()
      if (!bounds) return
      nav.style.setProperty(
        '--version-directory-left',
        `${bounds.left - 116}px`,
      )
      nav.dataset.onstage = String(
        bounds.top < innerHeight * 0.8 && bounds.bottom > innerHeight * 0.2,
      )
      if (driving) return
      const targets = scrollTargets(root.current)
      if (!targets.length) return
      let index = 0
      targets.forEach((target, i) => {
        if (target.top <= scrollY + 1) index = i
      })
      if (targets.at(-1)?.top === targets[0]?.top) {
        const clicked = targets.findIndex(({ card }) =>
          Number(card.dataset.versionId) === clickedID.current
        )
        index = Math.max(0, clicked)
      }
      const positions = centers()
      // A fractional position makes the rail follow normal page scrolling too.
      const next = targets[index + 1]
      const span = next ? next.top - targets[index].top : 0
      const fraction = span > 0
        ? Math.max(0, Math.min(1, (scrollY - targets[index].top) / span))
        : 0
      nav.scrollTop = positions[index] +
        fraction *
          ((positions[index + 1] ?? positions[index]) - positions[index])
      setActiveID(Number(targets[index].card.dataset.versionId))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    let railFrame = 0
    const followRail = () => {
      railFrame = 0
      if (!driving) return
      const positions = centers()
      const targets = scrollTargets(root.current)
      if (!positions.length || !targets.length) return
      const pitch = positions[1] - positions[0] || 44
      const position = Math.max(
        0,
        Math.min(targets.length - 1, (nav.scrollTop - positions[0]) / pitch),
      )
      const index = Math.floor(position)
      const next = Math.min(index + 1, targets.length - 1)
      const top = targets[index].top +
        (position - index) * (targets[next].top - targets[index].top)
      globalThis.scrollTo({ top, behavior: 'instant' })
      const selected = Number(
        targets[Math.round(position)].card.dataset.versionId,
      )
      clickedID.current = selected
      setActiveID(selected)
    }
    const onRailScroll = () => {
      if (!driving) return
      wake()
      if (!railFrame) railFrame = requestAnimationFrame(followRail)
      settle()
    }
    const down = () => {
      held = true
      begin()
    }
    const up = (event: Event) => {
      // Native touch scrolling cancels pointer events before the finger lifts.
      // Track touchend separately so the rail stays bright at its scroll limits.
      if (event instanceof PointerEvent && event.pointerType === 'touch') return
      held = false
      settle()
    }
    const wheel = () => {
      begin()
      settle()
    }
    const onPageScroll = () => {
      if (!driving) {
        nav.dataset.activity = 'page'
        rest()
      }
      schedule()
    }
    // A new gesture outside the overlay immediately returns control to the page,
    // including when the previous rail gesture still has momentum.
    const outsideDown = (event: PointerEvent) => {
      if (nav.contains(event.target as Node)) return
      held = false
      clearTimeout(settleTimer)
      clearTimeout(idleTimer)
      finish()
    }
    const click = () => {
      held = false
      finish()
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }
      const items = links()
      const current = items.indexOf(document.activeElement as HTMLAnchorElement)
      let next = current
      if (event.key === 'ArrowDown') next++
      else if (event.key === 'ArrowUp') next--
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = items.length - 1
      else return
      event.preventDefault()
      const link = items[Math.max(0, Math.min(items.length - 1, next))]
      link?.focus({ preventScroll: true })
      link?.click()
      // Arrow navigation stays in the rail; Enter follows the link into the card.
      link?.focus({ preventScroll: true })
    }
    schedule()
    nav.dataset.activity = 'idle'
    nav.addEventListener('scroll', onRailScroll, { passive: true })
    nav.addEventListener('pointerdown', down, { passive: true })
    nav.addEventListener('touchstart', down, { passive: true })
    nav.addEventListener('wheel', wheel, { passive: true })
    nav.addEventListener('click', click)
    nav.addEventListener('keydown', keyboard)
    globalThis.addEventListener('pointerdown', outsideDown, { passive: true })
    globalThis.addEventListener('touchend', up, { passive: true })
    globalThis.addEventListener('touchcancel', up, { passive: true })
    globalThis.addEventListener('pointerup', up, { passive: true })
    globalThis.addEventListener('pointercancel', up, { passive: true })
    globalThis.addEventListener('scroll', onPageScroll, { passive: true })
    globalThis.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    if (root.current) observer.observe(root.current)
    observer.observe(nav)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(railFrame)
      clearTimeout(idleTimer)
      clearTimeout(settleTimer)
      observer.disconnect()
      nav.removeEventListener('scroll', onRailScroll)
      nav.removeEventListener('pointerdown', down)
      nav.removeEventListener('touchstart', down)
      nav.removeEventListener('wheel', wheel)
      nav.removeEventListener('click', click)
      nav.removeEventListener('keydown', keyboard)
      globalThis.removeEventListener('pointerdown', outsideDown)
      globalThis.removeEventListener('touchend', up)
      globalThis.removeEventListener('touchcancel', up)
      globalThis.removeEventListener('pointerup', up)
      globalThis.removeEventListener('pointercancel', up)
      globalThis.removeEventListener('scroll', onPageScroll)
      globalThis.removeEventListener('resize', schedule)
    }
  }, [visible, order, mobile])

  return (
    <div ref={root} className={visible ? 'version-directory' : undefined}>
      {visible && (
        <nav
          ref={navigation}
          aria-label='版本快速导航'
          className='version-directory-nav'
          data-onstage={mobile ? 'false' : undefined}
          aria-description={mobile
            ? '上下滑动或滚动目录浏览版本，也可点击版本或使用上下方向键。'
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
                    cancelScroll.current = scrollToVersion(target.top)
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
