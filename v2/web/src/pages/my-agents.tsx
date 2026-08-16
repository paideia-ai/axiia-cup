import { Hammer, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { agents as agentsApi, builder, catalog, myAgents } from '../api/client'
import type {
  MyAgentDTO,
  MyAgentsScenarioDTO,
  ScenarioSummary,
  Side,
} from '../api/types'
import {
  AGENT_NAME_LIMIT,
  NewAgentDialog,
} from '../components/new-agent-dialog'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { messageOf, useAsync } from '../lib/use-async'
import { editedCopy } from '../lib/version-label'

// 我的智能体（#73/#64）：按场景分组的一级入口页。P2 数据化——主数据源是
// GET /v1/my/agents（版本数/★参赛版本/双侧完成度/参赛资格，#64/#58，样式对照
// mock my-agents.tsx）；该接口失败时整页降级回 P1 的目录骨架（懒 ensure 进入，
// 引导式空态占位），绝不白屏。目录侧名仍来自 /v1/scenarios（my/agents 只带
// title，不带侧名）。P6 多智能体（#56/#63/#64）：每侧可有多个 agent，逐个成行
// （展示名 #63：有自起名=「侧角色名「自起名」」，没有=「侧角色名 #id」）；
// 每侧一枚「再建一个」开新建弹窗（受 #59/#79 引导门，弹窗内引导先建对侧）。
export function MyAgentsPage() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsync(async () => {
    // 清单接口失败 → inventory 为 null → 降级骨架；目录失败才算页面错误。
    const [catalogRes, inventory] = await Promise.all([
      catalog.scenarios(),
      myAgents.list().catch(() => null),
    ])
    return { scenarios: catalogRes.scenarios, inventory }
  }, [])
  const [pending, setPending] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  // P6「再建一个」：弹窗新建（选侧 + 可选命名）；null = 关闭。
  const [creating, setCreating] = useState<
    { scenario: ScenarioSummary; side: Side } | null
  >(null)
  // P13：DA 侧卡「再建一个」把玩家送到这里并带 ?new=<side>&scenario=<id>，
  // 落地即开新建弹窗；用完即从 URL 摘掉（replace，不留历史）。
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    const side = params.get('new') as Side | null
    const scenarioID = params.get('scenario')
    if (side == null || data == null) return
    const scenario = data.scenarios.find((item) =>
      scenarioID == null || item.id === scenarioID
    )
    if (scenario) setCreating({ scenario, side })
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('new')
      next.delete('scenario')
      return next
    }, { replace: true })
  }, [data])

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
                    onNewAgent={(side) => setCreating({ scenario, side })}
                    onChanged={reload}
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

      {creating
        ? (
          <NewAgentDialog
            scenario={creating.scenario}
            initialSide={creating.side}
            onClose={() => setCreating(null)}
          />
        )
        : null}
    </div>
  )
}

