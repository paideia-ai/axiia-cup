import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { flushSync } from 'react-dom'

import { achievements } from '../api/client'
import type { AchievementEventDTO } from '../api/types'
import { AchievementToast } from '../components/achievement-toast'
import {
  claimAchievementToast,
  isFreshAchievement,
  readAchievementCursor,
  saveAchievementCursor,
  startAchievementFeed,
} from '../lib/achievement-feed'
import {
  invalidateNavigation,
  navigationCache,
  navigationEpoch,
} from '../lib/navigation-cache'
import { achievementsQuery } from '../lib/navigation-queries'

// Mounted with key=accountID. A late response or a queued Web Lock from the
// previous account cannot show its private achievement in the next session.
export function AchievementsProvider(
  { accountID, children }: PropsWithChildren<{ accountID: string }>,
) {
  const [shown, setShown] = useState<AchievementEventDTO | null>(null)
  const dismissRef = useRef<() => void>(() => {})
  const dismiss = useCallback(() => dismissRef.current(), [])

  useEffect(() => {
    let active = true
    const epoch = navigationEpoch()
    const current = () => active && epoch === navigationEpoch()
    const pending = new Map<number, AchievementEventDTO>()
    const queued = new Set<number>()
    let delivering = false
    let presenting = false
    let receivedCursor: number | null = null
    const checkpoint = () => {
      if (!current() || receivedCursor == null) return
      let cursor = receivedCursor
      for (const event of pending.values()) {
        if (
          !queued.has(event.id) && !isFreshAchievement(event, Date.now() / 1000)
        ) {
          pending.delete(event.id)
        } else {
          cursor = Math.min(cursor, event.id - 1)
        }
      }
      // Polling can advance in memory; reload must replay every unshown event.
      saveAchievementCursor(accountID, cursor)
    }
    const canPresent = () =>
      current() && !document.hidden && document.hasFocus()
    const deliver = async () => {
      if (!canPresent()) return
      for (const event of pending.values()) {
        if (isFreshAchievement(event, Date.now() / 1000)) queued.add(event.id)
      }
      if (delivering || presenting) return
      delivering = true
      try {
        for (const event of pending.values()) {
          if (!canPresent()) return
          if (!queued.has(event.id)) {
            pending.delete(event.id)
            continue
          }
          const claim = await claimAchievementToast(
            accountID,
            event.id,
            canPresent,
            () => {
              flushSync(() => setShown(event))
              presenting = true
            },
          )
          if (!current()) return
          if (claim === 'deferred') return
          pending.delete(event.id)
          queued.delete(event.id)
          if (claim === 'presented') break
        }
      } catch {
        // A rejected lock/presentation keeps the event available for the next poll.
      } finally {
        delivering = false
        checkpoint()
      }
    }
    dismissRef.current = () => {
      if (!current()) return
      presenting = false
      setShown(null)
      void deliver()
    }
    const feed = startAchievementFeed({
      snapshot: () =>
        navigationCache.fetchQuery({
          ...achievementsQuery(accountID),
          staleTime: 0,
        }),
      events: achievements.events,
      readCursor: () => readAchievementCursor(accountID),
      saveCursor: (cursor) => {
        receivedCursor = cursor
        checkpoint()
        void deliver()
      },
      receive: async (events) => {
        if (!current()) return
        invalidateNavigation('/achievements')
        for (const event of events) {
          if (isFreshAchievement(event, Date.now() / 1000)) {
            pending.set(event.id, event)
          }
        }
        await deliver()
      },
    })
    const refresh = () => {
      if (!document.hidden) {
        feed.refresh()
        void deliver()
      }
    }
    globalThis.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      feed.stop()
      globalThis.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [accountID])

  return (
    <>
      {children}
      {shown
        ? (
          <AchievementToast
            key={shown.id}
            event={shown}
            accountID={accountID}
            onDismiss={dismiss}
          />
        )
        : null}
    </>
  )
}
