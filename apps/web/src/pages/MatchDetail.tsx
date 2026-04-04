import type { MatchDetail, Scenario } from '@axiia/shared'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../context/auth'
import { getMatch, getScenario, retryAdminMatch } from '../lib/api'

export function MatchDetailPage() {
  const { matchId = '' } = useParams()
  const { user } = useAuth()
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)

  useEffect(() => {
    const numericId = Number(matchId)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError('无效的对局 ID')
      setIsLoading(false)
      return
    }

    let cancelled = false
    let timeoutId: number | null = null
    let hasLoadedScenario = false

    const loadMatch = async (isInitial: boolean) => {
      const loadId = ++latestLoadIdRef.current
      try {
        if (isInitial) {
          setIsLoading(true)
          setError(null)
        }
        const detail = await getMatch(numericId)
        if (cancelled || loadId !== latestLoadIdRef.current) return
        if (!hasLoadedScenario) {
          const scenarioDetail = await getScenario(detail.scenarioId)
          if (cancelled || loadId !== latestLoadIdRef.current) return
          setScenario(scenarioDetail)
          hasLoadedScenario = true
        }
        setError(null)
        setMatch(detail)
      } catch (loadError) {
        if (cancelled || loadId !== latestLoadIdRef.current) return
        if (isInitial) {
          setScenario(null)
          setError(
            loadError instanceof Error ? loadError.message : '加载对局失败',
          )
        }
      } finally {
        if (!cancelled && loadId === latestLoadIdRef.current && isInitial) {
          setIsLoading(false)
        }
      }
    }

    const poll = async (isInitial: boolean) => {
      await loadMatch(isInitial)
      if (!cancelled) {
        timeoutId = window.setTimeout(() => {
          void poll(false)
        }, 3_000)
      }
    }

    void poll(true)
    return () => {
      cancelled = true
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [matchId])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-white/8" />
        <div className="h-[640px] animate-pulse rounded-xl bg-white/5" />
      </div>
    )
  }

  if (error || !match) {
    return <p className="text-sm text-(--accent)">{error ?? '对局不存在'}</p>
  }

  const roleAName = scenario?.roleAName ?? '—'
  const roleBName = scenario?.roleBName ?? '—'
  const playerALabel = `${roleAName}（${match.playerADisplayName}）`
  const playerBLabel = `${roleBName}（${match.playerBDisplayName}）`
  const winnerLabel =
    match.winner === 'a'
      ? playerALabel
      : match.winner === 'b'
        ? playerBLabel
        : match.winner === 'draw'
          ? '平局'
          : '—'

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--foreground) shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-(--success)" />
          {toast}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Match</p>
          <h1 className="page-title">对战结果 #{match.id}</h1>
          <p className="page-subtitle">
            Round {match.roundNumber} · {playerALabel} vs {playerBLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          {user?.isAdmin && match.status === 'error' ? (
            <Button
              disabled={isRetrying}
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  setIsRetrying(true)
                  setError(null)
                  await retryAdminMatch(match.id)
                  const loadId = ++latestLoadIdRef.current
                  const detail = await getMatch(match.id)
                  if (loadId !== latestLoadIdRef.current) return
                  setMatch(detail)
                  setToast('已将异常对局重新加入队列')
                } catch (retryError) {
                  setError(
                    retryError instanceof Error
                      ? retryError.message
                      : '重试对局失败',
                  )
                } finally {
                  setIsRetrying(false)
                }
              }}
            >
              {isRetrying ? '重试中…' : '管理员重试'}
            </Button>
          ) : null}
          <Link to={`/leaderboard?tournament=${match.tournamentId}`}>
            <Button variant="secondary" size="sm">
              返回排行榜
            </Button>
          </Link>
        </div>
      </div>

      {/* Score summary */}
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>
              {playerALabel} vs {playerBLabel}
            </CardTitle>
            <p className="mt-1.5 text-sm text-(--foreground-subtle)">
              {match.playerAModel} vs {match.playerBModel}
            </p>
          </div>
          <div className="flex items-stretch gap-3">
            <div className="rounded-xl border border-(--border-soft) bg-white/3 px-5 py-3">
              <p className="panel-label">比分</p>
              <p className="mt-1 tabular-nums text-2xl font-black tracking-tight text-(--foreground)">
                {match.scoreA ?? '—'} : {match.scoreB ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.1)] px-5 py-3">
              <p className="panel-label">胜者</p>
              <p className="mt-1 text-lg font-semibold text-(--foreground)">
                {winnerLabel}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>完整 Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const turnKeyCounts = new Map<string, number>()
            return match.transcript.map((turn, index) => {
              const baseKey = `${turn.speaker}:${turn.content}`
              const occurrence = (turnKeyCounts.get(baseKey) ?? 0) + 1
              turnKeyCounts.set(baseKey, occurrence)
              const isA = turn.speaker === 'a'

              return (
                <div
                  key={`${baseKey}:${occurrence}`}
                  className={`flex flex-col gap-1.5 ${isA ? 'items-start' : 'items-end'}`}
                >
                  <p
                    className="px-1 text-xs font-semibold"
                    style={{ color: isA ? 'var(--accent)' : 'var(--info)' }}
                  >
                    {isA ? playerALabel : playerBLabel}
                    <span className="ml-1.5 font-normal opacity-60">
                      #{index + 1}
                    </span>
                  </p>
                  <div
                    className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 text-(--foreground)"
                    style={
                      isA
                        ? {
                            background: 'rgba(224,74,47,0.1)',
                            border: '1px solid rgba(224,74,47,0.2)',
                          }
                        : {
                            background: 'rgba(96,165,250,0.08)',
                            border: '1px solid rgba(96,165,250,0.18)',
                          }
                    }
                  >
                    {turn.content}
                  </div>
                </div>
              )
            })
          })()}
        </CardContent>
      </Card>

      {/* Judge QA */}
      <div className="grid gap-6 xl:grid-cols-2">
        {(
          [
            {
              playerLabel: playerALabel,
              items: match.judgeTranscriptA,
              side: 'a' as const,
            },
            {
              playerLabel: playerBLabel,
              items: match.judgeTranscriptB,
              side: 'b' as const,
            },
          ] as const
        ).map(({ playerLabel, items, side }) => (
          <Card key={side}>
            <CardHeader>
              <CardTitle>
                {scenario?.judgeName ?? '裁判'}追问 · {playerLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${side}-${item.round}`}
                  className="overflow-hidden rounded-xl border border-(--border-soft)"
                >
                  <div className="flex gap-3 border-b border-(--border-soft) bg-white/2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-(--foreground-muted)">
                        {scenario?.judgeName ?? '裁判'} · 第 {item.round} 轮
                      </p>
                      <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
                        {item.question}
                      </p>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3"
                    style={{
                      background:
                        side === 'a'
                          ? 'rgba(224,74,47,0.05)'
                          : 'rgba(96,165,250,0.05)',
                    }}
                  >
                    <p
                      className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        color: side === 'a' ? 'var(--accent)' : 'var(--info)',
                      }}
                    >
                      {playerLabel} 回答
                    </p>
                    <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
                      {item.answer}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reasoning */}
      <Card>
        <CardHeader>
          <CardTitle>{scenario?.judgeName ?? '裁判'}评分理由</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-(--border-soft) bg-white/2 p-4">
            <p className="panel-copy whitespace-pre-wrap">
              {match.reasoning ?? '暂无评分理由。'}
            </p>
            {match.error ? (
              <p className="mt-4 text-sm text-(--accent)">
                错误信息：{match.error}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
