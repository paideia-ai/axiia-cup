import { orderScenarios } from '../lib/scenario-order'
import { sideStatsLine } from '../lib/side-display-name'
import { PageLoading } from '../components/page-loading'
import { catalogQuery } from '../lib/navigation-queries'
import { Lock, Sparkles, Unlock } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { ScenarioSummary } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { gateMet, sideProgressText } from '../lib/gate'
import { usePageQuery } from '../lib/use-page-query'
import {
  DIFFICULTY_LABEL,
  roleDescriptionLines,
  scenarioGuidance,
  scenarioModule,
} from '../scenarios'
import { tm } from '../testmode/mark'
import { useAuth } from '../context/auth'

// D 卡（A4）：标题/学科/双方/轮数/门槛徽章来自服务端；难度·时长·适合新手
// （#40）优先使用服务端字段，缺席时回落前端场景模块。门槛徽章 P2 起按侧进度显示（#65，
// mock V16 的紧凑形态「PVP 解锁 1/1·0/1」）；gateProgress 缺席（老服务器）
// 时回落到 P1 的静态 PvE/PvP 徽章（#54）。统计 P6 点亮（#38/#39）：展示门槛
// 由服务端把关——stats 到手即显示对局数+侧方胜率，缺席（未过门槛/老服务器）
// 时按 #54 显示「数据积累中」，不摆零或假数字。
// 新上线（#54，W8 选 A）：
// onlineAt 最新的场景显示「新上线」徽章；字段缺席时无徽章。
// 场景顺序与「我的智能体」共用，不受上线时间影响。

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

export function CatalogPage() {
  const { account, isLoading: authLoading } = useAuth()
  const { data, error, loading: queryLoading } = usePageQuery(
    { ...catalogQuery(account ? 'include' : 'omit'), enabled: !authLoading },
  )

  const loading = authLoading || queryLoading

  // 沿用新上线徽章的判定，展示顺序使用共用规则。
  const scenarios = data?.scenarios ?? []
  const fresh = scenarios.length > 1 ? newestOnline(scenarios) : null
  const ordered = orderScenarios(scenarios)

  return (
    <div className={loading ? 'space-y-6' : 'space-y-6 page-content-ready'}>
      <div {...tm('D.page-header')}>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          场景
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          选择一个场景，为甲乙双方构建你的对话智能体。
        </p>
      </div>

      {loading
        ? <PageLoading variant='cards' {...tm('D.loading')} />
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
              const guidance = scenarioGuidance(scenario, education)
              const stats = sideStatsLine(scenario)
              const factions = module?.factionCopy
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
                          {!account
                            ? null
                            : scenario.gateProgress
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
                      <p className='text-sm text-(--foreground-subtle)'>
                        {scenario.subject}
                      </p>
                      {education
                        ? (
                          <p
                            className='text-sm leading-relaxed text-(--foreground-subtle)'
                            {...tm('D.card-subject')}
                          >
                            {education.hook}
                          </p>
                        )
                        : null}
                      {guidance.difficulty != null ||
                          guidance.minutes != null ||
                          guidance.noviceFriendly
                        ? (
                          <div
                            className='flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-(--foreground-subtle)'
                            {...tm('D.card-education')}
                          >
                            {guidance.difficulty != null
                              ? (
                                <span title={`难度 ${guidance.difficulty} / 3`}>
                                  难度 {DIFFICULTY_LABEL[guidance.difficulty]}
                                  {' '}
                                  <span
                                    aria-hidden='true'
                                    className='tracking-[0.12em] text-(--warning)'
                                  >
                                    {'★'.repeat(guidance.difficulty)}
                                    <span className='text-(--foreground-muted)'>
                                      {'☆'.repeat(3 - guidance.difficulty)}
                                    </span>
                                  </span>
                                </span>
                              )
                              : null}
                            {guidance.minutes != null
                              ? <span>约 {guidance.minutes} 分钟</span>
                              : null}
                            {guidance.noviceFriendly
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
                        {(['a', 'b'] as const).map((side) => {
                          const label = side === 'a'
                            ? scenario.sideALabel
                            : scenario.sideBLabel
                          return (
                            <p
                              key={side}
                              className={factions
                                ? 'whitespace-pre-line'
                                : undefined}
                            >
                              <span className='text-(--foreground-subtle)'>
                                {factions?.catalogTitles[side] ??
                                  (side === 'a'
                                    ? scenario.sideAName
                                    : scenario.sideBName)}
                              </span>
                              {label
                                ? factions
                                  ? `\n${
                                    roleDescriptionLines(module, side, label)
                                  }`
                                  : ` · ${label}`
                                : ''}
                            </p>
                          )
                        })}
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
                        : (
                          <p
                            className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'
                            {...tm('D.card-stats-empty')}
                          >
                            数据积累中
                          </p>
                        )}
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
