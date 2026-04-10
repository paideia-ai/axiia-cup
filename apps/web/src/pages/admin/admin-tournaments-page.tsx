import { modelOptions } from '@axiia/shared'
import type {
  AdminErroredMatch,
  AdminPlayer,
  AdminScenario,
  AdminStats,
  TournamentDetail,
  TournamentListItem,
} from '@axiia/shared'
import { Lock } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import {
  getAdminErroredMatches,
  getAdminScenarios,
  getAdminStats,
  getAdminTournamentPlayers,
  getTournament,
  getTournaments,
  retryAdminMatch,
  startTournament,
} from '../../lib/api'

function buildLatestTournamentMap(tournaments: TournamentListItem[]) {
  const latest = new Map<string, TournamentListItem>()

  for (const tournament of tournaments) {
    if (!latest.has(tournament.scenarioId)) {
      latest.set(tournament.scenarioId, tournament)
    }
  }

  return latest
}

function buildMonitoredTournaments(tournaments: TournamentListItem[]) {
  const active = tournaments.filter(
    (tournament) => tournament.status !== 'finished',
  )
  const recentFinished = tournaments.filter(
    (tournament) => tournament.status === 'finished',
  )

  return [...active, ...recentFinished.slice(0, 3)]
}

function getTournamentStatusMeta(status: TournamentListItem['status']) {
  switch (status) {
    case 'open':
      return { label: '已开放', tone: 'info' as const }
    case 'running':
      return { label: '进行中', tone: 'warning' as const }
    case 'finished':
      return { label: '已结束', tone: 'success' as const }
  }
}

function getRoundStatusLabel(
  status: TournamentDetail['rounds'][number]['status'],
) {
  switch (status) {
    case 'pairing':
      return '配对中'
    case 'running':
      return '进行中'
    case 'done':
      return '已结束'
  }
}

function resolveModelLabel(modelId: string) {
  return modelOptions.find((option) => option.id === modelId)?.label ?? modelId
}

function getTournamentCurrentRound(
  tournament: TournamentListItem,
  detail: TournamentDetail | null | undefined,
) {
  const currentRoundNumber = detail?.currentRound ?? tournament.currentRound

  return (
    detail?.rounds.find((round) => round.roundNumber === currentRoundNumber) ??
    detail?.rounds.at(-1) ??
    null
  )
}

