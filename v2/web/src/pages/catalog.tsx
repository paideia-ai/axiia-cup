import { Lock, Unlock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { catalog } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { gateMet, sideProgressText } from '../lib/gate'
import { useAsync } from '../lib/use-async'
import { scenarioModule } from '../scenarios'

// D 卡（A4）：标题/学科/双方/轮数/门槛徽章来自服务端；难度·时长·适合新手
// （#40）来自前端场景模块的编辑内容。门槛徽章 P2 起按侧进度显示（#65，
// mock V16 的紧凑形态「PVP 解锁 1/1·0/1」）；gateProgress 缺席（老服务器）
// 时回落到 P1 的静态 PvE/PvP 徽章（#54）。统计（侧方胜率/对局数，#38/#39）
// 尚无数据源，按 #54 只画引导式空态轮廓、绝不摆零或假数字；没有模块的场景
// 整组隐藏（#18）。
export function CatalogPage() {
  const { data, error, loading } = useAsync(() => catalog.scenarios(), [])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          场景
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          选择一个场景，为甲乙双方构建你的对话智能体。
        </p>
      </div>

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : (
          <div className='grid gap-4 md:grid-cols-2'>
            {data?.scenarios.map((scenario) => {
              const education = scenarioModule(scenario.id)?.education ?? null
              return (
                <Link
                  key={scenario.id}
                  to={`/scenarios/${scenario.id}`}
                  data-testid={`scenario-${scenario.id}`}
                >
                  <Card className='h-full transition hover:border-(--foreground-muted)'>
                    <CardContent className='space-y-3 pt-5'>
                      <div className='flex items-start justify-between gap-3'>
                        <h2 className='text-lg font-semibold text-(--foreground)'>
                          {scenario.title}
                        </h2>
                        {scenario.gateProgress
                          ? gateMet(scenario.gateProgress)
                            ? (
                              <Badge tone='success'>
                                <Unlock className='mr-1 h-3 w-3' /> PVP 已解锁
                              </Badge>
                            )
                            : (
                              <Badge tone='info'>
                                <Lock className='mr-1 h-3 w-3' /> PVP 解锁{' '}
                                {sideProgressText(scenario.gateProgress.a)}·
                                {sideProgressText(scenario.gateProgress.b)}
                              </Badge>
                            )
                          : (
                            <Badge
                              tone={scenario.gateUnlocked ? 'success' : 'info'}
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
                      <p className='text-sm text-(--foreground-subtle)'>
                        {scenario.subject}
                      </p>
                      {education
                        ? (
                          <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-(--foreground-subtle)'>
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
                              ? <Badge tone='success'>适合新手</Badge>
                              : null}
                          </div>
                        )
                        : null}
                      <div className='space-y-1 text-xs text-(--foreground-muted)'>
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
                        <p>{scenario.turnCount} 轮</p>
                      </div>
                      {education
                        ? (
                          <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
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
              ? <p className='text-sm text-(--foreground-subtle)'>暂无场景。</p>
              : null}
          </div>
        )}
    </div>
  )
}
