import type {
  LeaderboardEntry,
  Scenario,
  TournamentDetail,
  TournamentListItem,
} from '@axiia/shared'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  getLeaderboard,
  getScenario,
  getTournament,
  getTournaments,
} from '../lib/api'

export function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [tournamentDetail, setTournamentDetail] =
    useState<TournamentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)

  const selectedTournamentId =
    Number(searchParams.get('tournament') ?? 0) || null
  const activeRound =
    tournamentDetail?.rounds.find(
      (round) => round.roundNumber === tournamentDetail.currentRound,
    ) ??
    tournamentDetail?.rounds.at(-1) ??
    null
  const activeRoundPairings = activeRound
    ? [...activeRound.matches].reduce<
        Array<{
          leftSubmissionId: number
          matches: Array<(typeof activeRound.matches)[number]>
          pairKey: string
          rightSubmissionId: number
        }>
      >((items, match) => {
        const leftSubmissionId = Math.min(match.subAId, match.subBId)
        const rightSubmissionId = Math.max(match.subAId, match.subBId)
        const pairKey = `${leftSubmissionId}-${rightSubmissionId}`
        const existing = items.find((item) => item.pairKey === pairKey)

        if (existing) {
          existing.matches.push(match)
          return items
        }

        items.push({
          leftSubmissionId,
          matches: [match],
          pairKey,
          rightSubmissionId,
        })

        return items
      }, [])
    : []
  const playersBySubmissionId = new Map(
    leaderboard.map((entry) => [entry.submissionId, entry]),
  )

  const getPlayerName = (submissionId: number) =>
    playersBySubmissionId.get(submissionId)?.playerName ??
    `submission #${submissionId}`

  const getRoleLabel = (side: 'a' | 'b') => {
    if (side === 'a') {
      return scenario ? `角色 A · ${scenario.roleAName}` : '角色 A'
    }

    return scenario ? `角色 B · ${scenario.roleBName}` : '角色 B'
  }

  const formatMatchSide = (submissionId: number, side: 'a' | 'b') =>
    `${getPlayerName(submissionId)} · ${getRoleLabel(side)}`

  const openPlayerDetail = (submissionId: number) => {
    if (!selectedTournamentId) {
      return
    }

    void navigate(
      `/leaderboard/tournaments/${selectedTournamentId}/players/${submissionId}`,
    )
  }

  useEffect(() => {
    const loadTournamentList = async () => {
      try {
        const tournamentList = await getTournaments()
        setTournaments(tournamentList)

        if (!selectedTournamentId && tournamentList[0]) {
          setSearchParams(
            { tournament: String(tournamentList[0].id) },
            { replace: true },
          )
        } else if (tournamentList.length === 0) {
          setIsLoading(false)
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : '加载赛事失败',
        )
        setIsLoading(false)
      }
    }

    void loadTournamentList()
  }, [selectedTournamentId, setSearchParams])

  useEffect(() => {
    if (!selectedTournamentId) {
      return
    }

    let cancelled = false
    let timeoutId: number | null = null
    let hasLoadedScenario = false

    const loadData = async (isInitial: boolean) => {
      const loadId = ++latestLoadIdRef.current

      try {
        if (isInitial) {
          setIsLoading(true)
          setError(null)
        }

        const [leaderboardResponse, tournamentResponse] = await Promise.all([
          getLeaderboard(selectedTournamentId),
          getTournament(selectedTournamentId),
        ])

        if (cancelled || loadId !== latestLoadIdRef.current) return

        if (!hasLoadedScenario) {
          const scenarioResponse = await getScenario(
            tournamentResponse.scenarioId,
          )
          if (cancelled || loadId !== latestLoadIdRef.current) return
          setScenario(scenarioResponse)
          hasLoadedScenario = true
        }

        setError(null)
        setLeaderboard(leaderboardResponse)
        setTournamentDetail(tournamentResponse)
      } catch (loadError) {
        if (cancelled || loadId !== latestLoadIdRef.current) return
        if (isInitial) {
          setScenario(null)
          setError(
            loadError instanceof Error ? loadError.message : '加载排行榜失败',
          )
        }
      } finally {
        if (!cancelled && loadId === latestLoadIdRef.current && isInitial) {
          setIsLoading(false)
        }
      }
    }

    const poll = async (isInitial: boolean) => {
      await loadData(isInitial)

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
  }, [selectedTournamentId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Leaderboard</p>
          <h1 className="page-title">排行榜</h1>
          <p className="page-subtitle">
            按胜场和 Buchholz
            小分排序。点击选手行进入该选手的赛事详情页，查看全部对局与角色分配。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tournamentDetail ? (
            <Badge
              tone={tournamentDetail.status === 'finished' ? 'success' : 'info'}
            >
              {tournamentDetail.status === 'finished'
                ? `已结束 · ${tournamentDetail.totalRounds} 轮`
                : `Round ${tournamentDetail.currentRound} / ${tournamentDetail.totalRounds}`}
            </Badge>
          ) : null}
          <select
            className="app-input min-w-[220px]"
            value={selectedTournamentId ?? ''}
            onChange={(event) =>
              setSearchParams({ tournament: event.target.value })
            }
          >
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                #{tournament.id} · {tournament.scenarioTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>瑞士轮战绩</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[
                'leaderboard-skeleton-1',
                'leaderboard-skeleton-2',
                'leaderboard-skeleton-3',
                'leaderboard-skeleton-4',
                'leaderboard-skeleton-5',
              ].map((key) => (
                <div
                  key={key}
                  className="h-14 animate-pulse rounded bg-white/6"
                />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
              暂无排行榜数据。
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                <tr className="border-b border-[var(--border-soft)]">
                  <th className="pb-3">排名</th>
                  <th className="pb-3">选手</th>
                  <th className="pb-3">模型</th>
                  <th className="pb-3">胜</th>
                  <th className="pb-3">负</th>
                  <th className="pb-3">Buchholz</th>
                  <th className="pb-3">胜率</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.submissionId}
                    className="cursor-pointer border-b border-[var(--border-soft)] transition last:border-b-0 hover:bg-white/3"
                    onClick={() => openPlayerDetail(entry.submissionId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openPlayerDetail(entry.submissionId)
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="py-4 font-mono text-base font-bold text-[var(--foreground)]">
                      #{entry.rank}
                    </td>
                    <td className="py-4 font-semibold text-[var(--foreground)]">
                      {entry.playerName}
                    </td>
                    <td className="py-4 text-[var(--foreground-subtle)]">
                      {entry.modelLabel}
                    </td>
                    <td className="py-4 font-mono text-[var(--foreground)]">
                      {entry.wins}
                    </td>
                    <td className="py-4 font-mono text-[var(--foreground)]">
                      {entry.losses}
                    </td>
                    <td className="py-4 font-mono text-[var(--foreground-subtle)]">
                      {entry.buchholz.toFixed(1)}
                    </td>
                    <td className="py-4 font-mono text-[var(--foreground-subtle)]">
                      {entry.winRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>当前轮次</CardTitle>
          {activeRound ? (
            <Badge tone="info">Round {activeRound.roundNumber}</Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {!activeRound ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
              当前赛事还没有轮次数据。
            </div>
          ) : activeRoundPairings.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
              当前轮次还没有生成 pairing。
            </div>
          ) : (
            activeRoundPairings.map((pairing) => (
              <div
                key={pairing.pairKey}
                className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {getPlayerName(pairing.leftSubmissionId)} vs{' '}
                      {getPlayerName(pairing.rightSubmissionId)}
                    </p>
                    <p className="text-sm text-[var(--foreground-subtle)]">
                      本轮共 {pairing.matches.length} 场正反手对局
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {pairing.matches.map((match) => (
                      <Link
                        key={match.id}
                        className="inline-flex flex-col items-start gap-2 rounded-2xl border border-[var(--border-soft)] px-4 py-3 text-xs text-[var(--foreground-subtle)] transition hover:border-[rgba(224,74,47,0.28)] hover:bg-[rgba(224,74,47,0.06)] hover:text-[var(--foreground)]"
                        to={`/matches/${match.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>Match #{match.id}</span>
                          <Badge
                            tone={
                              match.status === 'scored'
                                ? 'success'
                                : match.status === 'error'
                                  ? 'warning'
                                  : 'info'
                            }
                          >
                            {match.status}
                          </Badge>
                        </div>
                        <span>
                          {formatMatchSide(match.subAId, 'a')} vs{' '}
                          {formatMatchSide(match.subBId, 'b')}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
