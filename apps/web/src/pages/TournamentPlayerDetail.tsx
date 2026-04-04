import type {
  LeaderboardEntry,
  Scenario,
  TournamentDetail,
} from '@axiia/shared'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { cn } from '../lib/cn'
import { getLeaderboard, getScenario, getTournament } from '../lib/api'

type PlayerMatchView = NonNullable<
  TournamentDetail['rounds'][number]['matches'][number]
> & {
  roundNumber: number
}

export function TournamentPlayerDetailPage() {
  const { submissionId = '', tournamentId = '' } = useParams()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [tournamentDetail, setTournamentDetail] =
    useState<TournamentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const numericTournamentId = Number(tournamentId)
  const numericSubmissionId = Number(submissionId)
  const playersBySubmissionId = useMemo(
    () => new Map(leaderboard.map((entry) => [entry.submissionId, entry])),
    [leaderboard],
  )
  const player = playersBySubmissionId.get(numericSubmissionId) ?? null
  const playerMatches: PlayerMatchView[] = useMemo(() => {
    if (!tournamentDetail) return []

    const nextMatches: PlayerMatchView[] = []
    for (const round of tournamentDetail.rounds) {
      for (const match of round.matches) {
        if (
          match.subAId !== numericSubmissionId &&
          match.subBId !== numericSubmissionId
        )
          continue

        nextMatches.push({
          createdAt: match.createdAt,
          currentTurn: match.currentTurn,
          finishedAt: match.finishedAt,
          id: match.id,
          roundId: match.roundId,
          roundNumber: round.roundNumber,
          scenarioId: match.scenarioId,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          startedAt: match.startedAt,
          status: match.status,
          subAId: match.subAId,
          subBId: match.subBId,
          winner: match.winner,
        })
      }
    }
    return nextMatches
  }, [numericSubmissionId, tournamentDetail])

  const roleACount = playerMatches.filter(
    (m) => m.subAId === numericSubmissionId,
  ).length
  const roleBCount = playerMatches.filter(
    (m) => m.subBId === numericSubmissionId,
  ).length

  const getPlayerName = (id: number) =>
    playersBySubmissionId.get(id)?.playerName ?? `submission #${id}`
  const roleALabel = scenario ? scenario.roleAName : '—'
  const roleBLabel = scenario ? scenario.roleBName : '—'

  useEffect(() => {
    if (!Number.isInteger(numericTournamentId) || numericTournamentId <= 0) {
      setError('无效的赛事 ID')
      setIsLoading(false)
      return
    }
    if (!Number.isInteger(numericSubmissionId) || numericSubmissionId <= 0) {
      setError('无效的选手 ID')
      setIsLoading(false)
      return
    }

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [leaderboardResponse, tournamentResponse] = await Promise.all([
          getLeaderboard(numericTournamentId),
          getTournament(numericTournamentId),
        ])
        const scenarioResponse = await getScenario(
          tournamentResponse.scenarioId,
        )
        setLeaderboard(leaderboardResponse)
        setTournamentDetail(tournamentResponse)
        setScenario(scenarioResponse)
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : '加载选手详情失败',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [numericSubmissionId, numericTournamentId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded bg-white/8" />
        <div className="h-[100px] animate-pulse rounded-xl bg-white/5" />
        <div className="h-[420px] animate-pulse rounded-xl bg-white/5" />
      </div>
    )
  }

  if (error || !tournamentDetail || !player) {
    return (
      <p className="text-sm text-(--accent)">{error ?? '选手详情不存在'}</p>
    )
  }

  const statCells = [
    { label: '当前战绩', value: `${player.wins} / ${player.losses}` },
    { label: '胜率', value: `${player.winRate.toFixed(1)}%` },
    { label: `${roleALabel} 出场`, value: String(roleACount) },
    { label: `${roleBLabel} 出场`, value: String(roleBCount) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Player Detail</p>
          <h1 className="page-title">{player.playerName}</h1>
          <p className="page-subtitle">
            {scenario?.title ?? '当前赛事'} · 第 {player.rank} 名 ·{' '}
            {player.modelLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">Round {tournamentDetail.currentRound}</Badge>
          <Link to={`/leaderboard?tournament=${tournamentDetail.id}`}>
            <Button variant="secondary" size="sm">
              返回排行榜
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 divide-x divide-y divide-(--border-soft) rounded-xl border border-(--border-soft) xl:grid-cols-4 xl:divide-y-0">
        {statCells.map((cell) => (
          <div key={cell.label} className="px-6 py-5">
            <p className="panel-label">{cell.label}</p>
            <p className="mt-2 text-[2.25rem] font-black tabular-nums leading-none tracking-tight text-(--foreground)">
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>本赛事全部对局</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {playerMatches.length === 0 ? (
            <p className="rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
              该选手在当前赛事还没有对局记录。
            </p>
          ) : (
            playerMatches.map((match) => {
              const isRoleA = match.subAId === numericSubmissionId
              const myRoleLabel = isRoleA ? roleALabel : roleBLabel
              const opponentId = isRoleA ? match.subBId : match.subAId
              const opponentRoleLabel = isRoleA ? roleBLabel : roleALabel
              const won =
                match.winner === (isRoleA ? 'a' : 'b')
                  ? true
                  : match.winner === null || match.winner === 'draw'
                    ? null
                    : false

              return (
                <Link
                  key={match.id}
                  className="block rounded-xl border border-(--border-soft) bg-white/3 px-4 py-4 transition hover:border-[rgba(224,74,47,0.28)] hover:bg-[rgba(224,74,47,0.06)]"
                  to={`/matches/${match.id}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-(--foreground)">
                        Round {match.roundNumber} · Match #{match.id}
                      </p>
                      <p className="text-sm text-(--foreground-subtle)">
                        {player.playerName} · {myRoleLabel}
                      </p>
                      <p className="text-sm text-(--foreground-subtle)">
                        {getPlayerName(opponentId)} · {opponentRoleLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums text-sm text-(--foreground-subtle)">
                        {match.scoreA ?? '—'} : {match.scoreB ?? '—'}
                      </span>
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
                      {won !== null && (
                        <Badge tone={won ? 'success' : 'warning'}>
                          {won ? '胜' : '负'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
