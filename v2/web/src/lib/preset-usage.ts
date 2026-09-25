import { useState, useSyncExternalStore } from 'react'

const CHANGED = 'axiia:preset-usage-changed'
const fallback = new Set<string>()

export function presetUsageKey(accountID: string, scenarioID: string) {
  return `axiia:preset-used:v1:${JSON.stringify([accountID, scenarioID])}`
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

// Browser-local preference, isolated by account and scenario, shared across
// agents/sides/tabs. A blocked storage API still works for the current session.
export function usePresetUsage(
  accountID: string | undefined,
  scenarioID: string,
) {
  const key = accountID && scenarioID
    ? presetUsageKey(accountID, scenarioID)
    : null
  const [localUsed, setLocalUsed] = useState(false)
  const used = useSyncExternalStore(subscribe, () => read(key), () => false)
  const markUsed = () => {
    if (!key) {
      setLocalUsed(true)
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
  return { used: key ? used : localUsed, markUsed }
}
