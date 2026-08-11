import { Hammer } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { builder, catalog, myAgents } from '../api/client'
import type {
  MyAgentDTO,
  MyAgentsScenarioDTO,
  ScenarioSummary,
  Side,
} from '../api/types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { messageOf, useAsync } from '../lib/use-async'

// 我的智能体（#73/#64）：按场景分组的一级入口页。P2 数据化——主数据源是
// GET /v1/my/agents（版本数/★参赛版本/双侧完成度/参赛资格，#64/#58，样式对照
// mock my-agents.tsx）；该接口失败时整页降级回 P1 的目录骨架（懒 ensure 进入，
// 引导式空态占位），绝不白屏。目录侧名仍来自 /v1/scenarios（my/agents 只带
// title，不带侧名）。
export function MyAgentsPage() {
  const navigate = useNavigate()
  const { data, error, loading } = useAsync(async () => {
    // 清单接口失败 → inventory 为 null → 降级骨架；目录失败才算页面错误。
    const [catalogRes, inventory] = await Promise.all([
      catalog.scenarios(),
      myAgents.list().catch(() => null),
    ])
    return { scenarios: catalogRes.scenarios, inventory }
  }, [])
  const [pending, setPending] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // 懒创建（get-or-create，只在点击时调用）：仅当该侧还没有 agent 时走
  // ensure；已有 agentID 的入口直接导航，不再多打一次接口。
  const enter = async (
    scenarioID: string,
    side: Side,
    target: 'view' | 'build',
  ) => {
    const key = `${scenarioID}:${side}:${target}`
    setPending(key)
    setActionError(null)
    try {
      const { agentID } = await builder.ensure({ scenarioID, side })
      navigate(
        target === 'view' ? `/agents/${agentID}` : `/agents/${agentID}/build`,
      )
    } catch (cause) {
      setActionError(messageOf(cause, '进入智能体失败'))
      setPending(null)
    }
  }

  const inventoryOf = (scenarioID: string): MyAgentsScenarioDTO | null =>
    data?.inventory?.scenarios.find((s) => s.scenarioID === scenarioID) ?? null

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          我的智能体
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          按场景分组；每个智能体执一侧，参赛需两侧各标一个参赛版本。
        </p>
      </div>

      {actionError
        ? <p className='text-sm text-(--accent)'>{actionError}</p>
        : null}

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : (
          <div className='space-y-4'>
            {data?.scenarios.map((scenario) => {
              const inventory = data.inventory ? inventoryOf(scenario.id) : null
              return data.inventory
                ? (
                  <ScenarioGroup
                    key={scenario.id}
                    scenario={scenario}
                    inventory={inventory}
                    pending={pending}
                    onCreate={(side) => void enter(scenario.id, side, 'build')}
                  />
                )
                : (
                  <SkeletonGroup
                    key={scenario.id}
                    scenario={scenario}
                    pending={pending}
                    onEnter={(side, target) =>
                      void enter(scenario.id, side, target)}
                  />
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

// 数据化分组卡（#64/#58）：双侧完成度徽章（有 agent 且已标★参赛版本才算
// 完成）+ 参赛资格行（已就绪 / 差哪侧）+ 逐 agent 行（版本数 · ★参赛状态 ·
// 直达入口）；缺侧给「去创建对侧（角色名）」CTA（mock V7 口径）。
function ScenarioGroup({
  scenario,
  inventory,
  pending,
  onCreate,
}: {
  scenario: ScenarioSummary
  inventory: MyAgentsScenarioDTO | null
  pending: string | null
  onCreate: (side: Side) => void
}) {
  const navigate = useNavigate()
  const sides = [
    ['a', scenario.sideAName, scenario.sideALabel],
    ['b', scenario.sideBName, scenario.sideBLabel],
  ] as const

  const agentsOf = (side: Side): MyAgentDTO[] => inventory?.sides[side] ?? []
  const hasEntry = (side: Side) =>
    agentsOf(side).some((agent) => agent.entryVersionID != null)

  // #58 参赛资格：entryReady 由服务端判定；未就绪时点名差哪侧、差什么。
  const entryReady = inventory?.entryReady ?? false
  const missing = sides
    .filter(([side]) => !(agentsOf(side).length > 0 && hasEntry(side)))
    .map(([side, name]) =>
      agentsOf(side).length === 0
        ? `${name}（未创建）`
        : `${name}（未标参赛版本）`
    )

  return (
    <Card>
      <CardContent className='space-y-3 pt-5'>
        <div className='flex flex-wrap items-center gap-2'>
          <Link
            to={`/scenarios/${scenario.id}`}
            className='text-base font-semibold text-(--foreground) hover:underline'
          >
            {scenario.title}
          </Link>
          <span className='text-xs text-(--foreground-muted)'>
            {scenario.subject}
          </span>
          {/* 双侧完成度徽章（#64）：有 agent + 已标参赛版本 = ✓ */}
          {sides.map(([side, name]) => {
            const built = agentsOf(side).length > 0
            const done = built && hasEntry(side)
            return (
              <Badge
                key={side}
                tone={done ? 'success' : built ? 'warning' : 'info'}
              >
                {name} {done ? '✓' : built ? '未标参赛' : '未建'}
              </Badge>
            )
          })}
          <span
            className={`ml-auto text-xs ${
              entryReady ? 'text-(--success)' : 'text-(--foreground-muted)'
            }`}
          >
            {entryReady
              ? '✓ 参赛资格已就绪'
              : `参赛资格未就绪：还差 ${missing.join('、')}`}
          </span>
        </div>

        {sides.map(([side, name, label]) => {
          const agents = agentsOf(side)
          const otherBuilt = agentsOf(side === 'a' ? 'b' : 'a').length > 0
          return agents.length > 0
            ? agents.map((agent) => (
              <div
                key={`${side}:${agent.agentID}`}
                className='flex flex-wrap items-center gap-3 rounded-md border border-(--border-soft) bg-white/2 px-3 py-2.5'
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-semibold text-(--foreground)'>
                    <span className='mr-1.5 text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                      {side === 'a' ? '甲方' : '乙方'}
                    </span>
                    {name}
                    <span className='ml-1.5 font-mono text-[11px] font-normal text-(--foreground-muted)'>
                      #{agent.agentID}
                    </span>
                  </p>
                  <p className='truncate text-xs text-(--foreground-muted)'>
                    {agent.versionCount > 0
                      ? `${agent.versionCount} 个版本`
                      : '还没有版本'}
                    {' · '}
                    {agent.entryVersionID != null
                      ? '已标 ★参赛版本'
                      : '未标参赛版本'}
                    {label ? ` · ${label}` : ''}
                  </p>
                </div>
                <div className='flex items-center gap-1.5'>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={() => navigate(`/agents/${agent.agentID}`)}
                  >
                    查看智能体
                  </Button>
                  <Button
                    size='sm'
                    onClick={() => navigate(`/agents/${agent.agentID}/build`)}
                  >
                    进入构建
                  </Button>
                </div>
              </div>
            ))
            : (
              <div
                key={side}
                className='flex flex-wrap items-center gap-3 rounded-md border border-dashed border-(--border-soft) px-3 py-2.5'
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-sm text-(--foreground-subtle)'>
                    <span className='mr-1.5 text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                      {side === 'a' ? '甲方' : '乙方'}
                    </span>
                    还没有{name}智能体
                  </p>
                  {label
                    ? (
                      <p className='truncate text-xs text-(--foreground-muted)'>
                        {label}
                      </p>
                    )
                    : null}
                </div>
                <Button
                  size='sm'
                  variant='secondary'
                  disabled={pending != null}
                  onClick={() => onCreate(side)}
                >
                  <Hammer className='mr-1.5 h-3.5 w-3.5' />
                  {pending === `${scenario.id}:${side}:build`
                    ? '创建中…'
                    : otherBuilt
                    ? `去创建对侧（${name}）`
                    : `创建${name}智能体`}
                </Button>
              </div>
            )
        })}
      </CardContent>
    </Card>
  )
}

// P1 降级骨架：/v1/my/agents 不可用（老服务器/接口故障）时的目录式分组——
// 懒 ensure 进入，完成度槽位按 #54 走引导式空态，不摆假数字。
function SkeletonGroup({
  scenario,
  pending,
  onEnter,
}: {
  scenario: ScenarioSummary
  pending: string | null
  onEnter: (side: Side, target: 'view' | 'build') => void
}) {
  return (
    <Card>
      <CardContent className='space-y-3 pt-5'>
        <div className='flex flex-wrap items-baseline gap-2'>
          <Link
            to={`/scenarios/${scenario.id}`}
            className='text-base font-semibold text-(--foreground) hover:underline'
          >
            {scenario.title}
          </Link>
          <span className='text-xs text-(--foreground-muted)'>
            {scenario.subject}
          </span>
        </div>

        {([
          ['a', scenario.sideAName, scenario.sideALabel],
          ['b', scenario.sideBName, scenario.sideBLabel],
        ] as const).map(([side, name, label]) => (
          <div
            key={side}
            className='flex flex-wrap items-center gap-3 rounded-md border border-(--border-soft) bg-white/2 px-3 py-2.5'
          >
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold text-(--foreground)'>
                <span className='mr-1.5 text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                  {side === 'a' ? '甲方' : '乙方'}
                </span>
                {name}
              </p>
              {label
                ? (
                  <p className='truncate text-xs text-(--foreground-muted)'>
                    {label}
                  </p>
                )
                : null}
            </div>
            <div className='flex items-center gap-1.5'>
              <Button
                size='sm'
                variant='secondary'
                disabled={pending != null}
                onClick={() => onEnter(side, 'view')}
              >
                {pending === `${scenario.id}:${side}:view`
                  ? '打开中…'
                  : '查看智能体'}
              </Button>
              <Button
                size='sm'
                disabled={pending != null}
                onClick={() => onEnter(side, 'build')}
              >
                {pending === `${scenario.id}:${side}:build`
                  ? '打开中…'
                  : '进入构建'}
              </Button>
            </div>
          </div>
        ))}

        {/* #54 引导式空态：数据化槽位不摆假数字，只给轮廓提示 */}
        <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
          完成度与参赛资格徽章将在数据接入后点亮
        </p>
      </CardContent>
    </Card>
  )
}
