import { useEffect, useState, useSyncExternalStore } from 'react'
import { builder } from '../api/client'

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

function write(key: string) {
  fallback.add(key)
  try {
    localStorage.setItem(key, '1')
  } catch {
    // Keep the in-memory state if storage is unavailable.
  }
  globalThis.dispatchEvent(new Event(CHANGED))
}

export function usePresetUsage(
  accountID: string | undefined,
  scenarioID: string,
  agentID: number,
) {
  const key = accountID && scenarioID
    ? presetUsageKey(accountID, scenarioID)
    : null
  const [localUsed, setLocalUsed] = useState(false)
  const used = useSyncExternalStore(subscribe, () => read(key), () => false)
  useEffect(() => {
    let active = true
    void builder.presetUsage(agentID).then((response) => {
      if (!active) return
      if (response.used) {
        if (key) write(key)
        else setLocalUsed(true)
      } else if (key && read(key)) {
        void builder.markPresetUsed(agentID).catch(() => {})
      }
    }).catch(() => {})
    return () => { active = false }
  }, [agentID, key])

  const markUsed = () => {
    if (key) write(key)
    else setLocalUsed(true)
    void builder.markPresetUsed(agentID).catch(() => {})
  }
  return { used: key ? used : localUsed, markUsed }
}