export function AdminTournamentsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [scenarios, setScenarios] = useState<AdminScenario[]>([])
  const [erroredMatches, setErroredMatches] = useState<AdminErroredMatch[]>([])
  const [playersByScenario, setPlayersByScenario] = useState<
    Record<string, AdminPlayer[]>
  >({})
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([])
  const [tournamentDetailsById, setTournamentDetailsById] = useState<
    Record<number, TournamentDetail>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
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
  const monitoredTournaments = useMemo(
    () => buildMonitoredTournaments(tournaments),
    [tournaments],
  )
  const scenarioTitleById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario.title])),
    [scenarios],
  )
  const erroredMatchCountByTournament = useMemo(() => {
    const counts = new Map<number, number>()

    for (const match of erroredMatches) {
      counts.set(match.tournamentId, (counts.get(match.tournamentId) ?? 0) + 1)
    }

    return counts
  }, [erroredMatches])
  const summaryCards = useMemo(
    () => [
      {
        label: '排队中',
        value: stats?.queued ?? 0,
        copy: '全局等待 worker 拉取。',
      },
      {
        label: '进行中',
        value: stats?.running ?? 0,
        copy: '全局异步执行或裁判评分中。',
      },
      {
        label: '已评分',
        value: stats?.scored ?? 0,
        copy: '全局已完成，可进入排行榜统计。',
      },
    ],
    [stats],
  )

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function loadTournamentsPageData(isInitial: boolean) {
    const loadId = ++latestLoadIdRef.current

    if (isInitial) {
      setIsLoading(true)
    }

    try {
      setError(null)

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

      const [monitoredTournamentEntries, playerEntries] = await Promise.all([
        Promise.allSettled(
          buildMonitoredTournaments(tournamentsResponse).map(
            async (tournament) => {
              const detail = await getTournament(tournament.id)

              return [tournament.id, detail] as const
            },
          ),
        ),
        Promise.all(
          scenariosResponse.map(
            async (scenario) =>
              [
                scenario.id,
                await getAdminTournamentPlayers(scenario.id),
              ] as const,
          ),
        ),
      ])

      if (loadId !== latestLoadIdRef.current) {
        return
      }

      const nextErroredMatches = [...erroredMatchesResponse].sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) || right.id - left.id,
      )

      setStats(statsResponse)
      setScenarios(scenariosResponse)
      setTournaments(tournamentsResponse)
      setErroredMatches(nextErroredMatches)
      setTournamentDetailsById(
        Object.fromEntries(
          monitoredTournamentEntries.flatMap((entry) =>
            entry.status === 'fulfilled' ? [entry.value] : [],
          ),
        ),
      )
      setPlayersByScenario(Object.fromEntries(playerEntries))
    } catch (loadError) {
      if (loadId !== latestLoadIdRef.current) {
        return
      }

      setError(
        loadError instanceof Error ? loadError.message : '加载赛事数据失败',
      )
    } finally {
      if (isInitial && loadId === latestLoadIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadTournamentsPageData(true)
  }, [])

  async function handleRefresh() {
    try {
      setIsRefreshing(true)
      await loadTournamentsPageData(false)
    } finally {
      setIsRefreshing(false)
    }
  }

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
      await loadTournamentsPageData(false)
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
      await loadTournamentsPageData(false)
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

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--foreground) shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-(--success)" />
          {toast}
        </div>
      ) : null}

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

      <Card>
        <CardHeader>
          <CardTitle>全局任务队列</CardTitle>
          <p className="mt-2 text-sm leading-6 text-(--foreground-subtle)">
            汇总所有 Tournament 的 worker 状态；下方赛事监控会展示具体轮次进度。
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 divide-y divide-(--border-soft) rounded-xl border border-(--border-soft) sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {summaryCards.map((stat) => (
              <div key={stat.label} className="px-5 py-4">
                <p className="panel-label">{stat.label}</p>
                <p className="mt-2 tabular-nums text-[2rem] font-black leading-none tracking-tight text-(--foreground)">
                  {isLoading ? (
                    <span className="text-(--foreground-muted)">—</span>
                  ) : (
                    String(stat.value).padStart(2, '0')
                  )}
                </p>
                <p className="mt-1.5 text-xs text-(--foreground-muted)">
                  {stat.copy}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-none pb-0 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>赛事监控</CardTitle>
            <p className="mt-2 text-sm leading-6 text-(--foreground-subtle)">
              展示当前进行中的 Tournament，以及最近结束的赛事，便于查看第 N
              轮进度与异常情况。
            </p>
          </div>
          <Badge
            tone={
              isLoading
                ? 'info'
                : monitoredTournaments.some(
                      (tournament) => tournament.status !== 'finished',
                    )
                  ? 'warning'
                  : 'info'
            }
          >
            {isLoading
              ? '同步中...'
              : `${monitoredTournaments.length} 个 Tournament`}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {isLoading ? (
            ['monitoring-skeleton-1', 'monitoring-skeleton-2'].map((key) => (
              <div
                key={key}
                className="h-[180px] animate-pulse rounded-xl bg-white/6"
              />
            ))
          ) : monitoredTournaments.length > 0 ? (
            monitoredTournaments.map((tournament) => {
              const detail = tournamentDetailsById[tournament.id]
              const currentRound = getTournamentCurrentRound(tournament, detail)
              const roundMatches = currentRound?.matches ?? []
              const completedMatches = roundMatches.filter(
                (match) => match.status === 'scored',
              ).length
              const runningMatches = roundMatches.filter(
                (match) =>
                  match.status === 'running' || match.status === 'judging',
              ).length
              const queuedMatches = roundMatches.filter(
                (match) => match.status === 'queued',
              ).length
              const erroredMatchCount =
                erroredMatchCountByTournament.get(tournament.id) ?? 0
              const statusMeta = getTournamentStatusMeta(tournament.status)

              return (
                <div
                  key={tournament.id}
                  className="rounded-xl border border-(--border-soft) bg-white/2 p-4 space-y-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="panel-title">{tournament.scenarioTitle}</p>
                      <p className="panel-copy">Tournament #{tournament.id}</p>
                    </div>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-(--border-soft) bg-[rgba(255,255,255,0.02)] px-4 py-3">
                      <p className="panel-label">当前轮次</p>
                      <p className="mt-2 text-base font-semibold text-(--foreground)">
                        第 {tournament.currentRound} / {tournament.totalRounds}{' '}
                        轮
                      </p>
                      <p className="panel-copy">
                        {tournament.status === 'finished'
                          ? '全部轮次已结束。'
                          : currentRound
                            ? `当前轮状态：${getRoundStatusLabel(currentRound.status)}`
                            : '等待当前轮详情同步。'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-(--border-soft) bg-[rgba(255,255,255,0.02)] px-4 py-3">
                      <p className="panel-label">进度</p>
                      <p className="mt-2 text-base font-semibold text-(--foreground)">
                        {completedMatches}/{roundMatches.length}
                      </p>
                      <p className="panel-copy">
                        {roundMatches.length > 0
                          ? `已完成 ${completedMatches} 场 · 排队 ${queuedMatches} 场 · 进行中 ${runningMatches} 场`
                          : currentRound
                            ? '当前轮暂无对局数据。'
                            : tournament.currentRound > 0
                              ? '等待当前轮详情同步。'
                              : '等待生成第 1 轮对局。'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-(--border-soft) bg-[rgba(255,255,255,0.02)] px-4 py-3">
                      <p className="panel-label">失败比赛</p>
                      <a
                        className="mt-2 inline-flex text-base font-semibold text-(--warning) transition hover:text-(--foreground)"
                        href="#errored-matches"
                      >
                        {erroredMatchCount} 场失败
                      </a>
                      <p className="panel-copy">点击跳转到下方失败比赛列表。</p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="xl:col-span-2 rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
              当前没有可监控的 Tournament。
            </p>
          )}
        </CardContent>
      </Card>

      <Card id="errored-matches">
        <CardHeader className="flex flex-col gap-3 border-none pb-0 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>失败的比赛</CardTitle>
            <p className="mt-2 text-sm leading-6 text-(--foreground-subtle)">
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
                  className="rounded-xl border border-(--border-soft) bg-white/2 p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
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
                    <div className="rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] px-4 py-3 text-sm leading-6 text-(--foreground-subtle)">
                      <p className="panel-label">错误信息</p>
                      <p>{match.error ?? '未记录错误信息'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link to={`/matches/${match.id}`}>
                      <Button size="sm" variant="secondary">
                        查看详情
                      </Button>
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
            <p className="rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
              当前没有失败的比赛。
            </p>
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
              <CardHeader className="grid gap-6 lg:grid-cols-[1fr_220px]">
                <div className="space-y-3">
                  <CardTitle>{scenario.title}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-(--foreground-subtle)">
                    {scenario.subject}
                  </p>
                </div>
                <div className="space-y-3">
                  <Badge tone="info">{players.length} 人已提交</Badge>
                  {scenario.locked ? (
                    <Badge className="gap-1" tone="warning">
                      <Lock size={12} />
                      已锁定
                    </Badge>
                  ) : null}
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
                        className="rounded-xl border border-(--border-soft) bg-white/2 p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="panel-title">{player.displayName}</p>
                          <p className="panel-copy">{player.email}</p>
                        </div>
                        <div className="text-right text-xs text-(--foreground-subtle)">
                          <p>A · {resolveModelLabel(player.modelA)}</p>
                          <p>B · {resolveModelLabel(player.modelB)}</p>
                          <p>
                            v{player.version} · sub #{player.submissionId}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
                      暂无有效提交。
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-(--border-soft) bg-white/2 p-4">
                    <p className="panel-label">比赛操作</p>
                    <p className="panel-copy">
                      {players.length < 2
                        ? '至少需要 2 个有效提交版本。'
                        : latestTournament
                          ? `上次 Tournament #${latestTournament.id} 已记录，可再次开始新比赛。`
                          : '将创建新的 Tournament，并生成第 1 轮配对。'}
                    </p>
                  </div>

                  <Link to={`/admin/scenarios/${scenario.id}`}>
                    <Button
                      className="mb-3 w-full"
                      disabled={scenario.locked}
                      variant="secondary"
                    >
                      {scenario.locked ? '比赛进行中，已锁定' : '编辑场景'}
                    </Button>
                  </Link>

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
