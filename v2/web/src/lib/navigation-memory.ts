import type { NavigationType } from 'react-router-dom'

export interface ScrollPosition {
  y: number
  anchor?: { id: string; top: number }
}

export interface Visit {
  key: string
  url: string
  position?: ScrollPosition
}

export interface NavigationMemory {
  visits: Visit[]
  index: number
}

const LIMIT = 100
export const NAVIGATION_STORAGE_KEY = 'axiia.navigation.v1'

export function readNavigationMemory(scope: string): NavigationMemory {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(NAVIGATION_STORAGE_KEY) ?? 'null',
    )
    if (
      saved?.scope === scope && Array.isArray(saved.visits) &&
      saved.visits.length <= LIMIT && Number.isInteger(saved.index) &&
      saved.index >= 0 && saved.index < saved.visits.length &&
      saved.visits.every((visit: Visit) =>
        typeof visit.key === 'string' && typeof visit.url === 'string' &&
        /^\/(?!\/)/.test(visit.url) &&
        (visit.position == null || (
          Number.isFinite(visit.position.y) && visit.position.y >= 0 &&
          (visit.position.anchor == null || (
            typeof visit.position.anchor.id === 'string' &&
            Number.isFinite(visit.position.anchor.top)
          ))
        ))
      )
    ) return { visits: saved.visits, index: saved.index }
  } catch {
    // Storage can be disabled; navigation still works for this mounted app.
  }
  return { visits: [], index: -1 }
}

export function saveNavigationMemory(scope: string, memory: NavigationMemory) {
  try {
    sessionStorage.setItem(
      NAVIGATION_STORAGE_KEY,
      JSON.stringify({ scope, ...memory }),
    )
  } catch {
    // In-memory restoration remains available when storage is full or blocked.
  }
}

export function recordVisit(
  memory: NavigationMemory,
  visit: Visit,
  action: NavigationType,
): NavigationMemory {
  const known = memory.visits.findIndex((item) =>
    item.key === visit.key && item.url === visit.url
  )
  if (known >= 0) return { ...memory, index: known }
  let visits: Visit[]
  if (action === 'PUSH' && memory.index >= 0) {
    visits = [...memory.visits.slice(0, memory.index + 1), visit]
  } else if (action === 'REPLACE' && memory.index >= 0) {
    visits = [...memory.visits]
    visits[memory.index] = visit
    return { visits, index: memory.index }
  } else {
    // An unknown POP/deep link gives us no proof about the preceding history.
    visits = [visit]
  }
  visits = visits.slice(-LIMIT)
  return { visits, index: visits.length - 1 }
}
