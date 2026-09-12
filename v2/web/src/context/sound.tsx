import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'

import { matches } from '../api/client'
import type { MatchSummary } from '../api/types'
import { clearSoundMatches, MatchCompletionTracker } from '../lib/match-sound'
import { installSoundListeners } from '../lib/sound'
import { useOptionalAuth } from './auth'

// Shared with BattleStrip: one account-scoped foreground poll survives route
// changes and supplies both completion sounds and the strip's unchanged rows.
const MatchFeed = createContext<MatchSummary[] | null | undefined>(undefined)
export function useSoundMatchFeed() {
  return useContext(MatchFeed)
}

export function SoundProvider({ children }: PropsWithChildren) {
  const auth = useOptionalAuth()
  const accountID = auth?.account?.id ?? null
  const [rows, setRows] = useState<MatchSummary[] | null>(null)
  useEffect(installSoundListeners, [])
  useEffect(() => {
    setRows(null)
    clearSoundMatches()
    if (accountID == null) return
    const tracker = new MatchCompletionTracker()
    let active = true
    let pending = false
    let silentResync = false
    let visibilityGeneration = 0
    const load = async () => {
      if (document.hidden || pending) return
      pending = true
      const audible = !silentResync
      const startedGeneration = visibilityGeneration
      silentResync = false
      try {
        const response = await matches.list()
        if (!active) return
        tracker.observe(
          response.matches,
          audible && !document.hidden &&
            startedGeneration === visibilityGeneration,
        )
        setRows(response.matches)
      } catch {
        if (active) setRows(null)
      } finally {
        pending = false
      }
    }
    void load()
    const timer = setInterval(() => void load(), 30_000)
    const visibility = () => {
      visibilityGeneration++
      silentResync = true
      if (!document.hidden) void load()
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [accountID])
  return <MatchFeed.Provider value={rows}>{children}</MatchFeed.Provider>
}
