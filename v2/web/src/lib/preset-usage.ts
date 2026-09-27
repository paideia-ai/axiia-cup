import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { auth } from '../api/client'
import type { PresetUsageResponse } from '../api/types'
import { navigationCache } from './navigation-cache'

// The server owns this account-and-scenario preference. Sharing one query per
// account keeps different agents and sides in sync without browser storage.
export function usePresetUsage(
  accountID: string | undefined,
  scenarioID: string,
) {
  const key = ['preset-usage', accountID] as const
  const [writeError, setWriteError] = useState<string | null>(null)
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => auth.presetUsage(signal),
    enabled: Boolean(accountID),
  }, navigationCache)

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
    used: Array.isArray(query.data?.scenarioIDs) &&
      query.data.scenarioIDs.includes(scenarioID),
    loading: Boolean(accountID) && query.isPending && query.isFetching,
    writeError,
    markUsed,
  }
}
