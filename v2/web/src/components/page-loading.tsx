import type { HTMLAttributes } from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useIsFetching } from '@tanstack/react-query'

import { navigationCache } from '../lib/navigation-cache'
import { canRetainPageData } from '../lib/use-page-query'

export function PageLoading(
  { variant = 'list', ...props }: HTMLAttributes<HTMLDivElement> & {
    variant?: 'cards' | 'list' | 'detail'
  },
) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div
      {...props}
      className={`page-loading page-loading--${variant}`}
      role='status'
      aria-label='正在加载内容'
      data-visible={visible || undefined}
    >
      <span className='sr-only'>加载中…</span>
      <div className='page-loading-shapes' aria-hidden='true'>
        {Array.from({
          length: variant === 'cards' ? 4 : variant === 'detail' ? 2 : 5,
        }, (_, index) => (
          <div className='page-loading-block' key={index}>
            <span />
            <span />
            <span />
            {variant === 'cards' && (
              <>
                <span />
                <span />
                <span />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const subscribe = (listener: () => void) =>
  navigationCache.getQueryCache().subscribe(listener)
const failedRefreshes = () =>
  navigationCache.getQueryCache().getAll().filter((query) =>
    query.isActive() && query.state.data !== undefined &&
    query.state.status === 'error' && canRetainPageData(query.state.error)
  )
const failureSnapshot = () =>
  failedRefreshes().map((query) => query.queryHash).sort().join('|')

export function NavigationActivity() {
  const fetchingCount = useIsFetching({ type: 'active' }, navigationCache)
  const fetching = fetchingCount > 0
  const failures = useSyncExternalStore(
    subscribe,
    failureSnapshot,
    failureSnapshot,
  )
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!fetching) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(timer)
  }, [fetching])
  return (
    <>
      {fetching && visible && (
        <div
          className='navigation-activity'
          role='progressbar'
          aria-label='正在更新内容'
        />
      )}
      {failures && (
        <div className='navigation-refresh-error' role='status'>
          更新暂时失败，当前显示上次内容。
          <button
            type='button'
            onClick={() => {
              for (const query of failedRefreshes()) {
                void navigationCache.refetchQueries({
                  queryKey: query.queryKey,
                  exact: true,
                })
              }
            }}
          >
            重试
          </button>
        </div>
      )}
    </>
  )
}
