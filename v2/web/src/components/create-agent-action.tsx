import { sideDisplayName } from '../lib/side-display-name'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { agents, ApiError } from '../api/client'
import type { Side } from '../api/types'
import { agentEntryUrl } from '../lib/agent-entry'
import { navigationCache, navigationEpoch } from '../lib/navigation-cache'
import { agentQuery, inventoryQuery } from '../lib/navigation-queries'
import { rejectCopy } from '../lib/reject-copy'
import { usePageQuery } from '../lib/use-page-query'
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
  size = 'sm',
  oppositeOnPage = false,
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
  size?: 'sm' | 'default'
  // 对侧的新建入口也在本页（我的智能体、场景页）：被引导门拦下时，对侧为空就不再
  // 另给创建按钮，用那一侧自己的入口。
  oppositeOnPage?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentLocation = useRef(location.key)
  currentLocation.current = location.key
  const module = scenarioModule(scenarioID)
  // Callers pass the script's side names or their own display names; faction
  // scenarios replace both with the same faction copy.
  const factions = module?.factionCopy
  const oppositeSide: Side = side === 'a' ? 'b' : 'a'
  const roleName = sideDisplayName(scenarioID, side, role)
  const oppositeName = factions?.stances[oppositeSide] ??
    oppositeRole ?? '对侧'
  const roles = rolesForSide(module, side).slice().sort(
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
      // grow：宿主把入口拉满整行时（首战旅程卡），按钮随之铺满。
      <Button
        size={size}
        variant={variant}
        className='grow'
        disabled={busy}
        data-testid={testID}
        onClick={begin}
      >
        {children}
      </Button>
    )
    : (
      <NewAgentButton
        role={roleName}
        label={factions ? `新建 ${roleName}` : undefined}
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
          title={`选择${roleName}的角色`}
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
              <SideEntryAction
                scenarioID={scenarioID}
                side={oppositeSide}
                role={oppositeName}
                oppositeRole={roleName}
                marker={tm('E.new-agent-gate-switch')['data-tm']}
                variant='secondary'
                ifEmpty={oppositeOnPage ? 'hide' : 'create'}
                createLabel={`创建${oppositeName}智能体`}
              >
                去完善{oppositeName}智能体
              </SideEntryAction>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 统一侧入口的就地版本：该侧已有未归档智能体（或清单还读不到）时，链接到
// /agents/entry 直达它；确认该侧为空、且有多名人物可选（目前是本能寺）时，人物签在
// 本按钮两侧就地弹出，不经中间选角色页。本页已有该侧自己的新建入口时（ifEmpty
// 'hide'），该侧为空就什么都不显示。
export function SideEntryAction({
  scenarioID,
  side,
  role,
  oppositeRole,
  children,
  createLabel,
  target,
  express = false,
  marker,
  testID,
  variant,
  size = 'sm',
  ifEmpty = 'create',
}: {
  scenarioID: string
  side: Side
  role: string
  oppositeRole?: string
  children: ReactNode
  // 该侧为空时换用的文案；缺省沿用 children。
  createLabel?: ReactNode
  ifEmpty?: 'create' | 'hide'
  target?: 'view' | 'build'
  express?: boolean
  marker?: string
  testID?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'default'
}) {
  const createHere = ifEmpty === 'create' &&
    rolesForSide(scenarioModule(scenarioID), side).length > 1
  // 单角色侧就地新建时不必读清单：有没有智能体，都由 /agents/entry 打开或创建草稿。
  const inventory = usePageQuery({
    ...inventoryQuery(),
    enabled: createHere || ifEmpty === 'hide',
  })
  const empty = inventory.data != null &&
    !inventory.data.scenarios.find((item) => item.scenarioID === scenarioID)
      ?.sides[side].some((agent) => !agent.isArchived)
  // 就地新建会刷新清单。显示过「创建」就保持到卸载：按钮若随之换回链接，创建流程被
  // 卸载，跳转新智能体主页就丢了。
  const [creating, setCreating] = useState(false)
  useEffect(() => {
    if (createHere && empty) setCreating(true)
  }, [createHere, empty])

  if (ifEmpty === 'hide' && empty) return null
  return createHere && (empty || creating)
    ? (
      <CreateAgentAction
        scenarioID={scenarioID}
        side={side}
        role={role}
        oppositeRole={oppositeRole}
        express={express}
        marker={marker}
        testID={testID}
        variant={variant}
        size={size}
      >
        {createLabel ?? children}
      </CreateAgentAction>
    )
    : (
      <ButtonLink
        size={size}
        variant={variant}
        to={agentEntryUrl(scenarioID, side, target, express)}
        data-tm={marker}
        data-testid={testID}
      >
        {children}
      </ButtonLink>
    )
}
