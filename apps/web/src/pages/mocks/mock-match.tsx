/** Static mock: Match Detail — verdict-first layout with collapsible sections */
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../../components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { mockMatchDetail, mockScenario } from './mock-data'

export function MockMatch() {
  const [showTranscript, setShowTranscript] = useState(false)
  const [showJudgeQA, setShowJudgeQA] = useState(false)
  const m = mockMatchDetail
  const s = mockScenario

  const playerALabel = `${s.roleAName}（${m.playerADisplayName}）`
  const playerBLabel = `${s.roleBName}（${m.playerBDisplayName}）`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to="/mocks/leaderboard"
            className="mb-2 flex items-center gap-1 text-xs text-(--foreground-muted) hover:text-(--foreground-subtle)"
          >
            ← 返回排行榜
          </Link>
          <p className="page-eyebrow">对战详情</p>
          <h1 className="page-title">对战结果 #{m.id}</h1>
          <p className="page-subtitle">
            第 {m.roundNumber} 轮 · {playerALabel} vs {playerBLabel}
          </p>
        </div>
        <Badge tone="success">已结算</Badge>
      </div>

      {/* Score summary */}
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>
              {playerALabel} vs {playerBLabel}
            </CardTitle>
          </div>
          <div className="flex items-stretch gap-3">
            <div className="rounded-xl border border-(--border-soft) bg-white/3 px-5 py-3">
              <p className="panel-label">比分</p>
              <p className="mt-1 tabular-nums text-2xl font-black tracking-tight text-(--foreground)">
                {m.scoreA} : {m.scoreB}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.1)] px-5 py-3">
              <p className="panel-label">胜者</p>
              <p className="mt-1 text-lg font-semibold text-(--foreground)">
                {playerALabel}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Verdict — outcome-first */}
      <Card>
        <CardHeader>
          <CardTitle>裁判宣判词</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-(--border-soft) bg-white/2 p-4">
            <p className="panel-copy whitespace-pre-wrap">{m.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Judge QA — collapsed by default */}
      <Card>
        <CardHeader>
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setShowJudgeQA((v) => !v)}
          >
            <CardTitle>裁判审讯详情</CardTitle>
            <ChevronDown
              className={`h-4 w-4 text-(--foreground-muted) transition-transform ${showJudgeQA ? 'rotate-180' : ''}`}
            />
          </button>
        </CardHeader>
      </Card>
      {showJudgeQA ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {[
            {
              label: playerALabel,
              items: m.judgeTranscriptA,
              side: 'a' as const,
            },
            {
              label: playerBLabel,
              items: m.judgeTranscriptB,
              side: 'b' as const,
            },
          ].map(({ label, items, side }) => (
            <Card key={side}>
              <CardHeader>
                <CardTitle>裁判审讯 · {label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${side}-${item.round}`}
                    className="overflow-hidden rounded-xl border border-(--border-soft)"
                  >
                    <div className="border-b border-(--border-soft) bg-white/2 px-4 py-3">
                      <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-(--foreground-muted)">
                        裁判 · 第 {item.round} 轮
                      </p>
                      <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
                        {item.question}
                      </p>
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
                          选择 {item.selectedInfoId}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${item.isCorrect ? 'bg-[rgba(74,222,128,0.15)] text-(--success)' : 'bg-[rgba(224,74,47,0.15)] text-(--accent)'}`}
                        >
                          {item.isCorrect ? '判断正确' : '判断错误'}
                        </span>
                      </div>
                      <div>
                        <p
                          className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em]"
                          style={{
                            color:
                              side === 'a' ? 'var(--accent)' : 'var(--info)',
                          }}
                        >
                          {label} 回答
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
      ) : null}

      {/* Transcript — collapsed by default */}
      <Card>
        <CardHeader>
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setShowTranscript((v) => !v)}
          >
            <CardTitle>完整 Transcript · {m.transcript.length} 回合</CardTitle>
            <ChevronDown
              className={`h-4 w-4 text-(--foreground-muted) transition-transform ${showTranscript ? 'rotate-180' : ''}`}
            />
          </button>
        </CardHeader>
        {showTranscript ? (
          <CardContent className="space-y-4">
            {m.transcript.map((turn, index) => {
              const isA = turn.speaker === 'a'
              return (
                <div
                  key={index}
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
            })}
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}
