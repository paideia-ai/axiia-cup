import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { builder, catalog, myAgents } from '../api/client'
import type {
  MyAgentDTO,
  MyAgentsScenarioDTO,
  ScenarioSummary,
  Side,
} from '../api/types'
import { NewAgentButton } from '../components/new-agent-button'
import { NewAgentDialog } from '../components/new-agent-dialog'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { subscribeAgentsChanged } from '../lib/agent-events'
import { messageOf, useAsync } from '../lib/use-async'
import { tm } from '../testmode/mark'

interface CreateTarget {
  scenario: ScenarioSummary
  side: Side
  anchor: HTMLElement | null
}

export function MyAgentsPage() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsync(async () => {
    const [catalogResponse, inventory] = await Promise.all([
      catalog.scenarios(),
      myAgents.list().catch(() => null),
    ])
    return { scenarios: catalogResponse.scenarios, inventory }
  }, [])
  const [pending, setPending] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creating, setCreating] = useState<CreateTarget | null>(null)
  const [params, setParams] = useSearchParams()
  const mountedRef = useRef(true)
  const fallbackRequestRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      fallbackRequestRef.current += 1
    }
  }, [])

  // A side-wide entry change can finish after navigation from an agent home.
  // Refresh this inventory on completion so its readiness badges and selected
  // row never preserve the pre-mutation snapshot.
  useEffect(() => {
    return subscribeAgentsChanged(reload)
  }, [reload])

  // Scenario detail links can open a side-specific creation surface directly.
  // There is no triggering element in that flow, so the dialog uses its
  // centered desktop fallback and still behaves as a bottom sheet on mobile.
  useEffect(() => {
    const requestedSide = params.get('new')
    const scenarioID = params.get('scenario')
    if (requestedSide == null || data == null) return

    const side = requestedSide === 'a' || requestedSide === 'b'
      ? requestedSide
      : null
    const scenario = side == null
      ? null
      : data.scenarios.find((item) =>
        scenarioID == null || item.id === scenarioID
      )
    if (side != null && scenario != null) {
      setCreating({ scenario, side, anchor: null })
    }

    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('new')
      next.delete('scenario')
      return next
    }, { replace: true })
  }, [data, params, setParams])

  const enterFallback = async (scenarioID: string, side: Side) => {
    const requestID = ++fallbackRequestRef.current
    const requestIsCurrent = () =>
      mountedRef.current && fallbackRequestRef.current === requestID
    const key = `${scenarioID}:${side}`
    setPending(key)
    setActionError(null)
    try {
      const { agentID } = await builder.ensure({ scenarioID, side })
      if (!requestIsCurrent()) return
      navigate(`/agents/${agentID}`)
    } catch (cause) {
      if (!requestIsCurrent()) return
      setActionError(messageOf(cause, '打开智能体失败'))
      setPending(null)
    }
  }

  const inventoryByScenario = new Map(
    data?.inventory?.scenarios.map((scenario) => [
      scenario.scenarioID,
      scenario,
    ]) ?? [],
  )
  const focusSideParam = params.get('side')
  const requestedFocusSide: Side | null = params.get('new') == null &&
      (focusSideParam === 'a' || focusSideParam === 'b')
    ? focusSideParam
    : null
  const requestedFocusScenarioID = requestedFocusSide == null
    ? null
    : params.get('scenario')
  const focusedScenario = requestedFocusScenarioID == null
    ? null
    : data?.scenarios.find((scenario) =>
      scenario.id === requestedFocusScenarioID
    ) ?? null
  const focusedRole = focusedScenario == null || requestedFocusSide == null
    ? null
    : requestedFocusSide === 'a'
    ? focusedScenario.sideAName
    : focusedScenario.sideBName
  const visibleScenarios = focusedScenario == null
    ? data?.scenarios ?? []
    : [focusedScenario]

  const clearFocus = () => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('scenario')
      next.delete('side')
      return next
    }, { replace: true })
  }

  return (
    <div className='space-y-6'>
      <div
        className='flex flex-wrap items-start justify-between gap-3'
        {...tm('MA.page-header')}
      >
        <div>
          <h1
            className='text-2xl font-black tracking-tight text-(--foreground)'
            {...tm('MA.page-title')}
          >
            我的智能体
          </h1>
          <p
            className='mt-1 text-sm text-(--foreground-subtle)'
            {...tm('MA.page-intro')}
          >
            {focusedScenario != null && focusedRole != null
              ? `只看《${focusedScenario.title}》的${focusedRole}智能体。`
              : '选择一个智能体，继续你的策略。'}
          </p>
        </div>
        {focusedScenario != null
          ? (
            <Button size='sm' variant='secondary' onClick={clearFocus}>
              查看全部智能体
            </Button>
          )
          : null}
      </div>

      {actionError
        ? (
          <p
            role='alert'
            className='text-sm text-(--accent)'
            {...tm('MA.action-error')}
          >
            {actionError}
          </p>
        )
        : null}

      {loading
        ? (
          <p
            className='text-sm text-(--foreground-subtle)'
            {...tm('MA.loading')}
          >
            加载中…
          </p>
        )
        : error
        ? (
          <div className='space-y-3' role='alert' {...tm('MA.error')}>
            <p className='text-sm text-(--accent)'>{error}</p>
            <Button size='sm' variant='secondary' onClick={reload}>
              重新加载
            </Button>
          </div>
        )
        : (
          <>
            {data?.inventory == null
              ? (
                <div
                  className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--border) bg-white/2 px-4 py-3'
                  role='status'
                >
                  <p className='text-sm text-(--foreground-subtle)'>
                    智能体清单暂时不可用。你仍可打开场景，或安全地打开／创建某一侧智能体。
                  </p>
                  <Button size='sm' variant='secondary' onClick={reload}>
                    重试清单
                  </Button>
                </div>
              )
              : null}

            <div className='space-y-6' {...tm('MA.scenario-list')}>
              {visibleScenarios.map((scenario) =>
                data?.inventory == null
                  ? (
                    <FallbackScenarioGroup
                      key={scenario.id}
                      scenario={scenario}
                      onlySide={focusedScenario == null
                        ? null
                        : requestedFocusSide}
                      pending={pending}
                      onEnter={(side) => void enterFallback(scenario.id, side)}
                    />
                  )
                  : (
                    <ScenarioGroup
                      key={scenario.id}
                      scenario={scenario}
                      inventory={inventoryByScenario.get(scenario.id) ?? null}
                      onlySide={focusedScenario == null
                        ? null
                        : requestedFocusSide}
                      onNewAgent={(side, anchor) =>
                        setCreating({ scenario, side, anchor })}
                    />
                  )
              )}
              {data != null && data.scenarios.length === 0
                ? (
                  <p
                    className='text-sm text-(--foreground-subtle)'
                    {...tm('MA.no-scenarios')}
                  >
                    暂无场景。
                  </p>
                )
                : null}
            </div>
          </>
        )}

      {creating != null
        ? (
          <NewAgentDialog
            key={`${creating.scenario.id}:${creating.side}`}
            scenario={creating.scenario}
            initialSide={creating.side}
            anchor={creating.anchor}
            onClose={() => setCreating(null)}
          />
        )
        : null}
    </div>
  )
}

