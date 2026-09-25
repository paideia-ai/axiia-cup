import { PageLoading } from '../components/page-loading'
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import type {
  MyAgentDTO,
  MyAgentsScenarioDTO,
  ScenarioSummary,
  Side,
} from '../api/types'
import { CreateAgentAction } from '../components/create-agent-action'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { subscribeAgentsChanged } from '../lib/agent-events'
import { usePageQuery } from '../lib/use-page-query'
import { catalogQuery, inventoryQuery } from '../lib/navigation-queries'
import { tm } from '../testmode/mark'

export function MyAgentsPage() {
  const location = useLocation()
  const catalog = usePageQuery(catalogQuery())
  const inventory = usePageQuery(inventoryQuery())
  const data = useMemo(() =>
    catalog.data
      ? {
        scenarios: catalog.data.scenarios,
        inventory: inventory.data,
      }
      : null, [catalog.data, inventory.data])
  const inventorySettled = useRef(false)
  if (!inventory.loading) inventorySettled.current = true
  const loading = catalog.loading ||
    (!inventorySettled.current && inventory.loading)
  const error = catalog.error
  const reload = useCallback(() => {
    catalog.reload()
    inventory.reload()
  }, [catalog.reload, inventory.reload])
  const [params, setParams] = useSearchParams()

  // A side-wide entry change can finish after navigation from an agent home.
  // Refresh this inventory on completion so its readiness badges and selected
  // row never preserve the pre-mutation snapshot.
  useEffect(() => {
    return subscribeAgentsChanged(reload)
  }, [reload])

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
    <div className={loading ? 'space-y-6' : 'space-y-6 page-content-ready'}>
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

      {location.state?.archivedAgentName && (
        <p role='status' className='text-sm text-(--foreground-muted)'>
          已归档 {location.state.archivedAgentName}。
          <Link
            className='underline underline-offset-4'
            to='/settings/archived-agents'
          >
            查看已归档的智能体
          </Link>
        </p>
      )}

      {loading
        ? <PageLoading variant='cards' {...tm('MA.loading')} />
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
                    智能体清单暂时不可用。你仍可打开场景，或新建某一侧智能体。
                  </p>
                  <Button size='sm' variant='secondary' onClick={reload}>
                    重试清单
                  </Button>
                </div>
              )
              : null}

            <div className='space-y-6' {...tm('MA.scenario-list')}>
              {visibleScenarios.map((scenario) => (
                <ScenarioGroup
                  key={scenario.id}
                  scenario={scenario}
                  inventory={inventoryByScenario.get(scenario.id) ?? null}
                  inventoryAvailable={data?.inventory != null}
                  onlySide={focusedScenario == null ? null : requestedFocusSide}
                />
              ))}
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
    </div>
  )
}

function ScenarioGroup({
  scenario,
  inventory,
  inventoryAvailable,
  onlySide,
}: {
  scenario: ScenarioSummary
  inventory: MyAgentsScenarioDTO | null
  inventoryAvailable: boolean
  onlySide: Side | null
}) {
  const [expandedSides, setExpandedSides] = useState({ a: false, b: false })
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
    <Card
      className='shadow-none'
      {...(inventoryAvailable
        ? tm('MA.scenario-group')
        : tm('MA.fallback-group'))}
    >
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
            hidden={!inventoryAvailable}
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
            hidden={!inventoryAvailable}
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

        <div
          className={`mt-3 grid grid-cols-1 ${
            sides.length > 1 ? 'md:grid-cols-2 md:gap-x-6' : ''
          }`}
        >
          {sides.map(([side, role, description], index) => {
            const agents = agentsOf(side).filter((agent) => !agent.isArchived)
            const oppositeCount = agentsOf(side === 'a' ? 'b' : 'a')
              .filter((agent) => !agent.isArchived).length
            const collapsible = onlySide == null && agents.length >= 6 &&
              agents.length >= 2 * oppositeCount
            const limit = Math.max(3, oppositeCount)
            // Keep the entry agent visible even when it falls beyond the cutoff,
            // while preserving the inventory order in both states.
            const entryAgents = agents.filter((agent) =>
              agent.entryVersionID != null
            )
            const previewIDs = new Set([
              ...entryAgents,
              ...agents.filter((agent) => agent.entryVersionID == null)
                .slice(0, Math.max(0, limit - entryAgents.length)),
            ].map((agent) => agent.agentID))
            const expanded = expandedSides[side]
            const visibleAgents = collapsible && !expanded
              ? agents.filter((agent) => previewIDs.has(agent.agentID))
              : agents
            const headingID = `my-agents-${scenario.id}-${side}`
            const listID = `${headingID}-list`
            return (
              <section
                key={side}
                aria-labelledby={headingID}
                className={index === 0
                  ? 'min-w-0'
                  : 'mt-4 min-w-0 border-t border-(--border-soft) pt-2 md:mt-0 md:border-t-0 md:pt-0'}
                {...(inventoryAvailable
                  ? tm('MA.side-section')
                  : tm('MA.fallback-row'))}
              >
                <div className='mb-2 flex flex-wrap items-center justify-between gap-3'>
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
                  <CreateAgentAction
                    marker={tm('MA.new-agent-button')['data-tm']}
                    scenarioID={scenario.id}
                    side={side}
                    role={role}
                    oppositeRole={side === 'a'
                      ? scenario.sideBName
                      : scenario.sideAName}
                  />
                </div>

                <div id={listID}>
                  {visibleAgents.map((agent) => {
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
                            className='text-sm font-medium wrap-anywhere text-(--foreground)'
                            {...tm('MA.agent-name')}
                          >
                            {agent.name ?? `#${agent.agentID}`}
                            {isEntry
                              ? (
                                <span className='sr-only'>
                                  （当前参赛智能体）
                                </span>
                              )
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
                </div>

                {collapsible && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='mt-1 min-h-11 w-full text-(--foreground-subtle)'
                    aria-label={expanded
                      ? '收起'
                      : `展开全部 ${agents.length} 个（还有 ${
                        agents.length - visibleAgents.length
                      } 个）`}
                    aria-expanded={expanded}
                    aria-controls={listID}
                    onClick={() =>
                      setExpandedSides((previous) => ({
                        ...previous,
                        [side]: !previous[side],
                      }))}
                  >
                    {expanded
                      ? <ChevronUp aria-hidden='true' className='h-3.5 w-3.5' />
                      : (
                        <ChevronDown
                          aria-hidden='true'
                          className='h-3.5 w-3.5'
                        />
                      )}
                  </Button>
                )}

                {agents.length === 0
                  ? (
                    <p
                      className='rounded-md border border-dashed border-(--border-soft) px-3 py-3 text-sm text-(--foreground-subtle)'
                      {...tm('MA.empty-side')}
                    >
                      {!inventoryAvailable
                        ? '清单不可用，当前状态未知'
                        : agentsOf(side).length > 0
                        ? (
                          <>
                            你的{role}智能体已全部归档。<Link
                              to='/settings/archived-agents'
                              className='underline underline-offset-4'
                            >
                              查看归档
                            </Link>
                          </>
                        )
                        : <>还没有{role}智能体</>}
                    </p>
                  )
                  : null}
              </section>
            )
          })}
        </div>
        {!inventoryAvailable && (
          <p className='sr-only' {...tm('MA.fallback-hint')}>
            完成度与参赛资格将在清单恢复后显示
          </p>
        )}
      </CardContent>
    </Card>
  )
}
