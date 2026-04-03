import type {
  AdminErroredMatch,
  AdminPlayer,
  AdminStats,
  AdminUser,
  Scenario,
  TournamentDetail,
  TournamentListItem,
} from '@axiia/shared'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  getAdminErroredMatches,
  getAdminRegistrationCode,
  getAdminScenarios,
  getAdminStats,
  getAdminTournamentPlayers,
  getAdminUsers,
  getTournament,
  getTournaments,
  resetAdminUserPassword,
  retryAdminMatch,
  startTournament,
  toggleAdminUserDisabled,
  updateAdminRegistrationCode,
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

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type AdminTab = 'tournaments' | 'players' | 'settings'

export function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [erroredMatches, setErroredMatches] = useState<AdminErroredMatch[]>([])
  const [playersByScenario, setPlayersByScenario] = useState<
    Record<string, AdminPlayer[]>
  >({})
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([])
  const [tournamentDetailsById, setTournamentDetailsById] = useState<
    Record<number, TournamentDetail>
  >({})
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [registrationCode, setRegistrationCode] = useState<string | null>(null)
  const [registrationCodeDraft, setRegistrationCodeDraft] = useState('')
  const [isEditingRegistrationCode, setIsEditingRegistrationCode] =
    useState(false)
  const [isSavingRegistrationCode, setIsSavingRegistrationCode] =
    useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(
    null,
  )
  const [resetPasswordDraft, setResetPasswordDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [startingScenarioId, setStartingScenarioId] = useState<string | null>(
    null,
  )
  const [retryingMatchIds, setRetryingMatchIds] = useState<number[]>([])
  const [togglingUserIds, setTogglingUserIds] = useState<number[]>([])
  const [resettingUserIds, setResettingUserIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('tournaments')
  const isEditingRegistrationCodeRef = useRef(false)
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

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    isEditingRegistrationCodeRef.current = isEditingRegistrationCode
  }, [isEditingRegistrationCode])

  async function loadAdminData(isInitial: boolean) {
    const loadId = ++latestLoadIdRef.current

    if (isInitial) {
      setIsLoading(true)
      setError(null)
    }

    try {
      const [
        registrationCodeResponse,
        statsResponse,
        scenariosResponse,
        tournamentsResponse,
        erroredMatchesResponse,
        adminUsersResponse,
      ] = await Promise.all([
        getAdminRegistrationCode(),
        getAdminStats(),
        getAdminScenarios(),
        getTournaments(),
        getAdminErroredMatches(),
        getAdminUsers(),
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

      setError(null)
      setRegistrationCode(registrationCodeResponse.code)
      if (!isEditingRegistrationCodeRef.current) {
        setRegistrationCodeDraft(registrationCodeResponse.code)
      }
      setStats(statsResponse)
      setScenarios(scenariosResponse)
      setErroredMatches(nextErroredMatches)
      setAdminUsers(adminUsersResponse)
      setTournaments(tournamentsResponse)
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

  function handleEditRegistrationCode() {
    setRegistrationCodeDraft(registrationCode ?? '')
    setIsEditingRegistrationCode(true)
  }

  function handleCancelRegistrationCodeEdit() {
    setRegistrationCodeDraft(registrationCode ?? '')
    setIsEditingRegistrationCode(false)
  }

  async function handleSaveRegistrationCode() {
    try {
      setIsSavingRegistrationCode(true)
      setError(null)

      const result = await updateAdminRegistrationCode({
        code: registrationCodeDraft,
      })

      setRegistrationCode(result.code)
      setRegistrationCodeDraft(result.code)
      setIsEditingRegistrationCode(false)
      setToast('邀请码已更新')
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : '保存邀请码失败',
      )
    } finally {
      setIsSavingRegistrationCode(false)
    }
  }

  function handleOpenResetPassword(userId: number) {
    setResetPasswordUserId(userId)
    setResetPasswordDraft('')
  }

  function handleCancelResetPassword() {
    setResetPasswordUserId(null)
    setResetPasswordDraft('')
  }

  async function handleToggleUserDisabled(user: AdminUser) {
    if (user.isAdmin) {
      return
    }

    try {
      setTogglingUserIds((current) =>
        current.includes(user.id) ? current : [...current, user.id],
      )
      setError(null)

      const updatedUser = await toggleAdminUserDisabled(user.id)

      setAdminUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === updatedUser.id ? updatedUser : currentUser,
        ),
      )
      setToast(
        `${updatedUser.displayName} 已${updatedUser.disabled ? '禁用' : '启用'}`,
      )
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : '更新用户状态失败',
      )
    } finally {
      setTogglingUserIds((current) =>
        current.filter((currentUserId) => currentUserId !== user.id),
      )
    }
  }

  async function handleResetPassword(user: AdminUser) {
    if (resetPasswordDraft.length < 6) {
      setError('新密码至少需要 6 位')
      return
    }

    try {
      setResettingUserIds((current) =>
        current.includes(user.id) ? current : [...current, user.id],
      )
      setError(null)

      await resetAdminUserPassword(user.id, {
        password: resetPasswordDraft,
      })

      handleCancelResetPassword()
      setToast(`${user.displayName} 的密码已重置`)
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : '重置密码失败',
      )
    } finally {
      setResettingUserIds((current) =>
        current.filter((currentUserId) => currentUserId !== user.id),
      )
    }
  }

  const summaryCards = [
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

      <Tabs
        onValueChange={(value) => setActiveTab(value as AdminTab)}
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="tournaments">赛事</TabsTrigger>
          <TabsTrigger value="players">选手</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="settings">
          <Card>
            <CardHeader>
              <CardTitle>邀请码</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="app-panel flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="panel-label">当前邀请码</p>
                  {isEditingRegistrationCode ? (
                    <>
                      <input
                        autoFocus
                        className="app-input w-full bg-[rgba(255,255,255,0.04)] font-mono tracking-[0.2em] placeholder:text-[var(--foreground-subtle)] md:max-w-md"
                        onChange={(event) =>
                          setRegistrationCodeDraft(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === 'Enter' &&
                            registrationCodeDraft.trim().length > 0
                          ) {
                            void handleSaveRegistrationCode()
                          }
                        }}
                        placeholder="输入新的邀请码"
                        value={registrationCodeDraft}
                      />
                      <p className="text-xs text-[var(--foreground-subtle)]">
                        修改后点击保存立即生效。
                      </p>
                    </>
                  ) : (
                    <p className="panel-title break-all font-mono tracking-[0.2em]">
                      {isLoading ? '--' : (registrationCode ?? '--')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {isEditingRegistrationCode ? (
                    <>
                      <Button
                        disabled={
                          isSavingRegistrationCode ||
                          registrationCodeDraft.trim().length === 0
                        }
                        onClick={() => void handleSaveRegistrationCode()}
                        size="sm"
                      >
                        {isSavingRegistrationCode ? '保存中...' : '保存'}
                      </Button>
                      <Button
                        disabled={isSavingRegistrationCode}
                        onClick={handleCancelRegistrationCodeEdit}
                        size="sm"
                        variant="secondary"
                      >
                        取消
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled={isLoading}
                      onClick={handleEditRegistrationCode}
                      size="sm"
                      variant="secondary"
                    >
                      修改
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="players">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-none pb-0 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>选手管理</CardTitle>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-subtle)]">
                  查看用户状态、禁用普通账号，并为指定账号重置密码。
                </p>
              </div>
              <Badge tone="info">
                {isLoading ? '同步中...' : `${adminUsers.length} 位用户`}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                [
                  'users-skeleton-1',
                  'users-skeleton-2',
                  'users-skeleton-3',
                ].map((key) => (
                  <div
                    key={key}
                    className="h-[132px] animate-pulse rounded-xl bg-white/6"
                  />
                ))
              ) : adminUsers.length > 0 ? (
                adminUsers.map((user) => {
                  const isEditingResetPassword = resetPasswordUserId === user.id
                  const isResettingPassword = resettingUserIds.includes(user.id)
                  const isTogglingUser = togglingUserIds.includes(user.id)

                  return (
                    <div key={user.id} className="app-panel space-y-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="panel-title">{user.displayName}</p>
                            {user.isAdmin ? (
                              <Badge tone="warning">管理员</Badge>
                            ) : null}
                            <Badge tone={user.disabled ? 'warning' : 'success'}>
                              {user.disabled ? '已禁用' : '启用中'}
                            </Badge>
                          </div>
                          <p className="panel-copy">{user.email}</p>
                          <p className="text-xs text-[var(--foreground-subtle)]">
                            创建时间 · {formatDateTime(user.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                          {!user.isAdmin ? (
                            <Button
                              disabled={isResettingPassword || isTogglingUser}
                              onClick={() =>
                                void handleToggleUserDisabled(user)
                              }
                              size="sm"
                              variant="secondary"
                            >
                              {isTogglingUser
                                ? '处理中...'
                                : user.disabled
                                  ? '启用'
                                  : '禁用'}
                            </Button>
                          ) : (
                            <span className="text-xs text-[var(--foreground-subtle)]">
                              管理员账号不可禁用
                            </span>
                          )}

                          {!isEditingResetPassword ? (
                            <Button
                              disabled={isResettingPassword || isTogglingUser}
                              onClick={() => handleOpenResetPassword(user.id)}
                              size="sm"
                              variant="ghost"
                            >
                              重置密码
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {isEditingResetPassword ? (
                        <form
                          className="flex flex-col gap-3 md:flex-row md:items-center"
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleResetPassword(user)
                          }}
                        >
                          <input
                            className="app-input md:max-w-sm"
                            onChange={(event) =>
                              setResetPasswordDraft(event.target.value)
                            }
                            placeholder="输入不少于 6 位的新密码"
                            type="password"
                            value={resetPasswordDraft}
                          />
                          <Button
                            disabled={
                              isResettingPassword ||
                              resetPasswordDraft.length < 6
                            }
                            size="sm"
                            type="submit"
                          >
                            {isResettingPassword ? '确认中...' : '确认'}
                          </Button>
                          <Button
                            disabled={isResettingPassword}
                            onClick={handleCancelResetPassword}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            取消
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <div className="app-panel">
                  <p className="panel-copy">暂无用户数据。</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>全局任务队列</CardTitle>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-subtle)]">
                汇总所有 Tournament 的 worker
                状态；下方赛事监控会展示具体轮次进度。
              </p>
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
                <CardTitle>赛事监控</CardTitle>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-subtle)]">
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
                ['monitoring-skeleton-1', 'monitoring-skeleton-2'].map(
                  (key) => (
                    <div
                      key={key}
                      className="h-[180px] animate-pulse rounded-xl bg-white/6"
                    />
                  ),
                )
              ) : monitoredTournaments.length > 0 ? (
                monitoredTournaments.map((tournament) => {
                  const detail = tournamentDetailsById[tournament.id]
                  const currentRound = getTournamentCurrentRound(
                    tournament,
                    detail,
                  )
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
                    <div key={tournament.id} className="app-panel space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="panel-title">
                            {tournament.scenarioTitle}
                          </p>
                          <p className="panel-copy">
                            Tournament #{tournament.id}
                          </p>
                        </div>
                        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                          <p className="panel-label">当前轮次</p>
                          <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                            第 {tournament.currentRound} /{' '}
                            {tournament.totalRounds} 轮
                          </p>
                          <p className="panel-copy">
                            {tournament.status === 'finished'
                              ? '全部轮次已结束。'
                              : currentRound
                                ? `当前轮状态：${getRoundStatusLabel(currentRound.status)}`
                                : '等待当前轮详情同步。'}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                          <p className="panel-label">进度</p>
                          <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
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

                        <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                          <p className="panel-label">失败比赛</p>
                          <a
                            className="mt-2 inline-flex text-base font-semibold text-[var(--warning)] transition hover:text-[var(--foreground)]"
                            href="#errored-matches"
                          >
                            {erroredMatchCount} 场失败
                          </a>
                          <p className="panel-copy">
                            点击跳转到下方失败比赛列表。
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="app-panel xl:col-span-2">
                  <p className="panel-copy">当前没有可监控的 Tournament。</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="errored-matches">
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
                            {match.playerADisplayName} vs{' '}
                            {match.playerBDisplayName}
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
                              <p className="panel-title">
                                {player.displayName}
                              </p>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
