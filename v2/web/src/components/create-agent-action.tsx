import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { agents, ApiError } from '../api/client'
import type { Side } from '../api/types'
import { agentEntryUrl } from '../lib/agent-entry'
import { navigationCache, navigationEpoch } from '../lib/navigation-cache'
import { agentQuery } from '../lib/navigation-queries'
import { rejectCopy } from '../lib/reject-copy'
import { tm } from '../testmode/mark'
import { NewAgentButton } from './new-agent-button'
import { Button, ButtonLink } from './ui/button'

// Coalesce rapid clicks even if the source control unmounts and mounts again.
const pending = new Map<string, Promise<number>>()

async function create(scenarioID: string, side: Side, epoch: number) {
  const { agentID } = await agents.create({ scenarioID, side })
  // Keep the source page stable until the destination can paint its real content.
  // A failed read must never turn a successful creation into another POST.
  if (epoch === navigationEpoch()) {
    await navigationCache.prefetchQuery(agentQuery(agentID))
  }
  return agentID
}

export function CreateAgentAction({
  scenarioID,
  side,
  role,
  oppositeRole,
  children,
  marker,
  testID,
  attention,
}: {
  scenarioID: string
  side: Side
  role: string
  oppositeRole?: string
  children?: ReactNode
  marker?: string
  testID?: string
  attention?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentLocation = useRef(location.key)
  currentLocation.current = location.key
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gate, setGate] = useState(false)
  const live = useRef(true)
  const locked = useRef(false)
  useEffect(() => {
    live.current = true
    return () => {
      live.current = false
    }
  }, [])

  const submit = async () => {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError(null)
    setGate(false)
    const epoch = navigationEpoch()
    const source = location.key
    const isCurrent = () =>
      live.current && epoch === navigationEpoch() &&
      source === currentLocation.current
    const key = JSON.stringify([epoch, scenarioID, side])
    let request = pending.get(key)
    if (!request) {
      request = create(scenarioID, side, epoch)
      pending.set(key, request)
      void request.finally(() => pending.delete(key)).catch(() => {})
    }
    try {
      const agentID = await request
      if (isCurrent()) {
        navigate(`/agents/${agentID}`, { state: { renameNewAgent: true } })
      }
    } catch (cause) {
      if (!isCurrent()) return
      setGate(cause instanceof ApiError && cause.code === 'sibling_gate')
      setError(
        cause instanceof ApiError
          ? rejectCopy(cause, null, '创建智能体失败')
          : '网络开小差了——请检查连接后重试',
      )
    } finally {
      locked.current = false
      if (live.current) setBusy(false)
    }
  }

  return (
    <div className='contents'>
      <span className='inline-flex' aria-busy={busy} data-tm={marker}>
        {children
          ? (
            <Button
              size='sm'
              disabled={busy}
              data-testid={testID}
              onClick={() => void submit()}
            >
              {children}
            </Button>
          )
          : (
            <NewAgentButton
              role={role}
              attention={attention}
              disabled={busy}
              onClick={() => void submit()}
            />
          )}
      </span>
      {error && (
        <div className='w-full space-y-2 text-sm' {...tm('E.new-agent-error')}>
          <p role='alert' className='text-(--accent)'>{error}</p>
          {gate && (
            <div {...tm('E.new-agent-gate')}>
              <ButtonLink
                size='sm'
                variant='secondary'
                to={agentEntryUrl(scenarioID, side === 'a' ? 'b' : 'a')}
                {...tm('E.new-agent-gate-switch')}
              >
                去完善{oppositeRole ?? '对侧'}智能体
              </ButtonLink>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
