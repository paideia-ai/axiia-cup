import type {
  AchievementEventDTO,
  AchievementEventsResponse,
  AchievementsResponse,
} from '../api/types'

export const ACHIEVEMENT_TOAST_FRESH_SECONDS = 120
export const ACHIEVEMENT_POLL_MS = 2000

export function isFreshAchievement(event: AchievementEventDTO, now: number) {
  return event.source === 'live' &&
    event.occurredAt <= now + 5 &&
    now - event.occurredAt <= ACHIEVEMENT_TOAST_FRESH_SECONDS
}

interface FeedOptions {
  snapshot: () => Promise<AchievementsResponse>
  events: (
    after: number,
    signal: AbortSignal,
  ) => Promise<AchievementEventsResponse>
  readCursor: () => number | null
  saveCursor: (cursor: number) => void
  receive: (events: AchievementEventDTO[]) => Promise<void>
}

// Snapshot and cursor are committed together by the server. Starting at that
// cursor avoids celebrating historical unlocks, without a snapshot/subscribe gap.
// A tab's saved cursor also covers a refresh or temporary disconnect; freshness
// and shared receipts decide which recovered events still merit a toast.
export function startAchievementFeed(options: FeedOptions) {
  const controller = new AbortController()
  let cursor: number | null = null
  let pending = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const tick = async () => {
    if (pending || controller.signal.aborted) return
    pending = true
    try {
      if (cursor == null) {
        const snapshot = await options.snapshot()
        if (controller.signal.aborted) return
        const saved = options.readCursor()
        cursor = saved == null
          ? snapshot.eventCursor
          : Math.min(saved, snapshot.eventCursor)
        options.saveCursor(cursor)
      }
      const batch = await options.events(cursor, controller.signal)
      if (controller.signal.aborted) return
      const fresh = batch.events.filter((event) => event.id > cursor!)
        .sort((left, right) => left.id - right.id)
      if (fresh.length) await options.receive(fresh)
      if (controller.signal.aborted) return
      cursor = Math.max(cursor, batch.cursor, ...fresh.map((event) => event.id))
      options.saveCursor(cursor)
    } catch {
      // Keep the last committed cursor. Neither a failed read nor a failed
      // delivery acknowledges events; a later poll can recover them.
    } finally {
      pending = false
      if (!controller.signal.aborted) {
        timer = setTimeout(tick, ACHIEVEMENT_POLL_MS)
      }
    }
  }
  void tick()
  return {
    refresh: () => {
      if (pending) return
      clearTimeout(timer)
      void tick()
    },
    stop: () => {
      controller.abort()
      clearTimeout(timer)
    },
  }
}

export function readAchievementCursor(accountID: string): number | null {
  try {
    const raw = sessionStorage.getItem(
      `axiia-achievement-cursor-v1:${accountID}`,
    )
    const value = raw == null ? NaN : Number(raw)
    return Number.isSafeInteger(value) && value >= 0 ? value : null
  } catch {
    return null
  }
}

export function saveAchievementCursor(accountID: string, cursor: number) {
  try {
    sessionStorage.setItem(
      `axiia-achievement-cursor-v1:${accountID}`,
      String(cursor),
    )
  } catch {
    /* Polling still has an in-memory cursor when storage is unavailable. */
  }
}

const memoryReceipts = new Set<string>()

// The receipt belongs to the account and immutable event, independently of its
// notification's read/deleted state. A Web Lock serializes simultaneous tabs.
export async function claimAchievementToast(
  accountID: string,
  eventID: number,
  eligible: () => boolean,
): Promise<boolean> {
  const identity = `${accountID}:${eventID}`
  const storageKey = `axiia-achievement-toasts-v1:${accountID}`
  const claim = () => {
    if (!eligible() || memoryReceipts.has(identity)) return false
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem(storageKey) ?? '[]',
      )
      const seen = Array.isArray(stored)
        ? stored.filter((id): id is number => Number.isSafeInteger(id))
        : []
      if (seen.includes(eventID)) return false
      localStorage.setItem(
        storageKey,
        JSON.stringify([...seen.slice(-511), eventID]),
      )
    } catch { /* Session-only fallback when browser storage is disabled. */ }
    memoryReceipts.add(identity)
    if (memoryReceipts.size > 2048) {
      memoryReceipts.delete(memoryReceipts.values().next().value!)
    }
    return true
  }
  if (globalThis.navigator?.locks) {
    try {
      return await navigator.locks.request('axiia-achievement-toast', claim)
    } catch {
      return false
    }
  }
  // Older browsers retain focus gating and persisted best-effort deduplication.
  return claim()
}
