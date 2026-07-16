import type { JudgeOsEntry } from '@axiia/shared'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function JudgeOsTimeline({
  entries,
  expectedCount,
  isComplete,
}: {
  entries: JudgeOsEntry[]
  expectedCount: number
  isComplete: boolean
}) {
  const pendingCount = Math.max(0, expectedCount - entries.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle>秦孝公内心 OS</CardTitle>
        <p className="mt-1 text-xs leading-5 text-(--foreground-muted)">
          每当商鞅与甘龙各发言一次，记录秦孝公只针对这两次发言产生的即时倾向。
        </p>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.afterTurn}
                className="rounded-xl border border-(--border-soft) bg-white/2 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-(--foreground-muted)">
                    听取第 {entry.afterTurn - 1}–{entry.afterTurn} 回合后
                  </p>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={
                      entry.tendency === '商鞅'
                        ? {
                            background: 'rgba(224,74,47,0.14)',
                            color: 'var(--accent)',
                          }
                        : {
                            background: 'rgba(96,165,250,0.12)',
                            color: 'var(--info)',
                          }
                    }
                  >
                    倾向 {entry.tendency}
                  </span>
                </div>
                <div className="mt-3 border-t border-(--border-soft) pt-3">
                  <p className="text-[11px] font-semibold text-(--foreground-muted)">
                    本轮倾向原因
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-(--foreground-subtle)">
                    {entry.reason}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-(--foreground-subtle)">
            {isComplete
              ? '这场历史对局没有记录内心 OS。'
              : expectedCount > 0
                ? '秦孝公正在思量刚才的两次发言。'
                : '双方各完成一次发言后，这里会出现第一条内心 OS。'}
          </p>
        )}

        {!isComplete && pendingCount > 0 ? (
          <p className="mt-3 text-xs text-(--foreground-muted)">
            {pendingCount} 条内心 OS 正在生成；辩论会继续进行。
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
