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
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [matchId])

  useEffect(() => {
    if (!toast) {
      return
    }

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
    return (
      <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
        {error ?? '对局不存在'}
      </div>
    )
  }

  const roleALabel = scenario ? `角色 A · ${scenario.roleAName}` : '角色 A'
  const roleBLabel = scenario ? `角色 B · ${scenario.roleBName}` : '角色 B'
  const playerALabel = `${match.playerADisplayName} · ${roleALabel}`
  const playerBLabel = `${match.playerBDisplayName} · ${roleBLabel}`
  const winnerLabel =
    match.winner === 'a'
      ? playerALabel
      : match.winner === 'b'
        ? playerBLabel
        : match.winner === 'draw'
          ? '平局'
          : '--'

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-6 top-20 z-50 rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.12)] px-4 py-3 text-sm text-[var(--success)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
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
        <div className="flex flex-wrap gap-2">
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
              onClick={async () => {
                try {
                  setIsRetrying(true)
                  setError(null)
                  await retryAdminMatch(match.id)
                  const loadId = ++latestLoadIdRef.current
                  const detail = await getMatch(match.id)
                  if (loadId !== latestLoadIdRef.current) {
                    return
                  }
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
              {isRetrying ? '重试中...' : '管理员重试'}
            </Button>
          ) : null}
          <Link
            className="inline-flex items-center rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--foreground-subtle)] transition hover:bg-white/4 hover:text-[var(--foreground)]"
            to={`/leaderboard?tournament=${match.tournamentId}`}
          >
            返回排行榜
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>
              {playerALabel} vs {playerBLabel}
            </CardTitle>
            <p className="mt-2 text-sm text-[var(--foreground-subtle)]">
              {match.playerAModel} vs {match.playerBModel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                Score
              </p>
              <p className="mt-1 font-mono text-xl text-[var(--foreground)]">
                {match.scoreA ?? '--'} : {match.scoreB ?? '--'}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.12)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                Winner
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                {winnerLabel}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>完整 Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const turnKeyCounts = new Map<string, number>()

            return match.transcript.map((turn, index) => {
              const baseKey = `${turn.speaker}:${turn.content}`
              const occurrence = (turnKeyCounts.get(baseKey) ?? 0) + 1
              turnKeyCounts.set(baseKey, occurrence)
              const isA = turn.speaker === 'a'
              const roleName = isA ? playerALabel : playerBLabel

              return (
                <div
                  key={`${baseKey}:${occurrence}`}
                  className={`flex ${isA ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl border px-4 py-3 ${isA ? 'border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.12)]' : 'border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)]'}`}
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                      Turn {index + 1} · {roleName}
                    </p>
                    <p className="text-sm leading-7 text-[var(--foreground-subtle)]">
                      {turn.content}
                    </p>
                  </div>
                </div>
              )
            })
          })()}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>裁判追问 · {playerALabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {match.judgeTranscriptA.map((item) => (
              <div key={`a-${item.round}`} className="app-panel">
                <p className="panel-label">第 {item.round} 轮问题</p>
                <p className="panel-copy whitespace-pre-wrap">
                  {item.question}
                </p>
                <p className="mt-3 panel-label">回答</p>
                <p className="panel-copy whitespace-pre-wrap">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>裁判追问 · {playerBLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {match.judgeTranscriptB.map((item) => (
              <div key={`b-${item.round}`} className="app-panel">
                <p className="panel-label">第 {item.round} 轮问题</p>
                <p className="panel-copy whitespace-pre-wrap">
                  {item.question}
                </p>
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
            <p className="panel-copy whitespace-pre-wrap">
              {match.reasoning ?? '暂无裁判解释。'}
            </p>
            {match.error ? (
              <p className="mt-4 text-sm text-[#f87171]">
                错误信息：{match.error}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
