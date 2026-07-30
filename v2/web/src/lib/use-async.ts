import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '../api/client'

export interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => void
}

export function messageOf(error: unknown, fallback = '加载失败'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useAsync<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let live = true
    setLoading(true)
    setError(null)
    load()
      .then((value) => {
        if (live) setData(value)
      })
      .catch((cause: unknown) => {
        if (live) setError(messageOf(cause))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [...deps, nonce])

  // Stable identity: effects list `reload` in deps; a per-render closure would
  // re-fire them every render and reload() itself renders — an update cycle.
  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, error, loading, reload }
}
