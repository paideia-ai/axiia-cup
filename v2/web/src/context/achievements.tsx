import { type PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { achievements, ApiError, sseUrl } from '../api/client'
import type {
  AchievementEventDTO,
  AchievementEventsResponse,
} from '../api/types'
import { claimAchievementPresentation } from '../lib/achievement-events'
import { navigationCache } from '../lib/navigation-cache'
import { playSound } from '../lib/sound'

interface Presentation extends AchievementEventDTO {
  audible: boolean
}

export function AchievementsProvider(
  { accountID, children }: PropsWithChildren<{ accountID: string }>,
) {
  const [queue, setQueue] = useState<Presentation[]>([])
  useEffect(() => {
    let active = true
    let source: EventSource | null = null
    let retry: ReturnType<typeof setTimeout> | undefined
    let cursor: number | null = null
    let pending: AchievementEventDTO[] = []
    let presenting = false
    const present = async () => {
      if (presenting || document.hidden || !document.hasFocus()) return
      presenting = true
      const batch = pending
      pending = []
      const accepted: Presentation[] = []
      try {
        for (const [index, item] of batch.entries()) {
          if (!active) break
          if (document.hidden || !document.hasFocus()) {
            pending.unshift(...batch.slice(index))
            break
          }
          if (await claimAchievementPresentation(accountID, item)) {
            accepted.push({ ...item, audible: accepted.length === 0 })
          } else if (document.hidden || !document.hasFocus()) {
            pending.unshift(...batch.slice(index))
            break
          }
        }
        if (active && accepted.length) {
          setQueue((current) => [...current, ...accepted])
        }
      } finally {
        presenting = false
        if (
          active && pending.length && !document.hidden && document.hasFocus()
        ) void present()
      }
    }
    const connect = async () => {
      try {
        if (cursor == null) {
          const response = await achievements.list()
          if (!active) return
          cursor = response.cursor
          navigationCache.setQueryData(['achievements', accountID], response)
        }
        if (!active) return
        source = new EventSource(
          sseUrl(`/achievements/events?after=${cursor}`),
          { withCredentials: true },
        )
        source.onmessage = (message) => {
          if (!active) return
          const response = JSON.parse(message.data) as AchievementEventsResponse
          const fresh = response.events.filter((item) =>
            item.sequence > (cursor ?? 0)
          )
          cursor = response.cursor
          if (!fresh.length) return
          pending.push(...fresh)
          void navigationCache.invalidateQueries({
            queryKey: ['achievements', accountID],
          })
          void navigationCache.invalidateQueries({
            queryKey: ['notifications'],
          })
          void present()
        }
        source.onerror = () => {
          source?.close()
          if (active) retry = setTimeout(() => void connect(), 2000)
        }
      } catch (cause) {
        if (
          cause instanceof ApiError && [401, 403, 404].includes(cause.status)
        ) return
        if (active) retry = setTimeout(() => void connect(), 5000)
      }
    }
    const focus = () => void present()
    document.addEventListener('visibilitychange', focus)
    globalThis.addEventListener('focus', focus)
    void connect()
    return () => {
      active = false
      source?.close()
      clearTimeout(retry)
      document.removeEventListener('visibilitychange', focus)
      globalThis.removeEventListener('focus', focus)
    }
  }, [accountID])
  const item = queue[0]
  return (
    <>
      {children}
      {item
        ? (
          <AchievementToast
            key={item.sequence}
            item={item}
            accountID={accountID}
            dismiss={() => setQueue((current) => current.slice(1))}
          />
        )
        : null}
    </>
  )
}

function AchievementToast(
  { item, accountID, dismiss }: {
    item: Presentation
    accountID: string
    dismiss: () => void
  },
) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovered || focused
  const remaining = useRef(6000)
  const dismissRef = useRef(dismiss)
  dismissRef.current = dismiss
  useEffect(() => {
    if (item.audible) playSound('achievement', `${accountID}:${item.sequence}`)
  }, [accountID, item])
  useEffect(() => {
    if (paused) return
    const start = performance.now()
    const timer = setTimeout(() => dismissRef.current(), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - start),
      )
    }
  }, [paused])
  return (
    <div
      role='status'
      aria-live='polite'
      className='fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-(--border-soft) bg-(--background) shadow-lg md:bottom-6 md:right-6'
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false)
        }
      }}
    >
      <Link
        to={`/settings/achievements#${item.achievement.id}`}
        target='_blank'
        rel='noopener noreferrer'
        className='block rounded-xl p-5 pr-9 focus-visible:outline-2 focus-visible:outline-(--accent)'
      >
        <span className='block text-sm font-semibold'>
          {item.achievement.title}
        </span>
        {item.achievement.flavor
          ? (
            <span className='mt-1.5 block text-sm italic text-(--foreground-subtle)'>
              {item.achievement.flavor}
            </span>
          )
          : null}
      </Link>
      <button
        type='button'
        aria-label='关闭成就提示'
        onClick={dismiss}
        className='absolute right-1 top-1 h-8 w-8 rounded text-(--foreground-muted) hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent)'
      >
        ×
      </button>
    </div>
  )
}
