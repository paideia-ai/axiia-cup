import type {
  LeaderboardEntry,
  Scenario,
  TournamentDetail,
} from '@axiia/shared'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
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
  const playerMatches: PlayerMatchView[] =
    tournamentDetail?.rounds.flatMap((round) =>
      round.matches
        .filter(
          (match) =>
            match.subAId === numericSubmissionId ||
            match.subBId === numericSubmissionId,
        )
        .map((match) => ({
          ...match,
          roundNumber: round.roundNumber,
        })),
    ) ?? []
  const roleACount = playerMatches.filter(
    (match) => match.subAId === numericSubmissionId,
  ).length
  const roleBCount = playerMatches.filter(
    (match) => match.subBId === numericSubmissionId,
  ).length

  const getPlayerName = (id: number) =>
    playersBySubmissionId.get(id)?.playerName ?? `submission #${id}`
  const roleALabel = scenario ? `角色 A · ${scenario.roleAName}` : '角色 A'
  const roleBLabel = scenario ? `角色 B · ${scenario.roleBName}` : '角色 B'

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
        <div className="h-[420px] animate-pulse rounded-xl bg-white/5" />
      </div>
    )
  }

  if (error || !tournamentDetail || !player) {
    return (
      <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
        {error ?? '选手详情不存在'}
      </div>
    )
  }

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
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">Round {tournamentDetail.currentRound}</Badge>
          <Link
            className="inline-flex items-center rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--foreground-subtle)] transition hover:bg-white/4 hover:text-[var(--foreground)]"
            to={`/leaderboard?tournament=${tournamentDetail.id}`}
          >
            返回排行榜
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="space-y-2">
            <p className="font-mono text-3xl font-bold text-[var(--foreground)]">
              {player.wins} / {player.losses}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">当前战绩</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="font-mono text-3xl font-bold text-[var(--foreground)]">
              {player.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">胜率</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="font-mono text-3xl font-bold text-[var(--foreground)]">
              {roleACount}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {roleALabel} 出场次数
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="font-mono text-3xl font-bold text-[var(--foreground)]">
              {roleBCount}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {roleBLabel} 出场次数
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>本赛事全部对局</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {playerMatches.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
              该选手在当前赛事还没有对局记录。
            </div>
          ) : (
            playerMatches.map((match) => {
              const isRoleA = match.subAId === numericSubmissionId
              const myRoleLabel = isRoleA ? roleALabel : roleBLabel
              const opponentId = isRoleA ? match.subBId : match.subAId
              const opponentRoleLabel = isRoleA ? roleBLabel : roleALabel

              return (
                <Link
                  key={match.id}
                  className="block rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-4 transition hover:border-[rgba(224,74,47,0.28)] hover:bg-[rgba(224,74,47,0.06)]"
                  to={`/matches/${match.id}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="font-semibold text-[var(--foreground)]">
                        Round {match.roundNumber} · Match #{match.id}
                      </p>
                      <p className="text-sm text-[var(--foreground-subtle)]">
                        {player.playerName} · {myRoleLabel}
                      </p>
                      <p className="text-sm text-[var(--foreground-subtle)]">
                        {getPlayerName(opponentId)} · {opponentRoleLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={isRoleA ? 'accent' : 'warning'}>
                        {myRoleLabel}
                      </Badge>
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
                      <span className="font-mono text-sm text-[var(--foreground-subtle)]">
                        {match.scoreA ?? '--'} : {match.scoreB ?? '--'}
                      </span>
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
