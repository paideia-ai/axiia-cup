import { useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { builder, myAgents } from '../api/client'
import type { Side } from '../api/types'
import { Button, ButtonLink } from '../components/ui/button'
import { useAuth } from '../context/auth'
import { useAsync } from '../lib/use-async'
import { tm } from '../testmode/mark'

export function AgentEntryPage() {
  const [params] = useSearchParams()
  const { firstBattleDone } = useAuth()
  const scenarioID = params.get('scenario')
  const side = params.get('side')
  const target = params.get('target') ?? 'view'
  const express = params.get('express') === '1'

  if (
    !scenarioID || (side !== 'a' && side !== 'b') ||
    (target !== 'view' && target !== 'build') ||
    (express && firstBattleDone)
  ) return <Navigate replace to='/scenarios' />

  return (
    <AgentEntry
      key={params.toString()}
      scenarioID={scenarioID}
      side={side}
      target={target}
      express={express}
    />
  )
}

function AgentEntry({ scenarioID, side, target, express }: {
  scenarioID: string
  side: Side
  target: 'view' | 'build'
  express: boolean
}) {
  // StrictMode replays effects; share the get-or-create request for this entry.
  const open = async () => {
    const before = await myAgents.list().catch(() => null)
    const result = await builder.ensure({ scenarioID, side })
    const existed = before?.scenarios.some((scenario) =>
      scenario.sides[side].some((agent) => agent.agentID === result.agentID)
    )
    return { ...result, created: existed === false }
  }
  const request = useRef<ReturnType<typeof open> | null>(null)
  const { data, error, loading, reload } = useAsync(
    () => request.current ??= open(),
    [scenarioID, side],
  )

  if (loading) return <p role='status'>正在打开智能体…</p>
  if (error || !data) {
    return (
      <div className='space-y-4'>
        <p
          role='alert'
          className='text-sm text-(--accent)'
          {...tm('EA.entry-error')}
        >
          {error ?? '打开智能体失败'}
        </p>
        <div className='flex gap-2'>
          <Button
            onClick={() => {
              request.current = null
              reload()
            }}
          >
            重试
          </Button>
          <ButtonLink variant='secondary' to={`/scenarios/${scenarioID}`}>
            返回场景
          </ButtonLink>
        </div>
      </div>
    )
  }

  const params = new URLSearchParams({ scenario: scenarioID, side })
  if (express) params.set('express', '1')
  return (
    <Navigate
      replace
      state={data.created ? { renameNewAgent: true } : null}
      to={target === 'build' && !data.created
        ? `/agents/${data.agentID}/build?${params}`
        : `/agents/${data.agentID}${express ? '?express=1' : ''}`}
    />
  )
}
