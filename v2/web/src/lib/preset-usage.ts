import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { auth } from '../api/client'
import type { PresetUsageResponse } from '../api/types'
import { navigationCache } from './navigation-cache'

const LEGACY_PREFIX = 'axiia:preset-used:v1:'
const migrations = new Map<string, Promise<PresetUsageResponse>>()

// The previous release stored confirmed use in the browser. Keep its exact
// account/scenario key so an existing player does not see the main button again
// while that one-time record is being copied to the server.
export function presetUsageKey(accountID: string, scenarioID: string) {
  return `${LEGACY_PREFIX}${JSON.stringify([accountID, scenarioID])}`
}

function hasLegacyUsage(key: string | null): boolean {
  if (!key) return false
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function legacyUsageRecords(accountID: string) {
  const records: { key: string; scenarioID: string }[] = []
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (!key?.startsWith(LEGACY_PREFIX) || localStorage.getItem(key) !== '1') {
        continue
      }
      try {
        const pair = JSON.parse(key.slice(LEGACY_PREFIX.length))
        if (
          Array.isArray(pair) && pair.length === 2 &&
          pair[0] === accountID && typeof pair[1] === 'string' && pair[1]
        ) {
          records.push({ key, scenarioID: pair[1] })
        }
      } catch {
        // Ignore malformed keys without skipping other legacy records.
      }
    }
  } catch {
    // Storage may be unavailable.
  }
  return records
}

function clearLegacyUsage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // The server now has the record; a blocked storage API needs no cleanup.
  }
}

function migrateLegacyUsage(key: string, scenarioID: string) {
  let pending = migrations.get(key)
  if (!pending) {
    pending = auth.markPresetUsed({ scenarioID })
    migrations.set(key, pending)
    void pending.then(
      () => migrations.delete(key),
      () => migrations.delete(key),
    )
  }
  return pending
}

// The server owns this account-and-scenario preference. Sharing one query per
// account keeps different agents and sides in sync. Browser storage is read
// only to migrate a confirmed record left by the previous implementation.
export function usePresetUsage(
  accountID: string | undefined,
  scenarioID: string,
) {
  const key = ['preset-usage', accountID] as const
  const legacyKey = accountID && scenarioID
    ? presetUsageKey(accountID, scenarioID)
    : null
  const legacyUsed = hasLegacyUsage(legacyKey)
  const [writeError, setWriteError] = useState<string | null>(null)
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => auth.presetUsage(signal),
    enabled: Boolean(accountID),
  }, navigationCache)

  useEffect(() => {
    if (!accountID || !query.isSuccess) return

    let mounted = true
    // Migrate every old scenario for this account on its first builder visit,
    // even when the player enters a different scenario after upgrading.
    for (const record of legacyUsageRecords(accountID)) {
      if (query.data.scenarioIDs.includes(record.scenarioID)) continue
      void migrateLegacyUsage(record.key, record.scenarioID).then(
        (response) => {
          navigationCache.setQueryData<PresetUsageResponse>(key, (previous) => ({
            scenarioIDs: [
              ...new Set([
                ...(previous?.scenarioIDs ?? []),
                ...response.scenarioIDs,
                record.scenarioID,
              ]),
            ],
          }))
          clearLegacyUsage(record.key)
          void navigationCache.invalidateQueries({ queryKey: key })
          if (mounted) setWriteError(null)
        },
        () => {
          if (mounted) {
            setWriteError('旧预设策略使用记录未同步，请稍后重试。')
          }
        },
      )
    }
    return () => {
      mounted = false
    }
  }, [accountID, query.isSuccess, query.data])

  const markUsed = async () => {
    if (!accountID || !scenarioID) return
    setWriteError(null)
    void navigationCache.cancelQueries({ queryKey: key })
    const previous = navigationCache.getQueryData<PresetUsageResponse>(key)
    const priorIDs = Array.isArray(previous?.scenarioIDs)
      ? previous.scenarioIDs
      : []
    navigationCache.setQueryData<PresetUsageResponse>(key, {
      scenarioIDs: [...new Set([...priorIDs, scenarioID])],
    })
    try {
      navigationCache.setQueryData(
        key,
        await auth.markPresetUsed({ scenarioID }),
      )
      void navigationCache.invalidateQueries({ queryKey: key })
    } catch {
      navigationCache.setQueryData(key, previous)
      void navigationCache.invalidateQueries({ queryKey: key })
      setWriteError('预设策略使用记录未保存，请稍后重试。')
    }
  }

  return {
    used: legacyUsed ||
      (Array.isArray(query.data?.scenarioIDs) &&
        query.data.scenarioIDs.includes(scenarioID)),
    loading: Boolean(accountID) && query.isPending && query.isFetching &&
      !legacyUsed,
    writeError,
    markUsed,
  }
}
