import { useSyncExternalStore } from 'react'
import { type Entry, type RecordStats, settle } from './matchmaking'

type Outcome = 'win' | 'loss' | 'draw'
interface DemoMatch {
  matchID?: number
  entry: Entry
  opponent: Entry
  fixture: 'normal' | 'new'
  outcome: Outcome
  phase: 'watching' | 'result'
  round: number
}
interface Snapshot {
  records: Record<number, RecordStats>
  match: DemoMatch | null
}

// Demo execution belongs to the tab, not the page component. Navigating away
// must not cancel an already-started match. Production execution belongs to the
// server worker; these fictional records intentionally reset on full reload.
let snapshot: Snapshot = { records: {}, match: null }
const listeners = new Set<() => void>()
const publish = (next: Snapshot) => {
  snapshot = next
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const getDemoSnapshot = () => snapshot
export function useDemoMatch() {
  return useSyncExternalStore(subscribe, getDemoSnapshot)
}
export function currentDemoMatch() {
  return snapshot.match
}
export function clearDemoResult() {
  if (snapshot.match?.phase !== 'watching') {
    publish({ ...snapshot, match: null })
  }
}
export function startDemoMatch(
  entry: Entry,
  opponent: Entry,
  outcome: Outcome,
  created?: { matchID: number; startedAt: number },
  fixture: 'normal' | 'new' = 'normal',
) {
  if (snapshot.match?.phase === 'watching') return
  const match: DemoMatch = {
    matchID: created?.matchID,
    entry: { ...entry },
    opponent: { ...opponent },
    fixture,
    outcome,
    phase: 'watching',
    round: 0,
  }
  publish({ ...snapshot, match })
  // Negative keys isolate the empty-agent fixture, not different versions.
  const recordKey = fixture === 'new' ? -entry.agentID : entry.agentID
  const opponentRecordKey = fixture === 'new'
    ? -opponent.agentID
    : opponent.agentID
  const opponentOutcome = outcome === 'draw'
    ? 'draw'
    : outcome === 'win'
    ? 'loss'
    : 'win'
  const startedAt = created?.startedAt ?? Date.now()
  const timer = globalThis.setInterval(() => {
    const round = Math.min(3, Math.floor((Date.now() - startedAt) / 1500))
    if (round < 3) {
      publish({ ...snapshot, match: { ...match, round } })
      return
    }
    globalThis.clearInterval(timer)
    publish({
      records: {
        ...snapshot.records,
        [recordKey]: settle(match.entry, outcome),
        [opponentRecordKey]: settle(match.opponent, opponentOutcome),
      },
      match: { ...match, phase: 'result', round: 3 },
    })
  }, 250)
}
