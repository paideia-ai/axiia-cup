import { type PropsWithChildren, useCallback, useEffect, useState } from 'react'

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
  const [queue, setQueue] = useState<AchievementEventDTO[]>([])
  const dismiss = useCallback(() => setQueue((items) => items.slice(1)), [])

  useEffect(() => {
    let active = true
    const epoch = navigationEpoch()
    const current = () => active && epoch === navigationEpoch()
    const pending = new Map<number, AchievementEventDTO>()
    let delivering = false
    const canPresent = () =>
      current() && !document.hidden && document.hasFocus()
    const deliver = async () => {
      if (delivering || !canPresent()) return
      delivering = true
      try {
        for (const event of pending.values()) {
          if (!canPresent()) return
          if (!isFreshAchievement(event, Date.now() / 1000)) {
            pending.delete(event.id)
            continue
          }
          const claimed = await claimAchievementToast(
            accountID,
            event.id,
            () => canPresent() && isFreshAchievement(event, Date.now() / 1000),
          )
          if (!current()) return
          if (claimed) {
            pending.delete(event.id)
            setQueue((items) => [...items, event])
          } else if (canPresent()) {
            // Another foreground tab already owns the shared receipt.
            pending.delete(event.id)
          }
        }
      } finally {
        delivering = false
      }
    }
    const feed = startAchievementFeed({
      snapshot: () =>
        navigationCache.fetchQuery({
          ...achievementsQuery(accountID),
          staleTime: 0,
        }),
      events: achievements.events,
      readCursor: () => readAchievementCursor(accountID),
      saveCursor: (cursor) => saveAchievementCursor(accountID, cursor),
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
      {queue[0]
        ? (
          <AchievementToast
            key={queue[0].id}
            event={queue[0]}
            accountID={accountID}
            onDismiss={dismiss}
          />
        )
        : null}
    </>
  )
}
