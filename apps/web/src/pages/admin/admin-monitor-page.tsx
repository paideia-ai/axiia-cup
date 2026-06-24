import type { AdminLlmLatencyReport, AdminMonitorUser } from '@axiia/shared'
import { Activity, Eye } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectItem } from '../../components/ui/select'
import { useImpersonation } from '../../context/impersonation'
import { getAdminLlmLatencyReport, getAdminMonitorUsers } from '../../lib/api'
import { formatTimeAgo } from '../../lib/datetime'

type LatencyFilters = {
  from: string
  model: string
  phase: string
  provider: string
  scenarioId: string
  source: 'all' | 'playground' | 'tournament'
  to: string
}

const DEFAULT_LATENCY_FILTERS: LatencyFilters = {
  from: '',
  model: 'all',
  phase: 'all',
  provider: 'all',
  scenarioId: 'all',
  source: 'all',
  to: '',
}

const phaseLabels: Record<string, string> = {
  dialogue: '对话',
  examination: '问询',
  judgment: '裁判',
  scoring: '计分',
}

const sideLabels: Record<string, string> = {
  a: 'A',
  b: 'B',
  judge: '裁判',
  scorer: '计分',
}

const sourceLabels: Record<LatencyFilters['source'], string> = {
  all: '全部',
  playground: 'Playground',
  tournament: '赛事',
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

function formatDuration(ms: number): string {
  if (ms >= 60_000) {
    const minutes = Math.floor(ms / 60_000)
    const seconds = Math.round((ms % 60_000) / 1000)
    return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
  }

  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(ms >= 10_000 ? 1 : 2)}秒`
  }

  return `${Math.round(ms)}ms`
}

function localDateTimeToIso(value: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date.toISOString()
}

function formatAbsoluteTime(value: string | null) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date)
}

export function AdminMonitorPage() {
  const navigate = useNavigate()
  const { startImpersonation } = useImpersonation()
  const [monitorUsers, setMonitorUsers] = useState<AdminMonitorUser[]>([])
  const [latencyFilters, setLatencyFilters] = useState<LatencyFilters>(
    DEFAULT_LATENCY_FILTERS,
  )
  const [latencyReport, setLatencyReport] =
    useState<AdminLlmLatencyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)

  const latencySummary = useMemo(() => {
    if (!latencyReport || latencyReport.aggregates.length === 0) {
      return {
        avgDurationMs: 0,
        callCount: 0,
        modelCount: 0,
        p95DurationMs: 0,
        runCount: 0,
        totalDurationMs: 0,
      }
    }

    const callCount = latencyReport.aggregates.reduce(
      (sum, row) => sum + row.callCount,
      0,
    )
    const totalDurationMs = latencyReport.aggregates.reduce(
      (sum, row) => sum + row.totalDurationMs,
      0,
    )
    const modelCount = new Set(
      latencyReport.aggregates.map(
        (row) => `${row.provider}:${row.model}:${row.phase}`,
      ),
    ).size

    return {
      avgDurationMs: callCount > 0 ? totalDurationMs / callCount : 0,
      callCount,
      modelCount,
      p95DurationMs: Math.max(
        ...latencyReport.aggregates.map((row) => row.p95DurationMs),
      ),
      runCount: latencyReport.aggregates.reduce(
        (sum, row) => sum + row.runCount,
        0,
      ),
      totalDurationMs,
    }
  }, [latencyReport])

  const loadMonitorData = useCallback(
    async (isInitial: boolean) => {
      const loadId = ++latestLoadIdRef.current

      if (isInitial) {
        setIsLoading(true)
      }

      try {
        setError(null)
        const [usersResponse, latencyResponse] = await Promise.all([
          getAdminMonitorUsers(),
          getAdminLlmLatencyReport({
            from: localDateTimeToIso(latencyFilters.from),
            model:
              latencyFilters.model === 'all' ? undefined : latencyFilters.model,
            phase:
              latencyFilters.phase === 'all' ? undefined : latencyFilters.phase,
            provider:
              latencyFilters.provider === 'all'
                ? undefined
                : latencyFilters.provider,
            scenarioId:
              latencyFilters.scenarioId === 'all'
                ? undefined
                : latencyFilters.scenarioId,
            source: latencyFilters.source,
            to: localDateTimeToIso(latencyFilters.to),
          }),
        ])

        if (loadId !== latestLoadIdRef.current) {
          return
        }

        setMonitorUsers(usersResponse)
        setLatencyReport(latencyResponse)
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
    },
    [latencyFilters],
  )

  useEffect(() => {
    void loadMonitorData(true)
  }, [loadMonitorData])

  async function handleRefresh() {
    try {
      setIsRefreshing(true)
      await loadMonitorData(false)
    } finally {
      setIsRefreshing(false)
    }
  }

  function updateLatencyFilter<K extends keyof LatencyFilters>(
    key: K,
    value: LatencyFilters[K],
  ) {
    setLatencyFilters((current) => ({ ...current, [key]: value }))
  }

  function resetLatencyFilters() {
    setLatencyFilters(DEFAULT_LATENCY_FILTERS)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-(--foreground)">
            LLM 耗时监控
          </h2>
          <p className="text-sm text-(--foreground-subtle)">
            按场景、阶段、模型汇总已完成运行的成功调用。
          </p>
        </div>
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-1 text-xs text-(--foreground-subtle)">
          来源
          <Select
            value={latencyFilters.source}
            onValueChange={(value) =>
              updateLatencyFilter(
                'source',
                (value ?? 'all') as LatencyFilters['source'],
              )
            }
            renderValue={(value) =>
              sourceLabels[value as LatencyFilters['source']] ?? value
            }
          >
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="playground">Playground</SelectItem>
            <SelectItem value="tournament">赛事</SelectItem>
          </Select>
        </label>
        <label className="space-y-1 text-xs text-(--foreground-subtle)">
          场景
          <Select
            value={latencyFilters.scenarioId}
            onValueChange={(value) =>
              updateLatencyFilter('scenarioId', value ?? 'all')
            }
            renderValue={(value) =>
              value === 'all'
                ? '全部'
                : (latencyReport?.options.scenarios.find(
                    (scenario) => scenario.id === value,
                  )?.title ?? value)
            }
          >
            <SelectItem value="all">全部</SelectItem>
            {latencyReport?.options.scenarios.map((scenario) => (
              <SelectItem key={scenario.id} value={scenario.id}>
                {scenario.title}
              </SelectItem>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs text-(--foreground-subtle)">
          阶段
          <Select
            value={latencyFilters.phase}
            onValueChange={(value) =>
              updateLatencyFilter('phase', value ?? 'all')
            }
            renderValue={(value) =>
              value === 'all' ? '全部' : (phaseLabels[value] ?? value)
            }
          >
            <SelectItem value="all">全部</SelectItem>
            {latencyReport?.options.phases.map((phase) => (
              <SelectItem key={phase} value={phase}>
                {phaseLabels[phase]}
              </SelectItem>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs text-(--foreground-subtle)">
          Provider
          <Select
            value={latencyFilters.provider}
            onValueChange={(value) =>
              updateLatencyFilter('provider', value ?? 'all')
            }
          >
            <SelectItem value="all">全部</SelectItem>
            {latencyReport?.options.providers.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider}
              </SelectItem>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs text-(--foreground-subtle)">
          模型
          <Select
            value={latencyFilters.model}
            onValueChange={(value) =>
              updateLatencyFilter('model', value ?? 'all')
            }
          >
            <SelectItem value="all">全部</SelectItem>
            {latencyReport?.options.models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </Select>
        </label>
        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={resetLatencyFilters}
            size="sm"
            variant="ghost"
          >
            重置
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-4 py-3">
          <p className="text-xs text-(--foreground-subtle)">成功调用</p>
          <p className="mt-1 text-xl font-semibold text-(--foreground)">
            {latencySummary.callCount}
          </p>
        </div>
        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-4 py-3">
          <p className="text-xs text-(--foreground-subtle)">平均耗时</p>
          <p className="mt-1 text-xl font-semibold text-(--foreground)">
            {formatDuration(latencySummary.avgDurationMs)}
          </p>
        </div>
        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-4 py-3">
          <p className="text-xs text-(--foreground-subtle)">最高 P95</p>
          <p className="mt-1 text-xl font-semibold text-(--foreground)">
            {formatDuration(latencySummary.p95DurationMs)}
          </p>
        </div>
        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-4 py-3">
          <p className="text-xs text-(--foreground-subtle)">累计模型时间</p>
          <p className="mt-1 text-xl font-semibold text-(--foreground)">
            {formatDuration(latencySummary.totalDurationMs)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs text-(--foreground-subtle)">
          开始时间
          <Input
            type="datetime-local"
            value={latencyFilters.from}
            onChange={(event) =>
              updateLatencyFilter('from', event.currentTarget.value)
            }
          />
        </label>
        <label className="space-y-1 text-xs text-(--foreground-subtle)">
          结束时间
          <Input
            type="datetime-local"
            value={latencyFilters.to}
            onChange={(event) =>
              updateLatencyFilter('to', event.currentTarget.value)
            }
          />
        </label>
      </div>

      {isLoading ? (
        <div className="h-[220px] animate-pulse rounded-lg bg-white/6" />
      ) : latencyReport && latencyReport.aggregates.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-(--border-soft)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border-soft) bg-white/3 text-left text-xs text-(--foreground-subtle)">
                <th className="px-4 py-3 font-medium">场景</th>
                <th className="px-4 py-3 font-medium">阶段</th>
                <th className="px-4 py-3 font-medium">模型</th>
                <th className="px-4 py-3 font-medium text-right">调用</th>
                <th className="px-4 py-3 font-medium text-right">Avg</th>
                <th className="px-4 py-3 font-medium text-right">P50</th>
                <th className="px-4 py-3 font-medium text-right">P95</th>
                <th className="px-4 py-3 font-medium text-right">Max</th>
                <th className="px-4 py-3 font-medium text-right">总耗时</th>
              </tr>
            </thead>
            <tbody>
              {latencyReport.aggregates.map((row) => (
                <tr
                  key={`${row.scenarioId}:${row.phase}:${row.provider}:${row.model}`}
                  className="border-b border-(--border-soft) last:border-b-0 transition hover:bg-white/3"
                >
                  <td className="px-4 py-3 text-(--foreground)">
                    {row.scenarioTitle}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="info">{phaseLabels[row.phase]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[180px] items-center gap-2">
                      <Activity className="h-3.5 w-3.5 shrink-0 text-(--foreground-subtle)" />
                      <div>
                        <p className="font-medium text-(--foreground)">
                          {row.model}
                        </p>
                        <p className="text-xs text-(--foreground-subtle)">
                          {row.provider}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {row.callCount}
                    <span className="ml-1 text-xs text-(--foreground-subtle)">
                      / {row.runCount} run
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {formatDuration(row.avgDurationMs)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {formatDuration(row.p50DurationMs)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-(--foreground)">
                    {formatDuration(row.p95DurationMs)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {formatDuration(row.maxDurationMs)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                    {formatDuration(row.totalDurationMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
          暂无符合条件的 LLM 耗时数据。
        </p>
      )}

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-(--foreground)">
          最近成功调用
        </h3>
        {latencyReport && latencyReport.calls.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-(--border-soft)">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--border-soft) bg-white/3 text-left text-xs text-(--foreground-subtle)">
                  <th className="px-4 py-3 font-medium">Run</th>
                  <th className="px-4 py-3 font-medium">场景</th>
                  <th className="px-4 py-3 font-medium">阶段</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 font-medium">模型</th>
                  <th className="px-4 py-3 font-medium text-right">耗时</th>
                  <th className="px-4 py-3 font-medium text-right">Token</th>
                  <th className="px-4 py-3 font-medium text-right">完成</th>
                </tr>
              </thead>
              <tbody>
                {latencyReport.calls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-(--border-soft) last:border-b-0 transition hover:bg-white/3"
                  >
                    <td className="px-4 py-3 tabular-nums text-(--foreground)">
                      {call.source === 'tournament' ? '赛事' : 'PG'} #
                      {call.runId}
                    </td>
                    <td className="px-4 py-3 text-(--foreground)">
                      {call.scenarioTitle}
                    </td>
                    <td className="px-4 py-3 text-(--foreground-subtle)">
                      {phaseLabels[call.phase]}
                    </td>
                    <td className="px-4 py-3 text-(--foreground-subtle)">
                      {sideLabels[call.side]}
                    </td>
                    <td className="px-4 py-3 text-(--foreground)">
                      {call.model}
                      <span className="ml-2 text-xs text-(--foreground-subtle)">
                        {call.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-(--foreground)">
                      {formatDuration(call.durationMs)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-(--foreground)">
                      {formatTokenCount(
                        call.promptTokens + call.completionTokens,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-(--foreground-subtle)">
                      {formatAbsoluteTime(call.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
            暂无最近调用。
          </p>
        )}
      </div>

      <div className="pt-2">
        <h3 className="mb-3 text-base font-semibold text-(--foreground)">
          选手用量
        </h3>
      </div>

      {isLoading ? (
        <div className="h-[200px] animate-pulse rounded-lg bg-white/6" />
      ) : monitorUsers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-(--border-soft)">
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
        <p className="rounded-lg border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
          暂无选手数据。
        </p>
      )}
    </div>
  )
}
