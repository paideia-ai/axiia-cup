import {
  modelOptions,
  type MatchDetail,
  type MatchProgress,
  type Scenario,
} from '@axiia/shared'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { JudgeDecisionPanel } from '../components/judge-decision-panel'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../context/auth'
import {
  getMatch,
  getMatchProgress,
  getScenario,
  retryAdminMatch,
} from '../lib/api'
import { usePageVisibility } from '../lib/page-visibility'

function buildInfoContentMap(items: Scenario['roleAHiddenInfo']) {
  return new Map(items.map((item) => [item.id, item.content]))
}

function createMatchProgressSnapshot(match: MatchDetail): MatchProgress {
  return {
    currentTurn: match.currentTurn,
    error: match.error,
    hasInfoAssignment: match.infoAssignment != null,
    hasJudgeDecision: match.judgeDecision != null,
    id: match.id,
    judgeTranscriptALength: match.judgeTranscriptA.length,
    judgeTranscriptBLength: match.judgeTranscriptB.length,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    status: match.status,
    winner: match.winner,
  }
}

function resolveModelLabel(modelId: string) {
  return modelOptions.find((option) => option.id === modelId)?.label ?? modelId
}

function hasMatchProgressChanged(
  previous: MatchProgress | null,
  next: MatchProgress,
) {
  if (!previous) {
    return true
  }

  return (
    previous.status !== next.status ||
    previous.currentTurn !== next.currentTurn ||
    previous.judgeTranscriptALength !== next.judgeTranscriptALength ||
    previous.judgeTranscriptBLength !== next.judgeTranscriptBLength ||
    previous.hasInfoAssignment !== next.hasInfoAssignment ||
    previous.hasJudgeDecision !== next.hasJudgeDecision ||
    previous.scoreA !== next.scoreA ||
    previous.scoreB !== next.scoreB ||
    previous.winner !== next.winner ||
    previous.error !== next.error
  )
}

