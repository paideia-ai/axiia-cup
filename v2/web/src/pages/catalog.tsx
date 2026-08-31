import { Lock, Sparkles, Unlock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { catalog } from '../api/client'
import type { ScenarioSummary } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { gateMet, sideProgressText } from '../lib/gate'
import { useAsync } from '../lib/use-async'
import { scenarioModule } from '../scenarios'
import { tm } from '../testmode/mark'

// D 卡（A4）：标题/学科/双方/轮数/门槛徽章来自服务端；难度·时长·适合新手
// （#40）来自前端场景模块的编辑内容。门槛徽章 P2 起按侧进度显示（#65，
// mock V16 的紧凑形态「PVP 解锁 1/1·0/1」）；gateProgress 缺席（老服务器）
// 时回落到 P1 的静态 PvE/PvP 徽章（#54）。统计 P6 点亮（#38/#39）：展示门槛
// 由服务端把关——stats 到手即显示对局数+侧方胜率，缺席（未过门槛/老服务器）
// 时按 #54 只画引导式空态轮廓、绝不摆零或假数字。新上线（#54，W8 选 A）：
// onlineAt 最新的场景固定插在第 2 位 + 「新上线」徽章；字段缺席（老服务器）
// 时保持服务端原序、无徽章。

// onlineAt 最新的场景；全部缺席（老服务器）→ null。
function newestOnline(list: ScenarioSummary[]): ScenarioSummary | null {
  let newest: ScenarioSummary | null = null
  let newestAt = Number.NEGATIVE_INFINITY
  for (const item of list) {
    const at = item.onlineAt
    if (at == null || at <= newestAt) continue
    newest = item
    newestAt = at
  }
  return newest
}

// #54 固定第 2 位（mock V-ref scenarios.tsx 的口径）：抽出新上线的那张，
// 插回 index 1；其余保持服务端原序。
function pinSecond(
  list: ScenarioSummary[],
  fresh: ScenarioSummary,
): ScenarioSummary[] {
  const rest = list.filter((item) => item.id !== fresh.id)
  return [...rest.slice(0, 1), fresh, ...rest.slice(1)]
}

// #38/#39 统计一行：N 场 · 甲侧 x% / 乙侧 y%（胜率是 0..1 分数；平局等
// 未分胜负的场次让两侧合计可小于 100%，因此各自独立取整，不做 100-x）。
function statsLine(summary: ScenarioSummary): string | null {
  const stats = summary.stats
  if (!stats) return null
  const pct = (rate: number) => `${Math.round(rate * 100)}%`
  return `${stats.battleCount} 场 · ${summary.sideAName} ${
    pct(stats.sideWinRate.a)
  } / ${summary.sideBName} ${pct(stats.sideWinRate.b)}`
}

export function CatalogPage() {
  const { data, error, loading } = useAsync(() => catalog.scenarios(), [])

  // 新上线置顶第 2 位只在列表 >1 且 onlineAt 存在时生效；否则保持原序。
  const scenarios = data?.scenarios ?? []
  const fresh = scenarios.length > 1 ? newestOnline(scenarios) : null
  const ordered = fresh ? pinSecond(scenarios, fresh) : scenarios

  return (
    <div className='space-y-6'>
      <div {...tm('D.page-header')}>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          场景
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          选择一个场景，为甲乙双方构建你的对话智能体。
        </p>
      </div>

      {loading
        ? (
          <p
            className='text-sm text-(--foreground-subtle)'
            {...tm('D.loading')}
          >
            加载中…
          </p>
        )
        : error
        ? (
          <p className='text-sm text-(--accent)' {...tm('D.error')}>
            {error}
          </p>
        )
        : (
          <div
            className='grid gap-4 md:grid-cols-2'
            {...tm('D.scenario-list')}
          >
            {ordered.map((scenario) => {
              const module = scenarioModule(scenario.id)
              const education = module?.education ?? null
              const stats = statsLine(scenario)
              return (
                <Link
                  key={scenario.id}
                  to={`/scenarios/${scenario.id}`}
                  data-testid={`scenario-${scenario.id}`}
                  {...tm('D.scenario-card')}
                >
                  <Card className='h-full transition hover:border-(--foreground-muted)'>
                    <CardContent className='space-y-3 pt-5'>
                      <div className='flex items-start justify-between gap-3'>
                        <h2
                          className='text-lg font-semibold text-(--foreground)'
                          {...tm('D.card-title')}
                        >
                          {module?.intro?.source.title ?? scenario.title}
                        </h2>
                        <div
                          className='flex flex-wrap items-center justify-end gap-1.5'
                          {...tm('D.card-badges')}
                        >
                          {/* #54 新上线徽章：跟着 onlineAt 最新的那张卡 */}
                          {fresh?.id === scenario.id
                            ? (
                              <Badge tone='accent' {...tm('D.new-badge')}>
                                <Sparkles className='mr-1 h-3 w-3' /> 新上线
                              </Badge>
                            )
                            : null}
                          {scenario.gateProgress
                            ? gateMet(scenario.gateProgress)
                              ? (
                                <Badge tone='success' {...tm('D.gate-badge')}>
                                  <Unlock className='mr-1 h-3 w-3' /> PVP 已解锁
                                </Badge>
                              )
                              : (
                                <Badge tone='info' {...tm('D.gate-badge')}>
                                  <Lock className='mr-1 h-3 w-3' /> PVP 解锁
                                  {' '}
                                  {sideProgressText(scenario.gateProgress.a)}·
                                  {sideProgressText(scenario.gateProgress.b)}
                                </Badge>
                              )
                            : (
                              <Badge
                                tone={scenario.gateUnlocked
                                  ? 'success'
                                  : 'info'}
                                {...tm('D.gate-badge')}
                              >
                                {scenario.gateUnlocked
                                  ? (
                                    <>
                                      <Unlock className='mr-1 h-3 w-3' />{' '}
                                      PvP 已解锁
                                    </>
                                  )
                                  : (
                                    <>
                                      <Lock className='mr-1 h-3 w-3' /> PvE
                                    </>
                                  )}
                              </Badge>
                            )}
                        </div>
                      </div>
                      <p
                        className='text-sm text-(--foreground-subtle)'
                        {...tm('D.card-subject')}
                      >
                        {scenario.subject}
                      </p>
                      {education
                        ? (
                          <div
                            className='flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-(--foreground-subtle)'
                            {...tm('D.card-education')}
                          >
                            <span title={`难度 ${education.difficulty} / 3`}>
                              难度{' '}
                              <span className='tracking-[0.12em] text-(--warning)'>
                                {'★'.repeat(education.difficulty)}
                                <span className='text-(--foreground-muted)'>
                                  {'☆'.repeat(3 - education.difficulty)}
                                </span>
                              </span>
                            </span>
                            <span>约 {education.minutes} 分钟</span>
                            {education.noviceFriendly
                              ? (
                                <Badge tone='success' {...tm('D.novice-badge')}>
                                  适合新手
                                </Badge>
                              )
                              : null}
                          </div>
                        )
                        : null}
                      <div
                        className='space-y-1 text-xs text-(--foreground-muted)'
                        {...tm('D.card-sides')}
                      >
                        <p>
                          <span className='text-(--foreground-subtle)'>
                            {scenario.sideAName}
                          </span>
                          {scenario.sideALabel
                            ? ` · ${scenario.sideALabel}`
                            : ''}
                        </p>
                        <p>
                          <span className='text-(--foreground-subtle)'>
                            {scenario.sideBName}
                          </span>
                          {scenario.sideBLabel
                            ? ` · ${scenario.sideBLabel}`
                            : ''}
                        </p>
                        <p>
                          {education?.formatLabel ?? `${scenario.turnCount} 轮`}
                        </p>
                      </div>
                      {/* #38/#39/#54：stats 到手即点亮；缺席时保持引导式空态 */}
                      {stats
                        ? (
                          <p
                            className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'
                            {...tm('D.card-stats')}
                          >
                            <span className='mr-2 font-semibold tracking-[0.06em] text-(--foreground-muted)'>
                              侧方胜率
                            </span>
                            {stats}
                          </p>
                        )
                        : education
                        ? (
                          <p
                            className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'
                            {...tm('D.card-stats-empty')}
                          >
                            侧方胜率 · 对局数 — 数据积累中
                          </p>
                        )
                        : null}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
            {data && data.scenarios.length === 0
              ? (
                <p
                  className='text-sm text-(--foreground-subtle)'
                  {...tm('D.empty')}
                >
                  暂无场景。
                </p>
              )
              : null}
          </div>
        )}
    </div>
  )
}