// 数据化分组卡（#64/#58）：双侧完成度徽章（该侧任一 agent 已标★参赛版本即
// 完成，跨该侧全部 agent 聚合）+ 参赛资格行（entryReady 由服务端判定）+ 逐
// agent 行卡（#56 每侧可多个；展示名 #63）；缺侧给「去创建对侧（角色名）」
// CTA（mock V7 口径），已有侧给「再建一个」开新建弹窗（#59 引导门在弹窗内）。
function ScenarioGroup({
  scenario,
  inventory,
  pending,
  onCreate,
  onNewAgent,
  onChanged,
}: {
  scenario: ScenarioSummary
  inventory: MyAgentsScenarioDTO | null
  pending: string | null
  onCreate: (side: Side) => void
  onNewAgent: (side: Side) => void
  onChanged: () => void
}) {
  const navigate = useNavigate()
  // P2 就地改名 / P8b 两步删除：都不弹窗（E9：界面自解释，不配说明书）。
  const [renaming, setRenaming] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [deleteArmed, setDeleteArmed] = useState<number | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  const commitRename = async (agentID: number) => {
    setRowError(null)
    try {
      await agentsApi.rename(agentID, { name: draftName.trim() || null })
      setRenaming(null)
      onChanged()
    } catch (cause) {
      setRowError(messageOf(cause, '改名失败'))
    }
  }

  const commitDelete = async (agentID: number) => {
    setRowError(null)
    try {
      await agentsApi.remove(agentID)
      setDeleteArmed(null)
      onChanged()
    } catch (cause) {
      setRowError(messageOf(cause, '删除失败'))
    }
  }
  const sides = [
    ['a', scenario.sideAName, scenario.sideALabel],
    ['b', scenario.sideBName, scenario.sideBLabel],
  ] as const

  // P1a：按最近编辑倒序——回到这一页，最想先看到的是上次在改的那个。
  const agentsOf = (side: Side): MyAgentDTO[] =>
    [...(inventory?.sides[side] ?? [])].sort(
      (a, b) => (b.lastEditedAt ?? 0) - (a.lastEditedAt ?? 0),
    )
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
            ? (
              <div key={side} className='space-y-3'>
                {agents.map((agent) => (
                  <div
                    key={agent.agentID}
                    data-testid='agent-row'
                    data-agent-id={agent.agentID}
                    className='flex flex-wrap items-center gap-3 rounded-md border border-(--border-soft) bg-white/2 px-3 py-2.5'
                  >
                    {
                      /* min-w 兜底（390px 校验）：文字列低于下限时按钮整组换
                      行，而不是把侧名/摘要挤成一字一行的竖排 */
                    }
                    <div className='min-w-40 flex-1'>
                      {renaming === agent.agentID
                        ? (
                          <div className='flex flex-wrap items-center gap-2'>
                            <label
                              className='sr-only'
                              htmlFor={`rename-${agent.agentID}`}
                            >
                              智能体 #{agent.agentID} 的名字
                            </label>
                            <Input
                              id={`rename-${agent.agentID}`}
                              className='max-w-48'
                              value={draftName}
                              maxLength={AGENT_NAME_LIMIT}
                              autoFocus
                              onChange={(event) =>
                                setDraftName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  void commitRename(agent.agentID)
                                }
                                if (event.key === 'Escape') setRenaming(null)
                              }}
                              placeholder={`如「铁腕${name}」——留空则不起名`}
                            />
                            <Button
                              size='sm'
                              variant='secondary'
                              onClick={() => void commitRename(agent.agentID)}
                            >
                              保存
                            </Button>
                            <button
                              type='button'
                              onClick={() => setRenaming(null)}
                              className='cursor-pointer text-xs text-(--foreground-muted) transition hover:text-(--foreground)'
                            >
                              取消
                            </button>
                          </div>
                        )
                        : null}
                      <p
                        className={`text-sm font-semibold text-(--foreground) ${
                          renaming === agent.agentID ? 'hidden' : ''
                        }`}
                      >
                        <span className='mr-1.5 text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                          {side === 'a' ? '甲方' : '乙方'}
                        </span>
                        {
                          /* #63 展示名：有自起名=侧角色名「自起名」，
                          没有=侧角色名 #id */
                        }
                        {agent.name ? `${name}「${agent.name}」` : name}
                        {agent.name == null || agent.name === ''
                          ? (
                            <span className='ml-1.5 font-mono text-[11px] font-normal text-(--foreground-muted)'>
                              #{agent.agentID}
                            </span>
                          )
                          : null}
                      </p>
                      <p className='truncate text-xs text-(--foreground-muted)'>
                        {agent.versionCount > 0
                          ? `${agent.versionCount} 个版本`
                          : '还没有版本'}
                        {' · '}
                        {agent.entryVersionID != null
                          ? '已标 ★参赛版本'
                          : '未标参赛版本'}
                        {editedCopy(agent.lastEditedAt)
                          ? (
                            <>
                              {' · '}
                              <span data-testid='agent-edited'>
                                {editedCopy(agent.lastEditedAt)}
                              </span>
                            </>
                          )
                          : null}
                        {label ? ` · ${label}` : ''}
                      </p>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Button
                        size='sm'
                        variant='secondary'
                        aria-label={`查看${scenario.title}·${name}侧智能体 #${agent.agentID}`}
                        onClick={() => navigate(`/agents/${agent.agentID}`)}
                      >
                        查看智能体
                      </Button>
                      <Button
                        size='sm'
                        aria-label={`进入${scenario.title}·${name}侧构建 #${agent.agentID}`}
                        onClick={() =>
                          navigate(`/agents/${agent.agentID}/build`)}
                      >
                        进入构建
                      </Button>
                      {/* P2：自起名是策略层唯一的身份标签，必须能改 */}
                      <Button
                        size='sm'
                        variant='ghost'
                        aria-label={`重命名智能体 #${agent.agentID}`}
                        onClick={() => {
                          setRenaming(agent.agentID)
                          setDraftName(agent.name ?? '')
                          setDeleteArmed(null)
                        }}
                      >
                        重命名
                      </Button>
                      {/* P8b：只有一版都没存的空壳可删；有版本的永不可删 */}
                      {agent.versionCount === 0
                        ? (
                          deleteArmed === agent.agentID
                            ? (
                              <Button
                                size='sm'
                                variant='secondary'
                                aria-label={`确认删除智能体 #${agent.agentID}`}
                                onClick={() => void commitDelete(agent.agentID)}
                              >
                                确认删除
                              </Button>
                            )
                            : (
                              <Button
                                size='sm'
                                variant='ghost'
                                aria-label={`删除智能体 #${agent.agentID}`}
                                onClick={() => setDeleteArmed(agent.agentID)}
                              >
                                删除
                              </Button>
                            )
                        )
                        : null}
                    </div>
                  </div>
                ))}
                {rowError
                  ? <p className='text-xs text-(--accent)'>{rowError}</p>
                  : null}
                {/* #56 每侧多 agent：入口在侧内；#59 引导门在弹窗里拦并引导 */}
                <div>
                  <Button
                    size='sm'
                    variant='ghost'
                    aria-label={`再建一个${scenario.title}·${name}侧智能体`}
                    onClick={() => onNewAgent(side)}
                  >
                    <Plus className='mr-1.5 h-3.5 w-3.5' />
                    再建一个{name}
                  </Button>
                </div>
              </div>
            )
            : (
              <div
                key={side}
                className='flex flex-wrap items-center gap-3 rounded-md border border-dashed border-(--border-soft) px-3 py-2.5'
              >
                <div className='min-w-40 flex-1'>
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
                  aria-label={`创建${scenario.title}·${name}侧智能体`}
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
            <div className='min-w-40 flex-1'>
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
                aria-label={`查看${scenario.title}·${name}侧智能体`}
                onClick={() => onEnter(side, 'view')}
              >
                {pending === `${scenario.id}:${side}:view`
                  ? '打开中…'
                  : '查看智能体'}
              </Button>
              <Button
                size='sm'
                disabled={pending != null}
                aria-label={`进入${scenario.title}·${name}侧构建`}
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
