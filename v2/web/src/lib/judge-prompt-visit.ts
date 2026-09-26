import { useState, useSyncExternalStore } from 'react'

const CHANGED = 'axiia:judge-prompt-visit-changed'
const fallback = new Set<string>()

export function judgePromptVisitKey(accountID: string, scenarioID: string) {
  return `axiia:judge-prompt-visited:v1:${JSON.stringify([accountID, scenarioID])}`
}

function read(key: string | null) {
  if (!key) return false
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return fallback.has(key)
  }
}

function subscribe(listener: () => void) {
  globalThis.addEventListener('storage', listener)
  globalThis.addEventListener(CHANGED, listener)
  return () => {
    globalThis.removeEventListener('storage', listener)
    globalThis.removeEventListener(CHANGED, listener)
  }
}

// The prompt is a scenario-level reference. Once an account opens it in any
// agent for that scenario, the ripple is no longer needed, while the row stays.
export function useJudgePromptVisit(
  accountID: string | undefined,
  scenarioID: string,
) {
  const key = accountID && scenarioID
    ? judgePromptVisitKey(accountID, scenarioID)
    : null
  const [localVisited, setLocalVisited] = useState(false)
  const visited = useSyncExternalStore(subscribe, () => read(key), () => false)

  const markVisited = () => {
    if (!key) {
      setLocalVisited(true)
      return
    }
    fallback.add(key)
    try {
      localStorage.setItem(key, '1')
    } catch {
      /* Retain this session's preference if storage is unavailable. */
    }
    globalThis.dispatchEvent(new Event(CHANGED))
  }

  return { visited: key ? visited : localVisited, markVisited }
}
