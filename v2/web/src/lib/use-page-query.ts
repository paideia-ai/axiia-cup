import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'

import { ApiError } from '../api/client'
import { navigationCache } from './navigation-cache'
import { messageOf } from './use-async'

// Network failures can retain a snapshot. A server denial or deleted resource
// must instead remove its content and actions from the screen.
export function canRetainPageData(error: unknown) {
  return !(error instanceof ApiError && [401, 403, 404].includes(error.status))
}

export function usePageQuery<T, K extends QueryKey>(
  options: UseQueryOptions<T, Error, T, K>,
) {
  useEffect(() => {
    navigationCache.mount()
    return () => navigationCache.unmount()
  }, [])
  const query = useQuery(options, navigationCache)
  const retainData = canRetainPageData(query.error)
  const reload = useCallback(() => {
    void query.refetch()
  }, [query.refetch])
  return {
    data: retainData ? query.data ?? null : null,
    loading: query.isPending && query.fetchStatus !== 'idle',
    error: (query.data === undefined || !retainData) && query.error
      ? messageOf(query.error)
      : null,
    refreshError: retainData && query.data !== undefined && query.error
      ? messageOf(query.error)
      : null,
    refreshing: query.isFetching && query.data !== undefined,
    reload,
  }
}
