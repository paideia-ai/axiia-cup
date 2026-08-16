import { Bot, Clock, Hammer } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { builder, catalog, myAgents } from '../api/client'
import type { ScenarioSummary, Side } from '../api/types'
import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { gateMet, sideMet, sideProgressText } from '../lib/gate'
import { messageOf, useAsync } from '../lib/use-async'
import { roleOfOptions, rolesForSide, scenarioModule } from '../scenarios'

// DA — 场景介绍（A4）：独立教育页，四层渐进（GLANCE → 双方 → 裁判与计分 →
// 深读），页内没有任何编辑框（#42）。教育内容来自前端场景模块；缺席的场景
// 每层都画引导式空态轮廓（#54），不留空白也不摆假数据。judgeOsPrompt 永不
// 下发（#51）：这里只展示可公开的裁判摘要。统计 P6 点亮（#38，与 D 卡同一
// 展示）：stats 到手（服务端已把关门槛 #39）就替换 GLANCE 层的空态轮廓。
export function ScenarioDetailPage() {
  const { scenarioId = '' } = useParams()
  const navigate = useNavigate()
  const [pending, setPending] = useState<string | null>(null)
  const [buildError, setBuildError] = useState<string | null>(null)
  const module = scenarioModule(scenarioId)
  const education = module?.education ?? null

  // 详情端点对 side 参数不敏感（presets 两侧都回），固定取一次即可。
  const { data, error, loading } = useAsync(
    () => catalog.scenario(scenarioId, 'a'),
    [scenarioId],
  )

  // P13：该侧已有策略时，DA 不再猜「你要编辑哪个」——按钮组换成「再建一个 /
  // 查看我的（N）」。清单失败按「没有」处理（回落今天的「去构建」）。
  const { data: mine } = useAsync(
    () => myAgents.list().catch(() => null),
    [scenarioId],
  )
  const mineOf = (side: Side) =>
    mine?.scenarios.find((item) => item.scenarioID === scenarioId)
      ?.sides[side] ?? []

  // 懒创建（get-or-create，仅在点击时调用）：去构建进 /build，查看进主页。
  const enter = async (side: Side, target: 'build' | 'view') => {
    setPending(`${side}:${target}`)
    setBuildError(null)
    try {
      const { agentID } = await builder.ensure({
        scenarioID: scenarioId,
        side,
      })
      navigate(
        target === 'build'
          ? `/agents/${agentID}/build?scenario=${scenarioId}&side=${side}`
          : `/agents/${agentID}`,
      )
    } catch (cause) {
      setBuildError(messageOf(cause, '创建智能体失败'))
      setPending(null)
    }
  }

  return (
    <div className='space-y-6'>
      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : data
        ? (
          <>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
                  {data.summary.title}
                </h1>
                <p className='mt-1 max-w-2xl text-sm text-(--foreground-subtle)'>
                  {data.summary.subject}
                </p>
                <p className='mt-3 text-xs text-(--foreground-muted)'>
                  {data.summary.sideAName} 对 {data.summary.sideBName} ·{' '}
                  {data.summary.turnCount} 轮
                </p>
              </div>
              <GateStatus summary={data.summary} />
            </div>

            {/* 第 1 层 GLANCE：钩子 + 元信息，统计槽位走引导式空态（#38/#54） */}
            <Card>
              <CardContent className='space-y-3 pt-5'>
                <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                  一眼看懂
                </p>
                {education
                  ? (
                    <>
                      <p className='text-base leading-relaxed text-(--foreground)'>
                        {education.hook}
                      </p>
                      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-(--foreground-subtle)'>
                        <span title={`难度 ${education.difficulty} / 3`}>
                          难度{' '}
                          <span className='tracking-[0.12em] text-(--warning)'>
                            {'★'.repeat(education.difficulty)}
                            <span className='text-(--foreground-muted)'>
                              {'☆'.repeat(3 - education.difficulty)}
                            </span>
                          </span>
                        </span>
                        <span className='inline-flex items-center gap-1'>
                          <Clock className='h-3.5 w-3.5' />
                          一场约 {education.minutes} 分钟
                        </span>
                        <span>{data.summary.turnCount} 轮对话</span>
                        {education.noviceFriendly
                          ? <Badge tone='success'>适合新手</Badge>
                          : null}
                      </div>
                      {/* #38/#39/#54：stats 到手即点亮，缺席保持引导式空态 */}
                      {statsLine(data.summary)
                        ? (
                          <p className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'>
                            <span className='mr-2 font-semibold tracking-[0.06em] text-(--foreground-muted)'>
                              侧方胜率
                            </span>
                            {statsLine(data.summary)}
                          </p>
                        )
                        : (
                          <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                            侧方胜率 · 对局数 — 数据积累中，早期对局正在进行
                          </p>
                        )}
                    </>
                  )
                  : (
                    <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                      场景导读整理中——难度、预计时长与玩法概览将在这里出现
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* 第 2 层 双方：各自是谁、胜利条件、入场角色 + 各侧构建入口 */}
            <div className='space-y-2'>
              <h2 className='text-sm font-semibold text-(--foreground)'>
                双方与胜利条件
              </h2>
              <div className='grid gap-3 sm:grid-cols-2'>
                {([
                  ['a', data.summary.sideAName, data.summary.sideALabel],
                  ['b', data.summary.sideBName, data.summary.sideBLabel],
                ] as const).map(([key, name, label]) => {
                  const roles = rolesForSide(module, key)
                  return (
                    <Card key={key}>
                      <CardContent className='space-y-3 pt-5'>
                        <div className='space-y-1'>
                          <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                            {key === 'a' ? '甲方' : '乙方'}
                          </p>
                          <p className='text-base font-semibold text-(--foreground)'>
                            {name}
                          </p>
                          {label
                            ? (
                              <p className='text-sm text-(--foreground-subtle)'>
                                {label}
                              </p>
                            )
                            : null}
                        </div>

                        {education
                          ? (
                            <div className='space-y-1'>
                              <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                                胜利条件
                              </p>
                              <p className='text-sm leading-relaxed text-(--foreground-subtle)'>
                                {education.winConditions[key]}
                              </p>
                            </div>
                          )
                          : (
                            <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                              胜利条件文案整理中——先以双方立场为准
                            </p>
                          )}

                        {roles.length > 0
                          ? (
                            <div className='space-y-1.5'>
                              <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                                可选入场角色（在构建器中选定）
                              </p>
                              {roles.map((role) => (
                                <div
                                  key={role.key}
                                  className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2'
                                >
                                  <p className='text-sm font-medium text-(--foreground)'>
                                    {role.name}
                                  </p>
                                  <p className='mt-0.5 text-xs text-(--foreground-subtle)'>
                                    {role.pitch}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )
                          : null}

                        {/* P13：先说清「我这一侧已经有什么」，再给动作 */}
                        {mineOf(key).length > 0
                          ? (
                            <p className='text-xs text-(--foreground-muted)'>
                              你已有 {mineOf(key).length} 个{name}：{' '}
                              {mineOf(key)
                                .map((agent) =>
                                  agent.name ?? `#${agent.agentID}`
                                )
                                .join(' · ')}
                            </p>
                          )
                          : null}
                        <div className='flex flex-wrap items-center gap-2 pt-1'>
                          {mineOf(key).length === 0
                            ? (
                              <Button
                                size='sm'
                                data-testid={key === 'a'
                                  ? 'build-agent'
                                  : `build-agent-${key}`}
                                disabled={pending != null}
                                onClick={() => void enter(key, 'build')}
                              >
                                <Hammer className='mr-1.5 h-3.5 w-3.5' />
                                {pending === `${key}:build`
                                  ? '创建中…'
                                  : '去构建'}
                              </Button>
                            )
                            : (
                              <>
                                <Button
                                  size='sm'
                                  onClick={() =>
                                    navigate(
                                      `/my-agents?new=${key}&scenario=${scenarioId}`,
                                    )}
                                >
                                  <Hammer className='mr-1.5 h-3.5 w-3.5' />
                                  再建一个{name}
                                </Button>
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  onClick={() => navigate('/my-agents')}
                                >
                                  <Bot className='mr-1.5 h-3.5 w-3.5' />
                                  查看我的{name}（{mineOf(key).length}）
                                </Button>
                              </>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {buildError
                ? <p className='text-sm text-(--accent)'>{buildError}</p>
                : null}
              {/* #42：DA 不设编辑框；构建智能体在构建器页进行。 */}
              <p className='text-xs text-(--foreground-muted)'>
                本页只讲规则，不设编辑框；点「去构建」为该方构建智能体。
              </p>
            </div>

            {/* 第 3 层 裁判与计分（默认展开）+ 第 4 层 深读（默认收起） */}
            <Card>
              <CardContent className='pt-2 pb-2'>
                <Accordion defaultValue={['judge-scoring']}>
                  <AccordionItem
                    value='judge-scoring'
                    title='裁判与计分 · 谁来判、怎么算分'
                  >
                    <div className='space-y-4'>
                      {education
                        ? (
                          <>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                                裁判是谁 · 怎么判
                              </p>
                              <p className='whitespace-pre-line text-sm leading-relaxed text-(--foreground-subtle)'>
                                {education.judgeSummary}
                              </p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                                计分规则
                              </p>
                              <p className='whitespace-pre-line text-sm leading-relaxed text-(--foreground-subtle)'>
                                {education.scoring}
                              </p>
                            </div>
                          </>
                        )
                        : (
                          <>
                            <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                              裁判说明整理中——谁来判、按什么标准，将在这里出现
                            </p>
                            <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                              计分规则整理中——胜负判定与加减分细则将在这里出现
                            </p>
                          </>
                        )}

                      {data.stages.length > 0
                        ? (
                          <div className='space-y-1.5'>
                            <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                              对局流程
                            </p>
                            <ol className='space-y-1.5'>
                              {data.stages.map((stage, index) => (
                                <li
                                  key={stage.id}
                                  className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-sm text-(--foreground-subtle)'
                                >
                                  <span className='mr-2 font-mono text-xs text-(--foreground-muted)'>
                                    {index + 1}
                                  </span>
                                  {stage.title}
                                  {stage.channels.length > 1
                                    ? (
                                      <span className='ml-2 text-xs text-(--foreground-muted)'>
                                        {stage.channels.map((c) => c.label)
                                          .join(' / ')}
                                      </span>
                                    )
                                    : null}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )
                        : null}
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    value='deep'
                    title='深读 · 背景故事与隐藏目标玩法'
                  >
                    <div className='space-y-4'>
                      {education
                        ? (
                          <>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                                背景故事
                              </p>
                              <p className='whitespace-pre-line text-sm leading-relaxed text-(--foreground-subtle)'>
                                {education.background}
                              </p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                                隐藏目标怎么玩
                              </p>
                              <p className='whitespace-pre-line text-sm leading-relaxed text-(--foreground-subtle)'>
                                {education.hiddenGoalHowTo}
                              </p>
                            </div>
                          </>
                        )
                        : (
                          <>
                            <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                              背景故事整理中——完整叙事背景将在这里出现
                            </p>
                            <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                              隐藏目标玩法说明整理中——若该场景没有隐藏目标机制，也会在这里如实说明
                            </p>
                          </>
                        )}
                    </div>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {data.presets.length > 0
              ? (
                <div className='space-y-2'>
                  <h2 className='text-sm font-semibold text-(--foreground)'>
                    预设对手
                  </h2>
                  <div className='flex flex-wrap gap-2'>
                    {data.presets.map((preset) => (
                      <Badge key={preset.key} tone='info'>
                        {preset.label} ·{' '}
                        {roleOfOptions(module, preset.options)?.name ??
                          (preset.side === 'a'
                            ? data.summary.sideAName
                            : data.summary.sideBName)} · {preset.modelID}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
              : null}
          </>
        )
        : null}
    </div>
  )
}

// #38/#39 统计一行（与 D 卡 catalog.tsx 的 statsLine 同一口径）：N 场 ·
// 甲侧 x% / 乙侧 y%。胜率是 0..1 分数；平局等未分胜负的场次让两侧合计可
// 小于 100%，因此各自独立取整，不做 100-x。
function statsLine(summary: ScenarioSummary): string | null {
  const stats = summary.stats
  if (!stats) return null
  const pct = (rate: number) => `${Math.round(rate * 100)}%`
  return `${stats.battleCount} 场 · ${summary.sideAName} ${
    pct(stats.sideWinRate.a)
  } / ${summary.sideBName} ${pct(stats.sideWinRate.b)}`
}

// DA 门槛卡（#65，mock V16）：有按侧进度就点名到侧——商鞅 1/1 ✓ · 甘龙 0/1；
// gateProgress 缺席（老服务器）时回落 P1 的静态徽章（#54 不摆假进度）。
function GateStatus({ summary }: { summary: ScenarioSummary }) {
  const progress = summary.gateProgress ?? null
  if (!progress) {
    return (
      <Badge tone={summary.gateUnlocked ? 'success' : 'info'}>
        {summary.gateUnlocked ? 'PvP 已解锁' : 'PvE 阶段'}
      </Badge>
    )
  }
  if (gateMet(progress)) {
    return <Badge tone='success'>✓ PVP 已解锁</Badge>
  }
  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      <span className='text-xs text-(--foreground-muted)'>
        每侧各赢 ≥{progress.a.needed} 场 NPC 练习解锁 PVP
      </span>
      {(['a', 'b'] as const).map((which) => (
        <Badge
          key={which}
          tone={sideMet(progress[which]) ? 'success' : 'info'}
        >
          {which === 'a' ? summary.sideAName : summary.sideBName}{' '}
          {sideProgressText(progress[which])}
          {sideMet(progress[which]) ? ' ✓' : ''}
        </Badge>
      ))}
    </div>
  )
}
