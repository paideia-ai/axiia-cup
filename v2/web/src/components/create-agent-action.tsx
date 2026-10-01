import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { agents, ApiError } from '../api/client'
import type { Side } from '../api/types'
import { agentEntryUrl } from '../lib/agent-entry'
import { navigationCache, navigationEpoch } from '../lib/navigation-cache'
import { agentQuery } from '../lib/navigation-queries'
import { rejectCopy } from '../lib/reject-copy'
import { tm } from '../testmode/mark'
import { rolesForSide, scenarioModule } from '../scenarios'
import { PortraitRoleChoice } from './portrait-role-choice/portrait-role-choice'
import { Modal } from './modal'
import { NewAgentButton } from './new-agent-button'
import { Button, ButtonLink } from './ui/button'

// Coalesce rapid clicks even if the source control unmounts and mounts again.
const pending = new Map<string, Promise<number>>()

async function create(
  scenarioID: string,
  side: Side,
  epoch: number,
  roleKey?: string,
) {
  const { agentID } = await agents.create({
    scenarioID,
    side,
    ...(roleKey ? { roleKey } : {}),
  })
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
  express = false,
  variant,
}: {
  scenarioID: string
  side: Side
  role: string
  oppositeRole?: string
  children?: ReactNode
  marker?: string
  testID?: string
  attention?: boolean
  express?: boolean
  // 宿主面板沿用自己的按钮层级（出战面板里是次要按钮）。
  variant?: 'primary' | 'secondary'
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentLocation = useRef(location.key)
  currentLocation.current = location.key
  const roles = rolesForSide(scenarioModule(scenarioID), side).slice().sort(
    (a, b) => {
      if (scenarioID !== 'honnoji-decision' || side !== 'a') return 0
      return Number(b.key === 'yoshiaki') - Number(a.key === 'yoshiaki')
    },
  )
  const [choosing, setChoosing] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
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

  const submit = async (roleKey?: string) => {
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
    const key = JSON.stringify([epoch, scenarioID, side, roleKey])
    let request = pending.get(key)
    if (!request) {
      request = create(scenarioID, side, epoch, roleKey)
      pending.set(key, request)
      void request.finally(() => pending.delete(key)).catch(() => {})
    }
    try {
      const agentID = await request
      if (isCurrent()) {
        navigate(`/agents/${agentID}${express ? '?express=1' : ''}`, {
          state: { renameNewAgent: true },
        })
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

  const begin = () => {
    if (roles.length > 1) {
      setSelectedRole(null)
      setError(null)
      setGate(false)
      setChoosing(true)
    } else {
      void submit()
    }
  }

  const control = children
    ? (
      <Button
        size='sm'
        variant={variant}
        disabled={busy}
        data-testid={testID}
        onClick={begin}
      >
        {children}
      </Button>
    )
    : (
      <NewAgentButton
        role={role}
        attention={attention}
        disabled={busy}
        onClick={begin}
      />
    )

  return (
    <div className='contents'>
      <span className='inline-flex' aria-busy={busy} data-tm={marker}>
        {scenarioID === 'honnoji-decision' && roles.length === 2
          ? (
            <PortraitRoleChoice
              roles={roles}
              disabled={busy}
              onSelect={(key) => void submit(key)}
            >
              {control}
            </PortraitRoleChoice>
          )
          : control}
      </span>
      {choosing && (
        <Modal
          title={`选择${role}的角色`}
          onClose={() => {
            if (!busy) setChoosing(false)
          }}
        >
          <p className='text-sm text-(--foreground-subtle)'>
            先选择角色，再创建智能体。角色创建后固定，所有策略版本都将使用这个角色。
          </p>
          <fieldset disabled={busy} className='space-y-3'>
            <legend className='sr-only'>出场角色</legend>
            {roles.map((option) => (
              <label
                key={option.key}
                className='flex cursor-pointer gap-3 rounded-lg border border-(--border) p-4'
              >
                <input
                  type='radio'
                  name='agent-role'
                  value={option.key}
                  checked={selectedRole === option.key}
                  onChange={() => setSelectedRole(option.key)}
                />
                <span>
                  <span className='block font-medium'>{option.name}</span>
                  <span className='mt-1 block text-sm text-(--foreground-subtle)'>
                    {option.pitch}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {error && (
            <p role='alert' className='text-sm text-(--accent)'>{error}</p>
          )}
          <div className='flex justify-end gap-2'>
            <Button
              variant='secondary'
              disabled={busy}
              onClick={() => setChoosing(false)}
            >
              取消
            </Button>
            <Button
              disabled={busy || selectedRole == null}
              onClick={() => {
                if (selectedRole) void submit(selectedRole)
              }}
            >
              {busy ? '创建中…' : '创建智能体'}
            </Button>
          </div>
        </Modal>
      )}
      {error && !choosing && (
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
