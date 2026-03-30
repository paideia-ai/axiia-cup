import type { MatchDetail } from "@axiia/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getMatch } from "../lib/api";

export function MatchDetailPage() {
  const { matchId = "" } = useParams();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const numericId = Number(matchId);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError("无效的对局 ID");
      setIsLoading(false);
      return;
    }

    const loadMatch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const detail = await getMatch(numericId);
        setMatch(detail);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载对局失败");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMatch();
  }, [matchId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-white/8" />
        <div className="h-[640px] animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (error || !match) {
    return <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error ?? "对局不存在"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Match</p>
          <h1 className="page-title">对战结果 #{match.id}</h1>
          <p className="page-subtitle">
            Round {match.roundNumber} · submission {match.subAId} vs submission {match.subBId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={match.status === "scored" ? "success" : match.status === "error" ? "warning" : "info"}>
            {match.status}
          </Badge>
          <Link className="inline-flex items-center rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--foreground-subtle)] transition hover:bg-white/4 hover:text-[var(--foreground)]" to={`/leaderboard?tournament=${match.tournamentId}`}>
            返回排行榜
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>
              {match.playerADisplayName} vs {match.playerBDisplayName}
            </CardTitle>
            <p className="mt-2 text-sm text-[var(--foreground-subtle)]">
              {match.playerAModel} vs {match.playerBModel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Score</p>
              <p className="mt-1 font-mono text-xl text-[var(--foreground)]">
                {match.scoreA ?? "--"} : {match.scoreB ?? "--"}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.12)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Winner</p>
              <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">{match.winner?.toUpperCase() ?? "--"}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>完整 Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {match.transcript.map((turn, index) => {
            const isA = turn.speaker === "a";
            const roleName = isA ? match.playerADisplayName : match.playerBDisplayName;

            return (
              <div key={`${turn.speaker}-${index}`} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl border px-4 py-3 ${isA ? "border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.12)]" : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)]"}`}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                    Turn {index + 1} · {roleName}
                  </p>
                  <p className="text-sm leading-7 text-[var(--foreground-subtle)]">{turn.content}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>裁判追问 · A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {match.judgeTranscriptA.map((item) => (
              <div key={`a-${item.round}`} className="app-panel">
                <p className="panel-label">第 {item.round} 轮问题</p>
                <p className="panel-copy whitespace-pre-wrap">{item.question}</p>
                <p className="mt-3 panel-label">回答</p>
                <p className="panel-copy whitespace-pre-wrap">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>裁判追问 · B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {match.judgeTranscriptB.map((item) => (
              <div key={`b-${item.round}`} className="app-panel">
                <p className="panel-label">第 {item.round} 轮问题</p>
                <p className="panel-copy whitespace-pre-wrap">{item.question}</p>
                <p className="mt-3 panel-label">回答</p>
                <p className="panel-copy whitespace-pre-wrap">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>裁判理由</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="app-panel">
            <p className="panel-copy whitespace-pre-wrap">{match.reasoning ?? "暂无裁判解释。"}</p>
            {match.error ? <p className="mt-4 text-sm text-[#f87171]">错误信息：{match.error}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
