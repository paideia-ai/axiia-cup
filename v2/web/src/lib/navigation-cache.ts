import { QueryClient } from '@tanstack/react-query'
import type { MatchDetail, MatchListResponse } from '../api/types'

// Memory only: session changes discard both completed and in-flight queries.
// Mutable resources stay fresh for 10s; writes invalidate immediately.
export const navigationCache = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      gcTime: 5 * 60_000,
      retry: false,
      refetchOnWindowFocus: true,
    },
  },
})

let identity: string | null = null
let epoch = 0
let readEpoch = 0
export const navigationEpoch = () => epoch
export const navigationReadEpoch = () => readEpoch

export function resetNavigationCache() {
  epoch++
  readEpoch++
  navigationCache.clear()
}

export function setNavigationIdentity(next: string | null) {
  if (identity === next) return
  identity = next
  resetNavigationCache()
}

// Invalidate before the mutation promise resolves, including inactive pages.
// Cancel queries first so a pre-write response cannot replace post-write data.
export function invalidateNavigation(path: string) {
  // SSE completion can invalidate while a pre-completion HTTP read is pending.
  // A replacement query must not coalesce onto that obsolete request.
  readEpoch++
  const viewedMatch = /^\/matches\/(\d+)\/view$/.exec(path)
  if (viewedMatch) {
    const id = Number(viewedMatch[1])
    const lists = { queryKey: ['matches'] }
    const detail = { queryKey: ['match', id], exact: true }
    void navigationCache.cancelQueries(lists)
    void navigationCache.cancelQueries(detail)
    navigationCache.setQueriesData<MatchListResponse>(
      lists,
      (data) =>
        data && ({
          ...data,
          matches: data.matches.map((match) =>
            match.id === id ? { ...match, viewed: true } : match
          ),
        }),
    )
    navigationCache.setQueriesData<MatchDetail>(
      detail,
      (data) =>
        data && ({ ...data, summary: { ...data.summary, viewed: true } }),
    )
    void navigationCache.invalidateQueries(lists)
    return
  }
  const groups = path.startsWith('/agents')
    ? path.endsWith('/mutate')
      ? ['agent']
      : ['agent', 'inventory', 'catalog', 'standings']
    : /^\/(matches|challenges|rewards)/.test(path)
    ? ['matches', 'match', 'inventory', 'catalog', 'standings', 'tournaments']
    : path.startsWith('/achievements')
    ? ['achievements', 'notifications']
    : path.startsWith('/notifications')
    ? ['notifications']
    : path.startsWith('/admin')
    ? null
    : []
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      groups == null || groups.includes(String(query.queryKey[0])),
  }
  void navigationCache.cancelQueries(filters)
  void navigationCache.invalidateQueries(filters)
}