function ScenarioGroup({
  scenario,
  inventory,
  onlySide,
  onNewAgent,
}: {
  scenario: ScenarioSummary
  inventory: MyAgentsScenarioDTO | null
  onlySide: Side | null
  onNewAgent: (side: Side, anchor: HTMLElement) => void
}) {
  const sides = ([
    ['a', scenario.sideAName, scenario.sideALabel],
    ['b', scenario.sideBName, scenario.sideBLabel],
  ] as const).filter(([side]) => onlySide == null || side === onlySide)
  const agentsOf = (side: Side): MyAgentDTO[] => inventory?.sides[side] ?? []
  const sideStatus = sides.map(([side, name]) => {
    const agents = agentsOf(side)
    return {
      side,
      name,
      built: agents.length > 0,
      done: agents.some((agent) => agent.entryVersionID != null),
    }
  })
  const entryReady = inventory?.entryReady ?? false
  const missing = sideStatus
    .filter(({ done }) => !done)
    .map(({ name, built }) => `${name}（${built ? '未标参赛版本' : '未创建'}）`)
  const focusedStatus = onlySide == null ? null : sideStatus[0] ?? null
  const statusReady = focusedStatus?.done ?? entryReady

  return (
    <Card className='shadow-none' {...tm('MA.scenario-group')}>
      <CardContent className='p-4 sm:p-6'>
        <div
          className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-2 border-b border-(--border-soft) pb-4 md:flex md:flex-wrap md:items-center md:gap-2 md:pb-5'
          {...tm('MA.group-header')}
        >
          <h2 className='min-w-0 text-base font-semibold sm:text-lg'>
            <Link
              to={`/scenarios/${scenario.id}`}
              className='text-(--foreground) hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-(--accent)'
              {...tm('MA.scenario-link')}
            >
              {scenario.title}
            </Link>
          </h2>
          <span
            className='text-right text-xs text-(--foreground-muted) md:text-left'
            {...tm('MA.scenario-subject')}
          >
            {scenario.subject}
          </span>
          <div
            className='flex flex-wrap items-center gap-1.5'
            aria-label={onlySide == null ? '两侧参赛状态' : '当前侧参赛状态'}
          >
            {sideStatus.map(({ side, name, built, done }) => (
              <span
                key={side}
                className='rounded-md border border-(--border) px-2 py-0.5 text-[11px] leading-4 text-(--foreground-subtle)'
                {...tm('MA.side-badge')}
              >
                {name} {done
                  ? <span className='text-(--success)'>✓</span>
                  : built
                  ? '未标参赛'
                  : '未建'}
              </span>
            ))}
          </div>
          <span
            className={`max-w-36 text-right text-xs leading-5 md:ml-auto md:max-w-none ${
              statusReady ? 'text-(--success)' : 'text-(--foreground-muted)'
            }`}
            {...tm('MA.entry-ready')}
          >
            {focusedStatus != null
              ? focusedStatus.done
                ? '✓ 已设参赛版本'
                : focusedStatus.built
                ? '尚未标参赛版本'
                : '尚未创建智能体'
              : entryReady
              ? '✓ 参赛资格已就绪'
              : `参赛资格未就绪：还差 ${missing.join('、')}`}
          </span>
        </div>

        {sides.map(([side, role, description]) => {
          const agents = agentsOf(side)
          const headingID = `my-agents-${scenario.id}-${side}`
          return (
            <section
              key={side}
              aria-labelledby={headingID}
              className={side === 'a'
                ? 'mt-3'
                : 'mt-4 border-t border-(--border-soft) pt-2 md:mt-5 md:pt-3'}
              {...tm('MA.side-section')}
            >
              <div className='mb-2 flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <h3
                    id={headingID}
                    className='text-sm font-semibold text-(--foreground)'
                  >
                    {role}智能体
                  </h3>
                  {description
                    ? (
                      <p className='mt-0.5 text-xs leading-5 text-(--foreground-subtle)'>
                        {description}
                      </p>
                    )
                    : null}
                </div>
                <span {...tm('MA.new-agent-button')}>
                  <NewAgentButton
                    role={role}
                    onClick={(anchor) => onNewAgent(side, anchor)}
                  />
                </span>
              </div>

              {agents.map((agent) => {
                const isEntry = agent.entryVersionID != null
                return (
                  <Link
                    key={agent.agentID}
                    data-testid='agent-row'
                    data-agent-id={agent.agentID}
                    data-entry={isEntry ? 'true' : undefined}
                    to={`/agents/${agent.agentID}`}
                    title={isEntry ? '当前参赛智能体' : undefined}
                    className={`group flex min-h-11 items-center gap-3 rounded-md border px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-(--accent) [&+&]:mt-1 ${
                      isEntry
                        ? 'border-[rgba(224,74,47,0.5)] bg-[rgba(224,74,47,0.035)] hover:border-(--accent) hover:bg-[rgba(224,74,47,0.07)]'
                        : 'border-transparent bg-white/2 hover:bg-white/5'
                    }`}
                    {...tm('MA.agent-row')}
                  >
                    <div className='min-w-0 flex-1'>
                      <p
                        className='text-sm font-medium text-(--foreground)'
                        {...tm('MA.agent-name')}
                      >
                        {agent.name ?? `#${agent.agentID}`}
                        {isEntry
                          ? <span className='sr-only'>（当前参赛智能体）</span>
                          : null}
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden='true'
                      className='h-4 w-4 shrink-0 text-(--foreground-subtle) transition-transform group-hover:translate-x-0.5'
                    />
                  </Link>
                )
              })}

              {agents.length === 0
                ? (
                  <p
                    className='rounded-md border border-dashed border-(--border-soft) px-3 py-3 text-sm text-(--foreground-subtle)'
                    {...tm('MA.empty-side')}
                  >
                    还没有{role}智能体
                  </p>
                )
                : null}
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}

function FallbackScenarioGroup({
  scenario,
  onlySide,
  pending,
  onEnter,
}: {
  scenario: ScenarioSummary
  onlySide: Side | null
  pending: string | null
  onEnter: (side: Side) => void
}) {
  const sides = ([
    ['a', scenario.sideAName, scenario.sideALabel],
    ['b', scenario.sideBName, scenario.sideBLabel],
  ] as const).filter(([side]) => onlySide == null || side === onlySide)

  return (
    <Card className='shadow-none' {...tm('MA.fallback-group')}>
      <CardContent className='p-4 sm:p-6'>
        <div className='flex flex-wrap items-baseline gap-2 border-b border-(--border-soft) pb-4'>
          <h2 className='text-base font-semibold sm:text-lg'>
            <Link
              to={`/scenarios/${scenario.id}`}
              className='text-(--foreground) hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-(--accent)'
            >
              {scenario.title}
            </Link>
          </h2>
          <span className='text-xs text-(--foreground-muted)'>
            {scenario.subject}
          </span>
        </div>

        {sides.map(([side, role, description]) => {
          const key = `${scenario.id}:${side}`
          const isPending = pending === key
          const headingID = `my-agents-fallback-${scenario.id}-${side}`
          return (
            <section
              key={side}
              aria-labelledby={headingID}
              className={side === 'a'
                ? 'mt-3'
                : 'mt-4 border-t border-(--border-soft) pt-2 md:mt-5 md:pt-3'}
              {...tm('MA.fallback-row')}
            >
              <div className='mb-2 flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <h3
                    id={headingID}
                    className='text-sm font-semibold text-(--foreground)'
                  >
                    {role}智能体
                  </h3>
                  {description
                    ? (
                      <p className='mt-0.5 text-xs leading-5 text-(--foreground-subtle)'>
                        {description}
                      </p>
                    )
                    : null}
                </div>
                <NewAgentButton
                  role={role}
                  disabled={pending != null}
                  label={isPending
                    ? `正在打开${role}智能体`
                    : `打开或创建${role}智能体`}
                  onClick={() => onEnter(side)}
                />
              </div>
              <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-3 text-sm text-(--foreground-subtle)'>
                {isPending ? '正在确认智能体…' : '清单不可用，当前状态未知'}
              </p>
            </section>
          )
        })}

        <p className='sr-only' {...tm('MA.fallback-hint')}>
          完成度与参赛资格将在清单恢复后显示
        </p>
      </CardContent>
    </Card>
  )
}
