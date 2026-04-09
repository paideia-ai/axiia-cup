import type { AdminMonitorUser } from '@axiia/shared'
import { Eye } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useImpersonation } from '../../context/impersonation'
import { getAdminMonitorUsers } from '../../lib/api'
import { formatTimeAgo } from '../../lib/datetime'

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

export function AdminMonitorPage() {
  const navigate = useNavigate()
  const { startImpersonation } = useImpersonation()
  const [monitorUsers, setMonitorUsers] = useState<AdminMonitorUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)

  async function loadMonitorUsers(isInitial: boolean) {
    const loadId = ++latestLoadIdRef.current

    if (isInitial) {
      setIsLoading(true)
    }

    try {
      setError(null)
      const response = await getAdminMonitorUsers()

      if (loadId !== latestLoadIdRef.current) {
        return
      }

      setMonitorUsers(response)
    } catch (loadError) {
      if (loadId !== latestLoadIdRef.current) {
        return
      }

      setError(
        loadError instanceof Error ? loadError.message : '加载监控数据失败',
      )
    } finally {
      if (isInitial && loadId === latestLoadIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadMonitorUsers(true)
  }, [])

  async function handleRefresh() {
    try {
      setIsRefreshing(true)
      await loadMonitorUsers(false)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          disabled={isLoading || isRefreshing}
          onClick={() => void handleRefresh()}
          size="sm"
          variant="secondary"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </Button>
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      {isLoading ? (
        <div className="h-[200px] animate-pulse rounded-xl bg-white/6" />
      ) : monitorUsers.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-(--border-soft)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border-soft) bg-white/3 text-left text-xs text-(--foreground-subtle)">
                <th className="px-4 py-3 font-medium">选手</th>
                <th className="px-4 py-3 font-medium text-right">提交</th>
                <th className="px-4 py-3 font-medium text-right">Playground</th>
                <th className="px-4 py-3 font-medium text-right">比赛</th>
                <th className="px-4 py-3 font-medium text-right">输入 Token</th>
                <th className="px-4 py-3 font-medium text-right">输出 Token</th>
                <th className="px-4 py-3 font-medium text-right">总 Token</th>
                <th className="px-4 py-3 font-medium text-right">最近活跃</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {monitorUsers.map((user) => (
                <tr
                  key={user.userId}
                  className={`border-b border-(--border-soft) last:border-b-0 transition hover:bg-white/3 ${user.isOverSoftCap ? 'bg-[rgba(251,191,36,0.06)]' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-(--foreground)">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-(--foreground-subtle)">
                          {user.email}
                        </p>
                      </div>
                      {user.disabled ? (
                        <Badge tone="warning">禁用</Badge>
                      ) : null}
                      {user.isOverSoftCap ? (
                        <Badge tone="warning">超限</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {user.submissionCount}
                    {user.latestVersion != null ? (
                      <span className="ml-1 text-xs text-(--foreground-subtle)">
                        v{user.latestVersion}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {user.playgroundRunCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {user.matchCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {formatTokenCount(user.totalPromptTokens)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {formatTokenCount(user.totalCompletionTokens)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-semibold ${user.isOverSoftCap ? 'text-(--warning)' : 'text-(--foreground)'}`}
                  >
                    {formatTokenCount(user.totalTokens)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-(--foreground-subtle)">
                    {user.lastActiveAt
                      ? formatTimeAgo(user.lastActiveAt)
                      : '--'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => {
                        startImpersonation(user.userId, user.displayName)
                        navigate('/dashboard')
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      模拟
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
          暂无选手数据。
        </p>
      )}
    </div>
  )
}