export function MatchDetailPage() {
  const { matchId = '' } = useParams()
  const { user } = useAuth()
  const isPageVisible = usePageVisibility()
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)
  const progressRef = useRef<MatchProgress | null>(null)

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

    const loadMatchDetail = async (
      isInitial: boolean,
    ): Promise<MatchDetail | null> => {
      const loadId = ++latestLoadIdRef.current
      try {
        if (isInitial) {
          setIsLoading(true)
          setError(null)
        }
        const detail = await getMatch(numericId)
        if (cancelled || loadId !== latestLoadIdRef.current) return null
        if (!hasLoadedScenario) {
          const scenarioDetail = await getScenario(detail.scenarioId)
          if (cancelled || loadId !== latestLoadIdRef.current) return null
          setScenario(scenarioDetail)
          hasLoadedScenario = true
        }
        setError(null)
        setMatch(detail)
        progressRef.current = createMatchProgressSnapshot(detail)
        return detail
      } catch (loadError) {
        if (cancelled || loadId !== latestLoadIdRef.current) return null
        if (isInitial) {
          setScenario(null)
          setError(
            loadError instanceof Error ? loadError.message : '加载对局失败',
          )
        }
        return null
      } finally {
        if (!cancelled && loadId === latestLoadIdRef.current && isInitial) {
          setIsLoading(false)
        }
      }
    }

    const poll = async (isInitial: boolean) => {
      let status: MatchProgress['status'] | null = null

      if (isInitial) {
        const detail = await loadMatchDetail(true)
        status = detail?.status ?? null
      } else {
        try {
          const progress = await getMatchProgress(numericId)
          if (cancelled) return

          status = progress.status

          if (hasMatchProgressChanged(progressRef.current, progress)) {
            progressRef.current = progress
            await loadMatchDetail(false)
          }
        } catch (loadError) {
          if (!cancelled) {
            setError(
              loadError instanceof Error ? loadError.message : '加载对局失败',
            )
          }
        }
      }

      if (
        !cancelled &&
        status !== null &&
        status !== 'scored' &&
        status !== 'error'
      ) {
        timeoutId = window.setTimeout(
          () => {
            void poll(false)
          },
          isPageVisible ? 3_000 : 15_000,
        )
      }
    }

    void poll(true)
    return () => {
      cancelled = true
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [isPageVisible, matchId])

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
                  progressRef.current = createMatchProgressSnapshot(detail)
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
              {roleAName} · {resolveModelLabel(match.playerAModel)}
              <span className="mx-2">/</span>
              {roleBName} · {resolveModelLabel(match.playerBModel)}
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

      {/* Verdict — moved up: users want "why did I win/lose?" first */}
      <Card>
        <CardHeader>
          <CardTitle>裁判宣判词</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-(--border-soft) bg-white/2 p-4">
            <p className="panel-copy whitespace-pre-wrap">
              {match.reasoning ?? '暂无宣判词。'}
            </p>
            {match.error ? (
              <p className="mt-4 text-sm text-(--accent)">
                错误信息：{match.error}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Judge decision + info assignment */}
      <div className="grid gap-6 xl:grid-cols-2">
        <JudgeDecisionPanel
          decision={match.judgeDecision}
          errorMessage={match.error}
          scenario={
            scenario
              ? {
                  roleAName: scenario.roleAName,
                  roleARequests: scenario.roleARequests,
                  roleBName: scenario.roleBName,
                  roleBRequests: scenario.roleBRequests,
                }
              : undefined
          }
          waitingMessage="裁判尚未完成最终裁决，结果将在审讯结束后显示。"
        />

        {match.infoAssignment && scenario ? (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>本局信息分配</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              {(
                [
                  {
                    falseIds: new Set(match.infoAssignment.roleAFalseInfoIds),
                    hiddenInfo: scenario.roleAHiddenInfo,
                    name: scenario.roleAName,
                    requests: scenario.roleARequests,
                    side: 'a' as const,
                    trueRequestIds: new Set(
                      match.infoAssignment.roleATrueRequestIds,
                    ),
                  },
                  {
                    falseIds: new Set(match.infoAssignment.roleBFalseInfoIds),
                    hiddenInfo: scenario.roleBHiddenInfo,
                    name: scenario.roleBName,
                    requests: scenario.roleBRequests,
                    side: 'b' as const,
                    trueRequestIds: new Set(
                      match.infoAssignment.roleBTrueRequestIds,
                    ),
                  },
                ] as const
              ).map((role) => (
                <div
                  key={role.side}
                  className="rounded-lg border border-(--border-soft) bg-white/2 p-3 space-y-2"
                >
                  <p
                    className="text-xs font-semibold"
                    style={{
                      color:
                        role.side === 'a' ? 'var(--accent)' : 'var(--info)',
                    }}
                  >
                    {role.name}
                  </p>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-(--foreground-muted)">
                      隐藏信息
                    </p>
                    <ul className="space-y-1">
                      {role.hiddenInfo.map((item) => {
                        const isFalse = role.falseIds.has(item.id)

                        return (
                          <li
                            key={item.id}
                            className="flex items-start gap-1.5 text-[11px] leading-4"
                          >
                            <span
                              className={`mt-0.5 shrink-0 rounded px-1 py-px text-[10px] font-semibold ${
                                isFalse
                                  ? 'bg-[rgba(224,74,47,0.15)] text-(--accent)'
                                  : 'bg-[rgba(74,222,128,0.15)] text-(--success)'
                              }`}
                            >
                              {isFalse ? '假' : '真'}
                            </span>
                            <span className="text-(--foreground-subtle)">
                              {item.content}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-(--foreground-muted)">
                      诉求
                    </p>
                    <ul className="space-y-1">
                      {role.requests.map((item) => {
                        const isTrue = role.trueRequestIds.has(item.id)

                        return (
                          <li
                            key={item.id}
                            className="flex items-start gap-1.5 text-[11px] leading-4"
                          >
                            <span
                              className={`mt-0.5 shrink-0 rounded px-1 py-px text-[10px] font-semibold ${
                                isTrue
                                  ? 'bg-[rgba(74,222,128,0.15)] text-(--success)'
                                  : 'bg-white/8 text-(--foreground-muted)'
                              }`}
                            >
                              {isTrue ? '真' : '假'}
                            </span>
                            <span className="text-(--foreground-subtle)">
                              {item.content}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

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
              <CardTitle>裁判审讯 · {playerLabel}</CardTitle>
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
                        裁判 · 第 {item.round} 轮
                      </p>
                      <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
                        {item.question}
                      </p>
                    </div>
                  </div>
                  <div
                    className="space-y-3 px-4 py-3"
                    style={{
                      background:
                        side === 'a'
                          ? 'rgba(224,74,47,0.05)'
                          : 'rgba(96,165,250,0.05)',
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className="rounded px-1.5 py-0.5 font-semibold text-(--foreground)"
                        style={{
                          background:
                            side === 'a'
                              ? 'rgba(224,74,47,0.12)'
                              : 'rgba(96,165,250,0.12)',
                        }}
                      >
                        选择 {item.selectedInfoId ?? '未作答'}
                      </span>
                      {item.isCorrect != null ? (
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            item.isCorrect
                              ? 'bg-[rgba(74,222,128,0.15)] text-(--success)'
                              : 'bg-[rgba(224,74,47,0.15)] text-(--accent)'
                          }`}
                        >
                          {item.isCorrect ? '判断正确' : '判断错误'}
                        </span>
                      ) : null}
                    </div>
                    {scenario && item.selectedInfoId ? (
                      <p className="text-[11px] leading-5 text-(--foreground-muted)">
                        对应信息：
                        {(side === 'a'
                          ? buildInfoContentMap(scenario.roleBHiddenInfo)
                          : buildInfoContentMap(scenario.roleAHiddenInfo)
                        ).get(item.selectedInfoId) ?? '未知信息'}
                      </p>
                    ) : null}
                    <div>
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
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transcript — reference material, kept at bottom */}
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
    </div>
  )
}
