import {
  modelOptions,
  type InfoAssignment,
  type JudgeDecision,
  type PlaygroundRun,
  type PlaygroundRunSummary,
  type Scenario,
  type Submission,
} from '@axiia/shared'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  getMySubmissions,
  getPlaygroundRun,
  getPlaygroundRuns,
  getScenario,
} from '../lib/api'
import {
  clearPlaygroundSession,
  getPlaygroundSession,
  resolvePlaygroundSession,
  startTrackedPlaygroundRun,
  subscribePlaygroundSession,
  syncPlaygroundRun,
  type PlaygroundSession,
} from '../lib/playground-session'
import { formatDateTime, parseTimestampMs } from '../lib/datetime'

const runningStages = [
  {
    key: 'submitted',
    label: '提交',
    hint: '本次试炼场任务已创建。',
    shortLabel: '提交',
  },
  {
    key: 'preparing',
    label: '准备中',
    hint: '引擎正在初始化角色与上下文。',
    shortLabel: '准备中',
  },
  {
    key: 'dialogue',
    label: '对战中',
    hint: '双方正在按场景设定进行多轮对话。',
    shortLabel: '对战中',
  },
  {
    key: 'judging',
    label: '审讯阶段',
    hint: '裁判正在追问双方并整理关键论点。',
    shortLabel: '审讯阶段',
  },
  {
    key: 'completed',
    label: '完成',
    hint: '结果已写入记录。',
    shortLabel: '完成',
  },
] as const

type RunningStageKey = (typeof runningStages)[number]['key']

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function isRunFinished(run: PlaygroundRun | null) {
  if (!run) {
    return false
  }

  return (
    run.error != null ||
    run.scoreA != null ||
    run.scoreB != null ||
    run.winner != null
  )
}

function hasRunOutput(run: PlaygroundRun | null) {
  if (!run) {
    return false
  }

  return (
    run.transcript.length > 0 ||
    run.judgeTranscriptA.length > 0 ||
    run.judgeTranscriptB.length > 0
  )
}

function deriveRunningState(session: PlaygroundSession) {
  if (session.status === 'error') {
    return {
      activeIndex: 4,
      detail: session.error ?? '试炼场运行失败。',
      progressPercent: 100,
      stageKey: 'completed' as RunningStageKey,
      title: '运行失败',
    }
  }

  if (session.status === 'success' || isRunFinished(session.run)) {
    return {
      activeIndex: 4,
      detail: '结果已写入记录，可以查看完整 transcript 与裁判评分。',
      progressPercent: 100,
      stageKey: 'completed' as RunningStageKey,
      title: '对战已完成',
    }
  }

  if (!session.run) {
    return {
      activeIndex: 1,
      detail: '任务已经提交，正在等待首轮对话开始。',
      progressPercent: 18,
      stageKey: 'preparing' as RunningStageKey,
      title: '正在准备对战',
    }
  }

  const turns = session.run.transcript.length
  const judgeRoundsA = session.run.judgeTranscriptA.length
  const judgeRoundsB = session.run.judgeTranscriptB.length

  if (judgeRoundsA > 0 || judgeRoundsB > 0) {
    const totalJudgeProgress = judgeRoundsA + judgeRoundsB
    const completedJudging = Math.min(1, totalJudgeProgress / 2)
    const judgingComplete = judgeRoundsA >= 1 && judgeRoundsB >= 1

    return {
      activeIndex: 3,
      detail: judgingComplete
        ? '双方审讯已完成，正在汇总最终裁决。'
        : `审讯进度：A ${judgeRoundsA}/1 · B ${judgeRoundsB}/1`,
      progressPercent: 70 + completedJudging * 22,
      stageKey: 'judging' as RunningStageKey,
      title: judgingComplete ? '正在生成最终裁决' : '进入审讯阶段',
    }
  }

  if (turns > 0) {
    const dialogueProgress = Math.min(1, turns / Math.max(1, session.turnCount))

    return {
      activeIndex: 2,
      detail: `对话进度：已完成 ${turns}/${session.turnCount} 回合`,
      progressPercent: 28 + dialogueProgress * 38,
      stageKey: 'dialogue' as RunningStageKey,
      title: '双方正在对战',
    }
  }

  return {
    activeIndex: 1,
    detail: '引擎已启动，正在准备首轮发言。',
    progressPercent: 22,
    stageKey: 'preparing' as RunningStageKey,
    title: '正在准备对战',
  }
}

