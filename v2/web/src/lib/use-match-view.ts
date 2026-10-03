import { useEffect } from 'react'
import { matches } from '../api/client'
import type { MatchSummary } from '../api/types'

export function useMatchView(
  matchID: number,
  summary: MatchSummary | undefined,
  ready: boolean,
) {
  const loadedID = summary?.id
  const viewed = summary?.viewed
  useEffect(() => {
    if (!ready || loadedID !== matchID || viewed !== false) return
    let sent = false
    const record = () => {
      if (sent || document.visibilityState !== 'visible') return
      sent = true
      // A failed write keeps the unread state; the next visit can retry.
      void matches.markViewed(matchID).catch(() => {})
    }
    record()
    document.addEventListener('visibilitychange', record)
    return () => document.removeEventListener('visibilitychange', record)
  }, [matchID, loadedID, viewed, ready])
}
