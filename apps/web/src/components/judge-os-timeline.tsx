import type { JudgeOsEntry } from '@axiia/shared'
import { useId, useState } from 'react'

import { getSettledJudgeOsTurns } from '../lib/judge-os'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function JudgeOsTimeline({
  entries,
  expectedCount,
  failedTurns,
  isComplete,
}: {
  entries: JudgeOsEntry[]
  expectedCount: number
  failedTurns: number[]
  isComplete: boolean
}) {
  const reasonIdPrefix = useId()
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null)
  const entriesByTurn = new Map(
    entries.map((entry) => [entry.afterTurn, entry]),
  )
  const failedTurnSet = new Set(failedTurns)
  const settledTurns = getSettledJudgeOsTurns(
    entries,
    failedTurns,
    expectedCount,
  )
  const selectedEntry =
    selectedTurn === null || !settledTurns.includes(selectedTurn)
      ? null
      : (entriesByTurn.get(selectedTurn) ?? null)
  const pendingCount = Math.max(0, expectedCount - settledTurns.length)
  const visibleFailedCount = settledTurns.filter((afterTurn) =>
    failedTurnSet.has(afterTurn),
  ).length

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>秦孝公内心 OS</CardTitle>
      </CardHeader>
      <CardContent>
        {settledTurns.length > 0 ? (
          <ol
            aria-label="秦孝公倾向轨迹"
            aria-live="polite"
            className="flex flex-wrap items-center gap-2"
          >
            {settledTurns.map((afterTurn, index) => {
              const entry = entriesByTurn.get(afterTurn)
              const failed = failedTurnSet.has(afterTurn)
              const selected = selectedTurn === afterTurn

              return (
                <li key={afterTurn} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="text-xs text-(--foreground-muted)"
                    >
                      →
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-controls={
                      entry ? `${reasonIdPrefix}-${afterTurn}` : undefined
                    }
                    aria-expanded={entry ? selected : undefined}
                    className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                      selected
                        ? 'border-(--border) bg-white/8'
                        : 'border-(--border-soft) bg-white/2 hover:bg-white/5'
                    } ${failed ? 'cursor-default opacity-65' : ''}`}
                    disabled={failed}
                    onClick={() =>
                      setSelectedTurn((current) =>
                        current === afterTurn ? null : afterTurn,
                      )
                    }
                  >
                    <span className="block text-[10px] font-semibold text-(--foreground-muted)">
                      第 {afterTurn - 1}–{afterTurn} 回合
                    </span>
                    <span
                      className="mt-1 block text-xs font-semibold"
                      style={
                        entry?.tendency === '商鞅'
                          ? { color: 'var(--accent)' }
                          : entry?.tendency === '甘龙'
                            ? { color: 'var(--info)' }
                            : undefined
                      }
                    >
                      {entry ? `倾向 ${entry.tendency}` : '未能生成'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="text-sm text-(--foreground-subtle)">
            {isComplete
              ? '这场对局没有可展示的内心 OS。'
              : expectedCount > 0
                ? '秦孝公正在思量刚才的两次发言。'
                : '双方各完成一次发言后，这里会出现第一条内心 OS。'}
          </p>
        )}

        {selectedEntry ? (
          <div
            id={`${reasonIdPrefix}-${selectedEntry.afterTurn}`}
            className="mt-4 rounded-xl border border-(--border-soft) bg-white/2 p-4"
          >
            <p className="text-[11px] font-semibold text-(--foreground-muted)">
              本轮倾向原因
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-(--foreground-subtle)">
              {selectedEntry.reason}
            </p>
          </div>
        ) : null}

        {!isComplete && pendingCount > 0 ? (
          <p className="mt-3 text-xs text-(--foreground-muted)">
            {pendingCount} 条内心 OS 正在生成
          </p>
        ) : null}
        {visibleFailedCount > 0 ? (
          <p className="mt-3 text-xs text-(--foreground-muted)">
            {visibleFailedCount} 条内心 OS 未能生成
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
