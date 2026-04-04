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
import { Select, SelectItem } from '../components/ui/select'

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
    if (side === 'a') return scenario ? scenario.roleAName : '—'
    return scenario ? scenario.roleBName : '—'
  }
  const formatMatchSide = (submissionId: number, side: 'a' | 'b') =>
    `${getPlayerName(submissionId)} · ${getRoleLabel(side)}`
  const openPlayerDetail = (submissionId: number) => {
    if (!selectedTournamentId) return
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
    if (!selectedTournamentId) return

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
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [selectedTournamentId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Leaderboard</p>
          <h1 className="page-title">排行榜</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tournamentDetail ? (
            <Badge
              tone={tournamentDetail.status === 'finished' ? 'success' : 'info'}
            >
              {tournamentDetail.status === 'finished'
                ? `已结束 · ${tournamentDetail.totalRounds} 轮`
                : `Round ${tournamentDetail.currentRound} / ${tournamentDetail.totalRounds}`}
            </Badge>
          ) : null}
          {/* <Select
            value={selectedTournamentId ? String(selectedTournamentId) : ''}
            onValueChange={(v) => {
              if (v) setSearchParams({ tournament: v })
            }}
            placeholder="选择赛事…"
          >
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                #{t.id} · {t.scenarioTitle}
              </SelectItem>
            ))}
          </Select> */}
        </div>
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>瑞士轮战绩</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {['a', 'b', 'c', 'd', 'e'].map((k) => (
                <div
                  key={k}
                  className="h-14 animate-pulse rounded bg-white/6"
                />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
              暂无排行榜数据。
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.14em] text-(--foreground-muted)">
                <tr className="border-b border-(--border-soft)">
                  <th className="pb-3 pr-6">排名</th>
                  <th className="pb-3 pr-6">选手</th>
                  <th className="pb-3 pr-6">模型</th>
                  <th className="pb-3 pr-4">胜</th>
                  <th className="pb-3 pr-4">负</th>
                  <th className="pb-3 pr-4">Buchholz</th>
                  <th className="pb-3">胜率</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.submissionId}
                    className="cursor-pointer border-b border-(--border-soft) transition last:border-b-0 hover:bg-white/3"
                    onClick={() => openPlayerDetail(entry.submissionId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openPlayerDetail(entry.submissionId)
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="py-4 pr-6 tabular-nums text-base font-black text-(--foreground)">
                      #{entry.rank}
                    </td>
                    <td className="py-4 pr-6 font-semibold text-(--foreground)">
                      {entry.playerName}
                    </td>
                    <td className="py-4 pr-6 text-(--foreground-subtle)">
                      {entry.modelLabel}
                    </td>
                    <td className="py-4 pr-4 tabular-nums text-(--foreground)">
                      {entry.wins}
                    </td>
                    <td className="py-4 pr-4 tabular-nums text-(--foreground)">
                      {entry.losses}
                    </td>
                    <td className="py-4 pr-4 tabular-nums text-(--foreground-subtle)">
                      {entry.buchholz.toFixed(1)}
                    </td>
                    <td className="py-4 tabular-nums text-(--foreground-subtle)">
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
        <CardHeader>
          <CardTitle>
            当前轮次
            {activeRound ? (
              <span className="ml-3 text-sm font-normal text-(--foreground-muted)">
                R{activeRound.roundNumber}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeRound || activeRoundPairings.length === 0 ? (
            <p className="text-sm text-(--foreground-subtle)">暂无对阵数据。</p>
          ) : (
            <div className="space-y-3">
              {activeRoundPairings.map((pairing) => (
                <div
                  key={pairing.pairKey}
                  className="overflow-hidden rounded-xl border border-(--border-soft)"
                >
                  {/* Pairing header */}
                  <div className="flex items-center justify-between border-b border-(--border-soft) bg-white/2 px-4 py-2.5">
                    <span className="text-sm font-semibold text-(--foreground)">
                      {getPlayerName(pairing.leftSubmissionId)}
                      <span className="mx-2 font-normal text-(--foreground-muted)">
                        vs
                      </span>
                      {getPlayerName(pairing.rightSubmissionId)}
                    </span>
                  </div>
                  {/* Individual matches — two columns */}
                  <div className="grid grid-cols-2 divide-x divide-(--border-soft)">
                    {pairing.matches.map((match) => {
                      const scored =
                        match.status === 'scored' &&
                        match.scoreA != null &&
                        match.scoreB != null
                      const errored = match.status === 'error'
                      return (
                        <Link
                          key={match.id}
                          to={`/matches/${match.id}`}
                          className="group flex flex-col gap-2 px-4 py-3 transition hover:bg-[rgba(224,74,47,0.04)]"
                        >
                          {/* Matchup */}
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-medium text-(--foreground)">
                              {scenario?.roleAName}
                            </span>
                            <span className="text-(--foreground-muted)">
                              （{getPlayerName(match.subAId)}）
                            </span>
                            <span className="mx-1 text-xs text-(--foreground-muted)">
                              vs
                            </span>
                            <span className="font-medium text-(--foreground)">
                              {scenario?.roleBName}
                            </span>
                            <span className="text-(--foreground-muted)">
                              （{getPlayerName(match.subBId)}）
                            </span>
                          </div>
                          {/* Score + arrow */}
                          <div className="flex items-center gap-2">
                            {scored ? (
                              <span className="tabular-nums text-base font-black tracking-tight text-(--foreground)">
                                {match.scoreA}{' '}
                                <span className="font-normal text-(--foreground-muted)">
                                  :
                                </span>{' '}
                                {match.scoreB}
                              </span>
                            ) : errored ? (
                              <span className="text-sm font-semibold text-(--accent)">
                                ERR
                              </span>
                            ) : (
                              <span className="text-xs text-(--foreground-muted)">
                                进行中
                              </span>
                            )}
                            <span className="text-xs text-(--foreground-muted) opacity-0 transition-opacity group-hover:opacity-100">
                              →
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
