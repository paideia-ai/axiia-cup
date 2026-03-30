import type { LeaderboardEntry, TournamentDetail, TournamentListItem } from "@axiia/shared";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getLeaderboard, getTournament, getTournaments } from "../lib/api";

export function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournamentDetail, setTournamentDetail] = useState<TournamentDetail | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedTournamentId = Number(searchParams.get("tournament") ?? 0) || null;
  const selectedPlayerMatches =
    selectedSubmissionId && tournamentDetail
      ? tournamentDetail.rounds.flatMap((round) =>
          round.matches
            .filter((match) => match.subAId === selectedSubmissionId || match.subBId === selectedSubmissionId)
            .map((match) => ({
              ...match,
              roundNumber: round.roundNumber,
            })),
        )
      : [];

  useEffect(() => {
    const loadTournamentList = async () => {
      try {
        const tournamentList = await getTournaments();
        setTournaments(tournamentList);

        if (!selectedTournamentId && tournamentList[0]) {
          setSearchParams({ tournament: String(tournamentList[0].id) }, { replace: true });
        } else if (tournamentList.length === 0) {
          setIsLoading(false);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载赛事失败");
        setIsLoading(false);
      }
    };

    void loadTournamentList();
  }, [selectedTournamentId, setSearchParams]);

  useEffect(() => {
    if (!selectedTournamentId) {
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [leaderboardResponse, tournamentResponse] = await Promise.all([
          getLeaderboard(selectedTournamentId),
          getTournament(selectedTournamentId),
        ]);

        setLeaderboard(leaderboardResponse);
        setTournamentDetail(tournamentResponse);
        setSelectedSubmissionId(leaderboardResponse[0]?.submissionId ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载排行榜失败");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [selectedTournamentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Leaderboard</p>
          <h1 className="page-title">排行榜</h1>
          <p className="page-subtitle">按胜场和 Buchholz 小分排序。点击选手行可查看该选手在当前赛事里的所有对局。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tournamentDetail ? <Badge tone="info">Round {tournamentDetail.currentRound}</Badge> : null}
          <select
            className="app-input min-w-[220px]"
            value={selectedTournamentId ?? ""}
            onChange={(event) => setSearchParams({ tournament: event.target.value })}
          >
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                #{tournament.id} · {tournament.scenarioTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>瑞士轮战绩</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded bg-white/6" />
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
                    className={`cursor-pointer border-b border-[var(--border-soft)] transition last:border-b-0 hover:bg-white/3 ${
                      selectedSubmissionId === entry.submissionId ? "bg-white/5" : ""
                    }`}
                    onClick={() => setSelectedSubmissionId(entry.submissionId)}
                  >
                    <td className="py-4 font-mono text-base font-bold text-[var(--foreground)]">#{entry.rank}</td>
                    <td className="py-4 font-semibold text-[var(--foreground)]">{entry.playerName}</td>
                    <td className="py-4 text-[var(--foreground-subtle)]">{entry.modelLabel}</td>
                    <td className="py-4 font-mono text-[var(--foreground)]">{entry.wins}</td>
                    <td className="py-4 font-mono text-[var(--foreground)]">{entry.losses}</td>
                    <td className="py-4 font-mono text-[var(--foreground-subtle)]">{entry.buchholz.toFixed(1)}</td>
                    <td className="py-4 font-mono text-[var(--foreground-subtle)]">{entry.winRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>选手对局</CardTitle>
          {selectedSubmissionId ? <Badge tone="warning">submission #{selectedSubmissionId}</Badge> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedSubmissionId ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
              点击上方选手行查看对应对局。
            </div>
          ) : selectedPlayerMatches.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
              当前选手还没有对局记录。
            </div>
          ) : (
            selectedPlayerMatches.map((match) => (
              <Link
                key={match.id}
                className="block rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-4 transition hover:border-[rgba(224,74,47,0.28)] hover:bg-[rgba(224,74,47,0.06)]"
                to={`/matches/${match.id}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Round {match.roundNumber} · Match #{match.id}</p>
                    <p className="text-sm text-[var(--foreground-subtle)]">
                      {match.subAId} vs {match.subBId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={match.status === "scored" ? "success" : match.status === "error" ? "warning" : "info"}>
                      {match.status}
                    </Badge>
                    <span className="font-mono text-sm text-[var(--foreground-subtle)]">
                      {match.scoreA ?? "--"} : {match.scoreB ?? "--"}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
