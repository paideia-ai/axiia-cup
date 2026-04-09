import type { Scenario } from '@axiia/shared'

import { parseJudgeDecision } from '../lib/judge-decision'
import { cn } from '../lib/cn'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

type JudgeDecisionPanelProps = {
  decision: string | null
  errorMessage?: string | null
  scenario?: Pick<
    Scenario,
    'roleAName' | 'roleARequests' | 'roleBName' | 'roleBRequests'
  >
  title?: string
  waitingMessage?: string
}

type RequestGroup = {
  rows: Array<{
    id: string
    outcome: string
    text: string
  }>
  title: string
}

function resolveOutcomeTone(outcome: string) {
  if (/不同意|反对|驳回|拒绝|不准|否决/i.test(outcome)) {
    return 'reject'
  }

  if (/同意|支持|采纳|准许|批准|通过|允/i.test(outcome)) {
    return 'approve'
  }

  return 'neutral'
}

function resolveOutcomeBadgeClassName(outcome: string) {
  const tone = resolveOutcomeTone(outcome)

  if (tone === 'approve') {
    return 'text-(--success)'
  }

  if (tone === 'reject') {
    return 'text-(--accent)'
  }

  return 'border border-(--border) bg-(--surface-elevated) text-(--info)'
}

function resolveOutcomeBadgeStyle(outcome: string) {
  const tone = resolveOutcomeTone(outcome)

  if (tone === 'approve') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--success) 14%, transparent)',
      borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)',
      boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--success) 12%, transparent)',
    }
  }

  if (tone === 'reject') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
      boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--accent) 12%, transparent)',
    }
  }

  return undefined
}

function buildRequestGroups(
  requests: Record<string, string>,
  scenario?: JudgeDecisionPanelProps['scenario'],
): RequestGroup[] {
  const entries = Object.entries(requests)
  if (entries.length === 0) {
    return []
  }

  if (!scenario) {
    return [
      {
        rows: entries.map(([id, outcome]) => ({ id, outcome, text: id })),
        title: '诉求判定',
      },
    ]
  }

  const seen = new Set<string>()
  const groups: RequestGroup[] = [
    {
      rows: scenario.roleARequests.flatMap((item) => {
        const outcome = requests[item.id]
        if (!outcome) {
          return []
        }
        seen.add(item.id)
        return [{ id: item.id, outcome, text: item.content }]
      }),
      title: `${scenario.roleAName} 的诉求`,
    },
    {
      rows: scenario.roleBRequests.flatMap((item) => {
        const outcome = requests[item.id]
        if (!outcome) {
          return []
        }
        seen.add(item.id)
        return [{ id: item.id, outcome, text: item.content }]
      }),
      title: `${scenario.roleBName} 的诉求`,
    },
  ].filter((group) => group.rows.length > 0)

  const extraRows = entries
    .filter(([id]) => !seen.has(id))
    .map(([id, outcome]) => ({ id, outcome, text: id }))

  if (extraRows.length > 0) {
    groups.push({
      rows: extraRows,
      title: '其他诉求',
    })
  }

  return groups
}

function DecisionPlaceholder({
  label,
  text,
}: {
  label: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-(--border-soft) bg-white/2 p-2.5">
      <p className="panel-label">{label}</p>
      <p className="mt-0.5 text-xs leading-5 text-(--foreground-subtle)">
        {text}
      </p>
    </div>
  )
}

export function JudgeDecisionPanel({
  decision,
  errorMessage,
  scenario,
  title = '裁判裁决',
  waitingMessage = '裁判模块已就位，待审讯完成后展示最终裁决。',
}: JudgeDecisionPanelProps) {
  const parsed = parseJudgeDecision(decision)
  const requestGroups =
    parsed?.kind === 'structured'
      ? buildRequestGroups(parsed.requests, scenario)
      : []

  const badge = !parsed
    ? errorMessage
      ? { label: '未生成', tone: 'warning' as const }
      : { label: '等待中', tone: 'info' as const }
    : parsed.kind === 'unparsed'
      ? { label: '解析失败', tone: 'warning' as const }
      : { label: '已裁决', tone: 'success' as const }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {!parsed ? (
          <>
            <div className="rounded-xl border border-(--border-soft) bg-white/2 px-3.5 py-2.5">
              <p className="text-sm font-semibold text-(--foreground)">
                {errorMessage ? '本局未生成裁决' : '等待裁判输出'}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-(--foreground-subtle)">
                {errorMessage ?? waitingMessage}
              </p>
            </div>
            <div className="grid gap-2.5">
              <DecisionPlaceholder
                label="最终裁断"
                text="裁判完成审讯后在此显示最终判断。"
              />
              <DecisionPlaceholder
                label="诉求判定"
                text="结构化裁决会在此列出每条诉求的同意或驳回。"
              />
              <DecisionPlaceholder
                label="宣判词"
                text="裁判的完整宣判词会在此显示。"
              />
            </div>
          </>
        ) : parsed.kind === 'unparsed' ? (
          <div className="rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] px-3.5 py-2.5">
            <p className="text-sm font-semibold text-(--foreground)">
              裁判已返回结果，但未通过结构化解析
            </p>
            <p className="mt-0.5 text-xs leading-5 text-(--foreground-subtle)">
              当前不会直接展示原始 JSON。请检查裁判输出格式，确保至少包含
              `judgment`、`requests`、`speech` 中的一个结构化字段。
            </p>
          </div>
        ) : (
          <>
            {parsed.kind === 'structured' && parsed.judgment ? (
              <div className="rounded-xl border border-[rgba(224,74,47,0.18)] bg-[rgba(224,74,47,0.08)] px-3.5 py-2.5">
                <p className="panel-label">最终裁断</p>
                <p className="mt-0.5 text-lg font-semibold text-(--foreground)">
                  {parsed.judgment}
                </p>
              </div>
            ) : null}

            {requestGroups.length > 0 ? (
              <div className="space-y-2.5">
                <p className="panel-label">诉求判定</p>
                <div className="grid gap-2.5">
                  {requestGroups.map((group) => (
                    <div
                      key={group.title}
                      className="rounded-xl border border-(--border-soft) bg-white/2 p-2.5"
                    >
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--foreground-muted)">
                        {group.title}
                      </p>
                      <div className="space-y-1.5">
                        {group.rows.map((row) => (
                          <div
                            key={row.id}
                            className="flex items-start justify-between gap-2.5 rounded-lg bg-black/10 px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-(--foreground-muted)">
                                {row.id}
                              </p>
                              <p className="mt-0.5 text-xs leading-[1.15rem] text-(--foreground-subtle)">
                                {row.text}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'inline-flex min-w-[4.5rem] shrink-0 items-center justify-center rounded-full border px-2.5 py-1 text-center text-[11px] font-semibold',
                                resolveOutcomeBadgeClassName(row.outcome),
                              )}
                              style={resolveOutcomeBadgeStyle(row.outcome)}
                            >
                              {row.outcome}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="panel-label">宣判词</p>
              <div className="mt-1.5 rounded-xl border border-(--border-soft) bg-white/2 px-3.5 py-2.5">
                <p className="text-xs leading-5 whitespace-pre-wrap text-(--foreground-subtle)">
                  {parsed.kind === 'structured'
                    ? parsed.speech ?? '暂无宣判词。'
                    : parsed.speech}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
