import type { AchievementDTO } from '../api/types'

export function freshAchievementEvents(
  rows: AchievementDTO[],
  after: number,
  now: number,
) {
  return rows.filter((row) =>
    row.id && row.eventID != null && row.eventID > after &&
    row.earnedAt != null && now - row.earnedAt < 60
  )
    .sort((a, b) => a.eventID! - b.eventID!)
}

export async function claimAchievementToast(
  account: string,
  event: number,
): Promise<boolean> {
  const key = `axiia-achievement-toasts:${account}`
  const claim = () => {
    if (document.hidden || !document.hasFocus()) return false
    try {
      const data: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
      const seen = Array.isArray(data)
        ? data.filter((id): id is number => typeof id === 'number')
        : []
      if (seen.includes(event)) return false
      localStorage.setItem(key, JSON.stringify([...seen.slice(-127), event]))
    } catch { /* The focused tab still owns this session's queue. */ }
    return true
  }
  return navigator.locks ? await navigator.locks.request(key, claim) : claim()
}
