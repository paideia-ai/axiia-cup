import { Check } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import type { AgentVersionDTO } from '../api/types'
import { versionTag } from '../lib/version-label'

export const VERSION_NAVIGATION_THRESHOLD = 5
export const versionAnchor = (id: number) => `version-${id}`

// The directory follows the same order as the cards, including a linked version
// promoted to the top. It navigates the document; it never selects an entry.
export function VersionNavigation({
  versions,
  children,
}: { versions: AgentVersionDTO[]; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const navigation = useRef<HTMLElement>(null)
  const [activeID, setActiveID] = useState<number | null>(null)
  const visible = versions.length >= VERSION_NAVIGATION_THRESHOLD
  const order = versions.map(({ id }) => id).join(',')
  const latestID = Math.max(...versions.map(({ id }) => id))

  useEffect(() => {
    if (!visible) return
    let frame = 0
    const measure = () => {
      frame = 0
      const cards = Array.from(
        root.current?.querySelectorAll<HTMLElement>('[data-version-id]') ?? [],
      )
      const nav = navigation.current
      const horizontal = !nav ||
        getComputedStyle(nav).flexDirection !== 'column'
      const bounds = root.current?.getBoundingClientRect()
      if (nav && bounds) {
        // Keep a long directory inside the visible portion of the list, even
        // near its bottom where the sticky element meets its containing block.
        nav.style.maxHeight = horizontal ? '' : `${
          Math.max(
            44,
            Math.min(innerHeight - 24, bounds.bottom) -
              Math.max(64, bounds.top),
          )
        }px`
      }
      const top = cards[0]
        ? Number.parseFloat(getComputedStyle(cards[0]).scrollMarginTop) + 8
        : 80
      let current = cards[0]
      for (const card of cards) {
        if (card.getBoundingClientRect().top <= top) current = card
        else break
      }
      const last = cards.at(-1)
      if (last && last.getBoundingClientRect().bottom <= innerHeight) {
        current = last
      }
      setActiveID(current ? Number(current.dataset.versionId) : null)
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
              <a
                key={version.id}
                href={`#${versionAnchor(version.id)}`}
                aria-label={`跳转到 ${tag}${latest ? '，最新版本' : ''}${
                  version.isEntry ? '，参赛版本' : ''
                }`}
                aria-current={current ? 'location' : undefined}
                title={version.note?.trim() || tag}
                className='version-directory-link'
                onClick={(event) => {
                  if (
                    event.metaKey || event.ctrlKey || event.shiftKey ||
                    event.altKey
                  ) return
                  const card = root.current?.querySelector<HTMLElement>(
                    `#${versionAnchor(version.id)}`,
                  )
                  if (!card) return
                  event.preventDefault()
                  card.focus({ preventScroll: true })
                  card.scrollIntoView({
                    block: 'start',
                    behavior:
                      matchMedia('(prefers-reduced-motion: reduce)').matches
                        ? 'instant'
                        : 'smooth',
                  })
                }}
              >
                <span className='font-semibold'>{tag}</span>
                {latest && <span className='text-[11px]'>最新</span>}
                {version.isEntry && (
                  <Check
                    aria-hidden='true'
                    className='ml-auto h-3.5 w-3.5 shrink-0'
                  />
                )}
              </a>
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
