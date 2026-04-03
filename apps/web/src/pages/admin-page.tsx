import type {
  AdminErroredMatch,
  AdminPlayer,
  AdminStats,
  Scenario,
  TournamentListItem,
} from '@axiia/shared'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  getAdminErroredMatches,
  getAdminScenarios,
  getAdminStats,
  getAdminTournamentPlayers,
  getTournaments,
  retryAdminMatch,
  startTournament,
} from '../lib/api'

function buildLatestTournamentMap(tournaments: TournamentListItem[]) {
  const latest = new Map<string, TournamentListItem>()

  for (const tournament of tournaments) {
    if (!latest.has(tournament.scenarioId)) {
      latest.set(tournament.scenarioId, tournament)
    }
  }

  return latest
}

export function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [erroredMatches, setErroredMatches] = useState<AdminErroredMatch[]>([])
  const [playersByScenario, setPlayersByScenario] = useState<
    Record<string, AdminPlayer[]>
  >({})
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startingScenarioId, setStartingScenarioId] = useState<string | null>(
    null,
  )
  const [retryingMatchIds, setRetryingMatchIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)

  const latestTournamentByScenario = useMemo(
    () => buildLatestTournamentMap(tournaments),
    [tournaments],
  )
  const scenarioTitleById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario.title])),
    [scenarios],
  )

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function loadAdminData(isInitial: boolean) {
    const loadId = ++latestLoadIdRef.current

    if (isInitial) {
      setIsLoading(true)
      setError(null)
    }

    try {
      const [
        statsResponse,
        scenariosResponse,
        tournamentsResponse,
        erroredMatchesResponse,
      ] = await Promise.all([
        getAdminStats(),
        getAdminScenarios(),
        getTournaments(),
        getAdminErroredMatches(),
      ])

      const playerEntries = await Promise.all(
        scenariosResponse.map(
          async (scenario) =>
            [
              scenario.id,
              await getAdminTournamentPlayers(scenario.id),
            ] as const,
        ),
      )

      if (loadId !== latestLoadIdRef.current) {
        return
      }

      const nextErroredMatches = [...erroredMatchesResponse].sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) || right.id - left.id,
      )

      setError(null)
      setStats(statsResponse)
      setScenarios(scenariosResponse)
      setErroredMatches(nextErroredMatches)
      setTournaments(tournamentsResponse)
      setPlayersByScenario(Object.fromEntries(playerEntries))
    } catch (loadError) {
      if (loadId !== latestLoadIdRef.current) {
        return
      }

      if (isInitial) {
        setError(
          loadError instanceof Error ? loadError.message : '加载管理面板失败',
        )
      }
    } finally {
      if (isInitial && loadId === latestLoadIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | null = null

    const poll = async (isInitial: boolean) => {
      await loadAdminData(isInitial)

      if (!cancelled) {
        timeoutId = window.setTimeout(() => {
          void poll(false)
        }, 5_000)
      }
    }

    void poll(true)

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  async function handleStartTournament(scenarioId: string) {
    try {
      setStartingScenarioId(scenarioId)
      setError(null)

      const result = await startTournament(scenarioId)
      const byeCopy =
        result.byeSubmissions.length > 0
          ? `，轮空 submission：${result.byeSubmissions.join(', ')}`
          : ''

      setToast(
        `Tournament #${result.tournament.id} 已创建，第 1 轮已生成${byeCopy}`,
      )
      await loadAdminData(true)
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : '开始比赛失败',
      )
    } finally {
      setStartingScenarioId(null)
    }
  }

  async function handleRetryMatch(matchId: number) {
    try {
      setRetryingMatchIds((current) => [...current, matchId])
      setError(null)

      await retryAdminMatch(matchId)
      setToast(`已将异常对局 #${matchId} 重新加入队列`)
      await loadAdminData(false)
    } catch (retryError) {
      setError(
        retryError instanceof Error ? retryError.message : '重试对局失败',
      )
    } finally {
      setRetryingMatchIds((current) =>
        current.filter((currentMatchId) => currentMatchId !== matchId),
      )
    }
  }

  const summaryCards = [
    { label: 'queued', value: stats?.queued ?? 0, copy: '等待 worker 拉取。' },
    { label: 'running', value: stats?.running ?? 0, copy: '后台异步执行中。' },
    { label: 'scored', value: stats?.scored ?? 0, copy: '可进入排行榜统计。' },
  ]

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-6 top-20 z-50 rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.12)] px-4 py-3 text-sm text-[var(--success)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">管理面板</h1>
          <p className="page-subtitle">
            只有管理员账号可见。可以查看场景报名情况并直接触发新比赛。
          </p>
        </div>
        <Badge tone="warning">admin only</Badge>
      </div>

      {error ? (
        <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>任务队列</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {summaryCards.map((stat) => (
            <div key={stat.label} className="app-panel">
              <p className="panel-label">{stat.label}</p>
              <p className="panel-title">
                {isLoading ? '--' : String(stat.value).padStart(2, '0')}
              </p>
              <p className="panel-copy">{stat.copy}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-none pb-0 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>失败的比赛</CardTitle>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-subtle)]">
              展示当前所有状态为 error 的对局，可直接重新入队。
            </p>
          </div>
          <Badge tone={erroredMatches.length > 0 ? 'warning' : 'success'}>
            {erroredMatches.length} 场失败
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {erroredMatches.length > 0 ? (
            erroredMatches.map((match) => {
              const isRetrying = retryingMatchIds.includes(match.id)

              return (
                <div
                  key={match.id}
                  className="app-panel flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="warning">对局 #{match.id}</Badge>
                      <Badge tone="info">
                        {match.scenarioTitle ||
                          scenarioTitleById.get(match.scenarioId) ||
                          match.scenarioId}
                      </Badge>
                      <Badge>
                        Tournament #{match.tournamentId} · 第{' '}
                        {match.roundNumber} 轮
                      </Badge>
                    </div>
                    <div>
                      <p className="panel-title">
                        {match.playerADisplayName} vs {match.playerBDisplayName}
                      </p>
                      <p className="panel-copy">
                        {match.playerAModel} vs {match.playerBModel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] px-4 py-3 text-sm leading-6 text-[var(--foreground-subtle)]">
                      <p className="panel-label">错误信息</p>
                      <p>{match.error ?? '未记录错误信息'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link
                      className="inline-flex h-8 items-center rounded-md border border-[var(--border-soft)] px-3 text-xs font-semibold text-[var(--foreground-subtle)] transition hover:bg-white/4 hover:text-[var(--foreground)]"
                      to={`/matches/${match.id}`}
                    >
                      查看详情
                    </Link>
                    <Button
                      disabled={isRetrying}
                      onClick={() => void handleRetryMatch(match.id)}
                      size="sm"
                    >
                      {isRetrying ? '重试中...' : '重试'}
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="app-panel">
              <p className="panel-copy">当前没有失败的比赛。</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {scenarios.map((scenario) => {
          const players = playersByScenario[scenario.id] ?? []
          const latestTournament =
            latestTournamentByScenario.get(scenario.id) ?? null
          const canStart = players.length >= 2 && startingScenarioId == null

          return (
            <Card key={scenario.id}>
              <CardHeader className="flex flex-col gap-3 border-none pb-0 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{scenario.title}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-subtle)]">
                    {scenario.context}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{scenario.subject}</Badge>
                  <Badge tone="info">{players.length} 人已提交</Badge>
                  {latestTournament ? (
                    <Badge
                      tone={
                        latestTournament.status === 'finished'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      Tournament #{latestTournament.id} ·{' '}
                      {latestTournament.status === 'finished'
                        ? `已结束 (${latestTournament.totalRounds} 轮)`
                        : `第 ${latestTournament.currentRound} / ${latestTournament.totalRounds} 轮`}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="grid gap-6 lg:grid-cols-[1fr_220px]">
                <div className="space-y-3">
                  <p className="panel-label">最新参赛版本</p>
                  {players.length > 0 ? (
                    players.map((player) => (
                      <div
                        key={player.submissionId}
                        className="app-panel flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="panel-title">{player.displayName}</p>
                          <p className="panel-copy">{player.email}</p>
                        </div>
                        <div className="text-right text-xs text-[var(--foreground-subtle)]">
                          <p>{player.model}</p>
                          <p>
                            v{player.version} · sub #{player.submissionId}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="app-panel">
                      <p className="panel-copy">暂无有效提交。</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="app-panel">
                    <p className="panel-label">比赛操作</p>
                    <p className="panel-copy">
                      {players.length < 2
                        ? '至少需要 2 个有效提交版本。'
                        : latestTournament
                          ? `上次 Tournament #${latestTournament.id} 已记录，可再次开始新比赛。`
                          : '将创建新的 Tournament，并生成第 1 轮配对。'}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!canStart}
                    onClick={() => void handleStartTournament(scenario.id)}
                  >
                    {startingScenarioId === scenario.id
                      ? '启动中...'
                      : '开始比赛'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
