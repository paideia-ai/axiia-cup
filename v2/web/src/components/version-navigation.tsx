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

  useEffect(() => {
    if (!visible) return
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
  }, [visible, order])

  // Reveal the current item by scrolling only the directory, never the page.
  useEffect(() => {
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
  }, [activeID])

  return (
    <div ref={root} className={visible ? 'version-directory' : undefined}>
      {visible && (
        <nav
          ref={navigation}
          aria-label='版本快速导航'
          className='version-directory-nav'
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