function buildRequestContentMap(scenario: Scenario) {
  return new Map(
    [...scenario.roleARequests, ...scenario.roleBRequests].map((request) => [
      request.id,
      request.content,
    ]),
  )
}

function buildInfoContentMap(items: Scenario['roleAHiddenInfo']) {
  return new Map(items.map((item) => [item.id, item.content]))
}

function ScenarioInfoPanel({ scenario }: { scenario: Scenario }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">场景资料</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-2">
        <Accordion defaultValue={['roles']}>
          <AccordionItem
            value="context"
            title="场景背景"
            triggerClassName="text-xs"
          >
            <p className="text-xs leading-5 text-(--foreground-subtle)">
              {scenario.context}
            </p>
          </AccordionItem>

          <AccordionItem
            value="roles"
            title="角色信息"
            triggerClassName="text-xs"
          >
            <div className="space-y-3">
              {(
                [
                  {
                    name: scenario.roleAName,
                    identity: scenario.roleAPublicIdentity,
                    goal: scenario.roleAMainGoal,
                    stance: scenario.roleAStance,
                    hiddenInfo: scenario.roleAHiddenInfo,
                    requests: scenario.roleARequests,
                    side: 'a',
                  },
                  {
                    name: scenario.roleBName,
                    identity: scenario.roleBPublicIdentity,
                    goal: scenario.roleBMainGoal,
                    stance: scenario.roleBStance,
                    hiddenInfo: scenario.roleBHiddenInfo,
                    requests: scenario.roleBRequests,
                    side: 'b',
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
                  <div className="space-y-1 text-[11px] leading-4 text-(--foreground-subtle)">
                    <p>
                      <span className="text-(--foreground-muted)">身份：</span>
                      {role.identity}
                    </p>
                    <p>
                      <span className="text-(--foreground-muted)">目标：</span>
                      {role.goal}
                    </p>
                    <p>
                      <span className="text-(--foreground-muted)">主张：</span>
                      {role.stance}
                    </p>
                  </div>
                  {role.hiddenInfo.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-medium text-(--foreground-muted) mb-1">
                        隐藏信息（{role.hiddenInfo.length} 条）
                      </p>
                      <ul className="space-y-0.5">
                        {role.hiddenInfo.map((item) => (
                          <li
                            key={item.id}
                            className="text-[11px] leading-4 text-(--foreground-subtle) pl-2 border-l-2 border-(--border-soft)"
                          >
                            {item.content}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {role.requests.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-medium text-(--foreground-muted) mb-1">
                        诉求（{role.requests.length} 条）
                      </p>
                      <ul className="space-y-0.5">
                        {role.requests.map((item) => (
                          <li
                            key={item.id}
                            className="text-[11px] leading-4 text-(--foreground-subtle) pl-2 border-l-2 border-(--border-soft)"
                          >
                            {item.content}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </AccordionItem>

          <AccordionItem
            value="rules"
            title="游戏规则"
            triggerClassName="text-xs"
          >
            <div className="space-y-2 text-[11px] leading-4 text-(--foreground-subtle)">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/3 px-2.5 py-2">
                  <p className="text-(--foreground-muted)">对话回合</p>
                  <p className="text-sm font-semibold text-(--foreground)">
                    {scenario.turnCount}
                  </p>
                </div>
                <div className="rounded-lg bg-white/3 px-2.5 py-2">
                  <p className="text-(--foreground-muted)">虚假信息数</p>
                  <p className="text-sm font-semibold text-(--foreground)">
                    {scenario.falseInfoCount}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-(--foreground-muted) mb-1">计分规则</p>
                <div className="space-y-0.5 pl-2 border-l-2 border-(--border-soft)">
                  <p>核心目标得分：{scenario.mainGoalScore} 分</p>
                  <p>
                    每条真诉求被采纳：+{scenario.trueRequestScore} 分（共{' '}
                    {scenario.trueRequestCount} 条真诉求参与判定）
                  </p>
                  <p>每条假诉求被采纳：{scenario.falseRequestPenalty} 分</p>
                </div>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            value="boundary"
            title="边界约束"
            triggerClassName="text-xs"
          >
            <p className="text-xs leading-5 text-(--foreground-subtle)">
              {scenario.boundaryConstraints}
            </p>
          </AccordionItem>

          <AccordionItem
            value="judge"
            title="裁判规则"
            triggerClassName="text-xs"
          >
            <p className="whitespace-pre-wrap text-xs leading-5 text-(--foreground-subtle)">
              {scenario.judgePrompt}
            </p>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

function InfoAssignmentPanel({
  assignment,
  scenario,
}: {
  assignment: InfoAssignment
  scenario: Scenario
}) {
  const roleAFalse = new Set(assignment.roleAFalseInfoIds)
  const roleBFalse = new Set(assignment.roleBFalseInfoIds)
  const roleATrue = new Set(assignment.roleATrueRequestIds)
  const roleBTrue = new Set(assignment.roleBTrueRequestIds)

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">本局信息分配</CardTitle>
        <p className="text-[11px] text-(--foreground-muted)">
          每场比赛随机决定哪些隐藏信息为真、哪些为假，以及哪些诉求参与判定。
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {(
          [
            {
              name: scenario.roleAName,
              hiddenInfo: scenario.roleAHiddenInfo,
              requests: scenario.roleARequests,
              falseIds: roleAFalse,
              trueReqIds: roleATrue,
              side: 'a',
            },
            {
              name: scenario.roleBName,
              hiddenInfo: scenario.roleBHiddenInfo,
              requests: scenario.roleBRequests,
              falseIds: roleBFalse,
              trueReqIds: roleBTrue,
              side: 'b',
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
                color: role.side === 'a' ? 'var(--accent)' : 'var(--info)',
              }}
            >
              {role.name}
            </p>
            {role.hiddenInfo.length > 0 ? (
              <div>
                <p className="text-[11px] font-medium text-(--foreground-muted) mb-1">
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
            ) : null}
            {role.requests.length > 0 ? (
              <div>
                <p className="text-[11px] font-medium text-(--foreground-muted) mb-1">
                  诉求
                </p>
                <ul className="space-y-1">
                  {role.requests.map((item) => {
                    const isTrue = role.trueReqIds.has(item.id)
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
                          {isTrue ? '参与' : '不参与'}
                        </span>
                        <span className="text-(--foreground-subtle)">
                          {item.content}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function JudgeDecisionPanel({
  decision,
  scenario,
}: {
  decision: JudgeDecision
  scenario: Scenario
}) {
  const requestEntries = Object.entries(decision.requests)
  const requestContentMap = buildRequestContentMap(scenario)

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">裁判裁决</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        <div className="rounded-lg border border-(--border-soft) bg-white/2 p-3">
          <p className="text-[11px] font-medium text-(--foreground-muted) mb-1">
            主张裁决
          </p>
          <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
            {decision.judgment}
          </p>
        </div>

        {requestEntries.length > 0 ? (
          <div className="rounded-lg border border-(--border-soft) bg-white/2 p-3">
            <p className="text-[11px] font-medium text-(--foreground-muted) mb-2">
              诉求裁定
            </p>
            <div className="space-y-1.5">
              {requestEntries.map(([requestId, ruling]) => {
                const isApproved = ruling === '同意'
                return (
                  <div
                    key={requestId}
                    className="flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <p className="text-(--foreground-subtle)">
                        <span className="font-medium text-(--foreground-muted)">
                          [{requestId}]
                        </span>{' '}
                        {requestContentMap.get(requestId) ?? '未知请求'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        isApproved
                          ? 'bg-[rgba(74,222,128,0.15)] text-(--success)'
                          : 'bg-[rgba(224,74,47,0.15)] text-(--accent)'
                      }`}
                    >
                      {ruling}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {decision.speech ? (
          <div className="rounded-lg border border-(--border-soft) bg-white/2 p-3">
            <p className="text-[11px] font-medium text-(--foreground-muted) mb-1">
              裁判宣判词
            </p>
            <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap italic">
              {decision.speech}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function RunResult({
  run,
  scenario,
}: {
  run: PlaygroundRun
  scenario: Scenario
}) {
  return (
    <div className="space-y-6">
      {/* Scoring summary - always visible at top */}
      <Card>
        <CardContent className="py-5">
          <div className="grid grid-cols-3 divide-x divide-(--border-soft) rounded-xl border border-(--border-soft)">
            <div className="px-5 py-4">
              <p className="panel-label">{scenario.roleAName}</p>
              <p className="mt-2 tabular-nums text-2xl font-black tracking-tight text-(--foreground)">
                {run.scoreA ?? '—'}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="panel-label">{scenario.roleBName}</p>
              <p className="mt-2 tabular-nums text-2xl font-black tracking-tight text-(--foreground)">
                {run.scoreB ?? '—'}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="panel-label">胜者</p>
              <p className="mt-2 text-xl font-semibold text-(--foreground)">
                {run.winner === 'a'
                  ? scenario.roleAName
                  : run.winner === 'b'
                    ? scenario.roleBName
                    : run.winner === 'draw'
                      ? '平局'
                      : '—'}
              </p>
            </div>
          </div>
          {run.reasoning ? (
            <div className="mt-4 rounded-xl border border-(--border-soft) bg-white/2 p-4">
              <p className="panel-label">裁判宣判词</p>
              <pre className="panel-copy mt-1 whitespace-pre-wrap font-sans text-xs leading-5">
                {run.reasoning}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Info assignment & judge decision */}
      {run.infoAssignment || run.judgeDecision ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {run.infoAssignment ? (
            <InfoAssignmentPanel
              assignment={run.infoAssignment}
              scenario={scenario}
            />
          ) : null}
          {run.judgeDecision ? (
            <JudgeDecisionPanel
              decision={run.judgeDecision}
              scenario={scenario}
            />
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>对话记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {run.transcript.length ? (
            (() => {
              const turnKeyCounts = new Map<string, number>()

              return run.transcript.map((turn, index) => {
                const baseKey = `${turn.speaker}:${turn.content}`
                const occurrence = (turnKeyCounts.get(baseKey) ?? 0) + 1
                turnKeyCounts.set(baseKey, occurrence)
                const isA = turn.speaker === 'a'
                const roleName = isA ? scenario.roleAName : scenario.roleBName

                return (
                  <div
                    key={`${baseKey}:${occurrence}`}
                    className={`flex flex-col gap-1.5 ${isA ? 'items-start' : 'items-end'}`}
                  >
                    <p
                      className="px-1 text-xs font-semibold"
                      style={{ color: isA ? 'var(--accent)' : 'var(--info)' }}
                    >
                      {roleName}
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
            })()
          ) : (
            <p className="text-sm text-(--foreground-subtle)">对话尚未开始。</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {(
          [
            {
              transcript: run.judgeTranscriptA,
              roleName: scenario.roleAName,
              side: 'a' as const,
            },
            {
              transcript: run.judgeTranscriptB,
              roleName: scenario.roleBName,
              side: 'b' as const,
            },
          ] as const
        ).map(({ transcript, roleName, side }) => (
          <Card key={side}>
            <CardHeader>
              <CardTitle>审讯结果 · {roleName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transcript.length ? (
                transcript.map((item) => {
                  const opponentInfoMap = buildInfoContentMap(
                    side === 'a'
                      ? scenario.roleBHiddenInfo
                      : scenario.roleAHiddenInfo,
                  )

                  return (
                    <div
                      key={item.round}
                      className="overflow-hidden rounded-xl border border-(--border-soft)"
                    >
                      <div className="flex gap-3 border-b border-(--border-soft) bg-white/2 px-4 py-3">
                        <div className="min-w-0">
                          <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-(--foreground-muted)">
                            {scenario.judgeName} · 第 {item.round} 轮
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
                            {roleName} 选择 {item.selectedInfoId ?? '未作答'}
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
                        {item.selectedInfoId ? (
                          <p className="text-[11px] leading-5 text-(--foreground-muted)">
                            对应信息：
                            {opponentInfoMap.get(item.selectedInfoId) ??
                              '未知信息'}
                          </p>
                        ) : null}
                        <div>
                          <p
                            className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em]"
                            style={{
                              color:
                                side === 'a' ? 'var(--accent)' : 'var(--info)',
                            }}
                          >
                            {roleName} 回答
                          </p>
                          <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-(--foreground-subtle)">暂无问答。</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function RunHistoryItem({
  isPending,
  isSelected,
  onSelect,
  roleAName,
  roleBName,
  run,
}: {
  isPending: boolean
  isSelected: boolean
  onSelect: () => void
  roleAName: string
  roleBName: string
  run: PlaygroundRunSummary
}) {
  const winnerLabel = isPending
    ? '进行中'
    : run.winner === 'a'
      ? roleAName
      : run.winner === 'b'
        ? roleBName
        : run.winner === 'draw'
          ? '平局'
          : run.error
            ? 'ERR'
            : '—'
  const winnerColor = isPending
    ? 'text-(--accent)'
    : run.winner === 'a' || run.winner === 'b'
      ? 'text-(--success)'
      : run.winner === 'draw'
        ? 'text-(--foreground-subtle)'
        : run.error
          ? 'text-(--accent)'
          : 'text-(--foreground-muted)'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
        isSelected
          ? 'border-[rgba(224,74,47,0.35)] bg-[rgba(224,74,47,0.1)]'
          : 'border-(--border-soft) bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] text-(--foreground-muted)">
            {formatDateTime(run.createdAt, { second: '2-digit' })}
          </p>
          {run.scoreA != null && run.scoreB != null ? (
            <p className="text-xs text-(--foreground-subtle)">
              {run.scoreA} : {run.scoreB}
            </p>
          ) : null}
        </div>
        <span className={`text-xs font-semibold ${winnerColor}`}>
          {winnerLabel}
        </span>
      </div>
    </button>
  )
}

function ProgressPanel({
  elapsedSeconds,
  session,
}: {
  elapsedSeconds: number
  isRefreshing: boolean
  onRefresh: () => void
  session: PlaygroundSession
}) {
  const progress = deriveRunningState(session)
  const visibleRunId = session.runId ?? session.run?.id ?? null

  return (
    <Card>
      <CardContent className="py-5">
        {/* Live indicator row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--accent) opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--accent)" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--accent)">
              对战进行中
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-(--foreground-muted)">
            {visibleRunId ? <span>#{visibleRunId}</span> : null}
            <span className="font-mono tabular-nums text-(--foreground)">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Vertical stage timeline */}
        <div className="mt-5">
          {runningStages.map((stage, index) => {
            const isDone = index < progress.activeIndex
            const isCurrent = index === progress.activeIndex
            const isLast = index === runningStages.length - 1

            return (
              <div key={stage.key} className="flex gap-3">
                {/* Dot + connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-[3px] flex h-3 w-3 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isCurrent
                        ? 'ring-[3px] ring-[rgba(224,74,47,0.25)] ring-offset-1 ring-offset-(--surface) bg-(--accent)'
                        : isDone
                          ? 'bg-(--foreground-muted)'
                          : 'border border-(--border-soft) bg-transparent'
                    }`}
                  >
                    {isDone ? (
                      <svg
                        className="h-1.5 w-1.5"
                        viewBox="0 0 6 6"
                        fill="none"
                        stroke="var(--background)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      >
                        <path d="M1 3l1.5 1.5L5 1.5" />
                      </svg>
                    ) : null}
                  </div>
                  {!isLast ? (
                    <div
                      className={`my-1 min-h-4 w-px flex-1 transition-colors ${
                        isDone
                          ? 'bg-(--foreground-muted)'
                          : 'bg-(--border-soft)'
                      }`}
                    />
                  ) : null}
                </div>

                {/* Stage label + detail */}
                <div className={`min-w-0 ${isLast ? 'pb-0' : 'pb-3'}`}>
                  <p
                    className={`text-sm transition-colors ${
                      isCurrent
                        ? 'font-semibold text-(--foreground)'
                        : isDone
                          ? 'text-(--foreground-muted)'
                          : 'text-(--border)'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {isCurrent ? (
                    <p className="mt-1 text-xs leading-5 text-(--foreground-subtle)">
                      {progress.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall progress line */}
        <div className="relative mt-4 h-px bg-(--border-soft)">
          <div
            className="absolute inset-y-0 left-0 bg-(--accent) transition-[width] duration-700"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        <p className="mt-3 text-xs text-(--foreground-muted)">
          可以离开此页面，稍后返回继续查看。
        </p>
      </CardContent>
    </Card>
  )
}

function findCandidateRunSummary(
  session: PlaygroundSession,
  summaries: PlaygroundRunSummary[],
) {
  if (session.runId) {
    return summaries.find((summary) => summary.id === session.runId) ?? null
  }

  const startedAt = session.startedAt - 5000

  return (
    summaries.find(
      (summary) => parseTimestampMs(summary.createdAt) >= startedAt,
    ) ?? null
  )
}

function createRunSummary(run: PlaygroundRun): PlaygroundRunSummary {
  return {
    createdAt: run.createdAt,
    error: run.error,
    id: run.id,
    scoreA: run.scoreA,
    scoreB: run.scoreB,
    submissionId: run.submissionId,
    winner: run.winner,
  }
}

function upsertRunSummary(
  summaries: PlaygroundRunSummary[],
  nextRun: PlaygroundRun,
) {
  const nextSummary = createRunSummary(nextRun)
  const remaining = summaries.filter((summary) => summary.id !== nextSummary.id)

  return [nextSummary, ...remaining].sort(
    (left, right) =>
      parseTimestampMs(right.createdAt) - parseTimestampMs(left.createdAt),
  )
}

export function PlaygroundPage() {
  const { submissionId: submissionIdParam } = useParams<{
    submissionId: string
  }>()
  const submissionId = Number(submissionIdParam)
  const navigate = useNavigate()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [runSummaries, setRunSummaries] = useState<PlaygroundRunSummary[]>([])
  const [selectedRun, setSelectedRun] = useState<PlaygroundRun | null>(null)
  const [activeSession, setActiveSession] = useState<PlaygroundSession | null>(
    () =>
      Number.isInteger(submissionId) && submissionId > 0
        ? getPlaygroundSession(submissionId)
        : null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    activeSession
      ? Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000))
      : 0,
  )

  useEffect(() => {
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return
    }

    return subscribePlaygroundSession(submissionId, (session) => {
      setActiveSession(session)

      if (!session) {
        setElapsedSeconds(0)
        return
      }

      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)),
      )

      if (session.status === 'success' && session.run) {
        setSelectedRun(session.run)
        setRunSummaries((current) => upsertRunSummary(current, session.run!))
        setError(null)
      } else if (session.status === 'error') {
        setError(session.error ?? '试炼场运行失败')
      }
    })
  }, [submissionId])

  useEffect(() => {
    if (!submissionId) {
      return
    }

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const allSubmissions = await getMySubmissions()
        const sub =
          allSubmissions.find((item) => item.id === submissionId) ?? null
        setSubmission(sub)

        if (!sub) {
          setError('找不到该版本')
          return
        }

        const [scenarioData, runs] = await Promise.all([
          getScenario(sub.scenarioId),
          getPlaygroundRuns(submissionId),
        ])

        setScenario(scenarioData)
        setRunSummaries(runs)

        const session = getPlaygroundSession(submissionId)
        const resolvedSession = resolvePlaygroundSession(session, sub, runs)

        if (resolvedSession.kind === 'run' && session) {
          const fullRun = await getPlaygroundRun(
            submissionId,
            resolvedSession.runId,
          )
          syncPlaygroundRun(submissionId, session.requestId, fullRun)
          setSelectedRun(fullRun)
          return
        }

        if (resolvedSession.kind === 'pending') {
          setSelectedRun(null)
          return
        }

        if (resolvedSession.kind === 'stale') {
          clearPlaygroundSession(submissionId)
          setSelectedRun(null)
        }

        if (session?.run && resolvedSession.kind !== 'stale') {
          setSelectedRun(session.run)
          return
        }

        const latestFinishedRun = runs.find(
          (run) =>
            run.error != null ||
            run.scoreA != null ||
            run.scoreB != null ||
            run.winner != null,
        )

        if (latestFinishedRun) {
          const fullRun = await getPlaygroundRun(
            submissionId,
            latestFinishedRun.id,
          )
          setSelectedRun(fullRun)
        } else {
          setSelectedRun(null)
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载失败')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [submissionId])

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'running') {
      return
    }

    setElapsedSeconds(
      Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000)),
    )
    const timer = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000)),
      )
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeSession])

  const refreshActiveRun = useCallback(async () => {
    if (!activeSession || activeSession.status !== 'running') {
      return
    }

    try {
      setIsRefreshing(true)
      const summaries = await getPlaygroundRuns(submissionId)
      setRunSummaries(summaries)

      const candidate = findCandidateRunSummary(activeSession, summaries)

      if (!candidate) {
        return
      }

      const fullRun = await getPlaygroundRun(submissionId, candidate.id)
      syncPlaygroundRun(submissionId, activeSession.requestId, fullRun)
      setRunSummaries((current) => upsertRunSummary(current, fullRun))

      if (isRunFinished(fullRun)) {
        setSelectedRun(fullRun)
        setError(fullRun.error ?? null)
      }
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : '刷新试炼场状态失败',
      )
    } finally {
      setIsRefreshing(false)
    }
  }, [activeSession, submissionId])

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'running') {
      return
    }

    let cancelled = false

    const sync = async () => {
      if (cancelled) {
        return
      }

      await refreshActiveRun()
    }

    void sync()
    const timer = window.setInterval(() => {
      void sync()
    }, 4000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [activeSession, refreshActiveRun])

  const handleRun = () => {
    if (!submission || !scenario) {
      return
    }

    setError(null)
    setSelectedRun(null)

    startTrackedPlaygroundRun({
      scenarioId: scenario.id,
      submissionCreatedAt: submission.createdAt,
      submissionId,
      turnCount: scenario.turnCount,
    })
  }

  const handleSelectRun = async (summary: PlaygroundRunSummary) => {
    if (selectedRun?.id === summary.id) {
      return
    }

    try {
      const fullRun = await getPlaygroundRun(submissionId, summary.id)
      setSelectedRun(fullRun)
    } catch (selectError) {
      setError(
        selectError instanceof Error ? selectError.message : '加载测试记录失败',
      )
    }
  }

  const modelLabel = useMemo(
    () =>
      submission
        ? (modelOptions.find((option) => option.id === submission.model)
            ?.label ?? submission.model)
        : null,
    [submission],
  )

  const activeRunId = activeSession?.runId ?? activeSession?.run?.id ?? null
  const isRunning = activeSession?.status === 'running'
  const visibleRun = isRunning ? (activeSession?.run ?? null) : selectedRun

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-white/8" />
        <div className="h-[520px] animate-pulse rounded-xl bg-white/5" />
      </div>
    )
  }

  if (!submission || !scenario) {
    return <p className="text-sm text-(--accent)">{error ?? '找不到该版本'}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/scenarios/${submission.scenarioId}`)}
            className="mb-2 flex items-center gap-1 text-xs text-(--foreground-muted) hover:text-(--foreground-subtle)"
          >
            <ArrowLeft className="h-3 w-3" />
            返回工坊
          </button>
          <h1 className="page-title">试炼场</h1>
          <p className="page-subtitle">测试结果与版本绑定，不写入正式赛事。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{scenario.subject}</Badge>
          <Badge tone="info">v{submission.version}</Badge>
          {modelLabel ? <Badge tone="warning">{modelLabel}</Badge> : null}
        </div>
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── Left: Main content area ── */}
        <div className="space-y-6">
          {isRunning && activeSession ? (
            <>
              <ProgressPanel
                elapsedSeconds={elapsedSeconds}
                isRefreshing={isRefreshing}
                onRefresh={() => void refreshActiveRun()}
                session={activeSession}
              />
              {hasRunOutput(activeSession.run) ? (
                <RunResult run={activeSession.run!} scenario={scenario} />
              ) : null}
            </>
          ) : visibleRun ? (
            <RunResult run={visibleRun} scenario={scenario} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-24">
                <p className="text-sm text-(--foreground-subtle)">
                  点击「运行对战」开始一次新的试炼场测试。
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Sidebar (sticky) ── */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:scrollbar-thin space-y-4">
          <Card>
            <CardContent className="space-y-3 py-4">
              <Button
                className="w-full"
                disabled={isRunning}
                onClick={handleRun}
              >
                {isRunning ? '对战进行中...' : '运行对战'}
              </Button>

              <Accordion className="rounded-xl border border-(--border-soft) px-3">
                <AccordionItem
                  value="promptA"
                  title={scenario.roleAName}
                  triggerClassName="text-xs"
                >
                  <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
                    {submission.promptA}
                  </p>
                </AccordionItem>
                <AccordionItem
                  value="promptB"
                  title={scenario.roleBName}
                  triggerClassName="text-xs"
                >
                  <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap">
                    {submission.promptB}
                  </p>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <ScenarioInfoPanel scenario={scenario} />

          {runSummaries.length > 0 ? (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">测试历史</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                {runSummaries.map((run) => (
                  <RunHistoryItem
                    key={run.id}
                    isPending={run.id === activeRunId && isRunning}
                    isSelected={selectedRun?.id === run.id}
                    onSelect={() => void handleSelectRun(run)}
                    roleAName={scenario.roleAName}
                    roleBName={scenario.roleBName}
                    run={run}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
