import type { AchievementEventDTO } from '../api/types'

export async function claimAchievementPresentation(
  accountID: string,
  event: AchievementEventDTO,
): Promise<boolean> {
  const key = `axiia-achievement-presented-v1:${accountID}`
  const claim = () => {
    if (document.hidden || !document.hasFocus()) return false
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
      const seen: number[] = Array.isArray(raw)
        ? raw.filter((id): id is number => Number.isSafeInteger(id))
        : []
      if (seen.includes(event.sequence)) return false
      localStorage.setItem(
        key,
        JSON.stringify([...seen.slice(-127), event.sequence]),
      )
    } catch {
      /* The current session still deduplicates through its event cursor. */
    }
    return true
  }
  return navigator.locks ? await navigator.locks.request(key, claim) : claim()
}
