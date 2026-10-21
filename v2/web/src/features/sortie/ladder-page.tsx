import { HighestWinRate } from './highest-win-rate'
import {
  ChevronRight,
  Flame,
  LoaderCircle,
  ShieldCheck,
  Swords,
} from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, ladder } from '../../api/client'
import type {
  LadderEntryDTO,
  LadderPairingResponse,
  MyAgentsResponse,
  ScenarioSummary,
  Side,
} from '../../api/types'
import { PageLoading } from '../../components/page-loading'
import { RolePortrait } from '../../components/role-portrait'
import { speakerLabels } from '../../components/timeline/labels'
import { useAuth } from '../../context/auth'
import { agentEntryUrl, preferredAgent } from '../../lib/agent-entry'
import { catalogQuery, inventoryQuery } from '../../lib/navigation-queries'
import { orderScenarios } from '../../lib/scenario-order'
import { usePageQuery } from '../../lib/use-page-query'
import { rejectCopy } from '../../lib/reject-copy'
import { roleByKey, scenarioModule } from '../../scenarios'
import { EntryPicker } from './entry-picker'
import { OpponentReveal } from './opponent-reveal'
import { colors, sortieArtwork } from './theme'
import './sortie.css'

const rolePreferences = new Map<string, Partial<Record<Side, string>>>()
const scenePreferences = new Map<string, string>()

const emptyRecord = { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 }
const rate = (value: number | null | undefined) =>
  value == null ? '—' : `${(value * 100).toFixed(1)}%`
const fielded = (entry: LadderEntryDTO) => ({
  ...entry,
  ...entry.record,
  active: true,
  eligible: true,
})

export default function LadderPage() {
  const catalog = usePageQuery(catalogQuery())
  const inventory = usePageQuery(inventoryQuery())
  const { account } = useAuth()
  if (catalog.error || inventory.error) {
    return (
      <div role='alert'>
        {catalog.error || inventory.error}
        <button
          type='button'
          onClick={() => {
            catalog.reload()
            inventory.reload()
          }}
        >
          重试
        </button>
      </div>
    )
  }
  if (!catalog.data || !inventory.data) return <PageLoading variant='detail' />
  const scenes = orderScenarios(catalog.data.scenarios)
  if (!scenes.length) return <p>暂无可用场景。</p>
  return (
    <LadderScenes
      key={account?.id}
      scenes={scenes}
      inventory={inventory.data}
    />
  )
}

function LadderScenes(
  { scenes, inventory }: {
    scenes: ScenarioSummary[]
    inventory: MyAgentsResponse
  },
) {
  const { account } = useAuth()
  const owner = account?.id ?? ''
  const [scenarioID, setScenarioID] = useState(
    scenePreferences.get(owner) ?? scenes[0].id,
  )
  const scene = scenes.find((s) => s.id === scenarioID) ?? scenes[0]
  return (
    <LadderScene
      key={scene.id}
      scene={scene}
      scenes={scenes}
      inventory={inventory}
      onScenario={(id) => {
        scenePreferences.set(owner, id)
        setScenarioID(id)
      }}
    />
  )
}

function LadderScene(
  { scene, scenes, inventory, onScenario }: {
    scene: ScenarioSummary
    scenes: ScenarioSummary[]
    inventory: MyAgentsResponse
    onScenario: (id: string) => void
  },
) {
  const navigate = useNavigate()
  const { account } = useAuth()
  const query = usePageQuery({
    queryKey: ['ladder', account?.id, scene.id],
    queryFn: () => ladder.overview(scene.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  })
  const [side, setSide] = useState<Side>('a')
  const preferenceKey = `${account?.id}:${scene.id}`
  const [roles, setRoles] = useState<Partial<Record<Side, string>>>(() =>
    rolePreferences.get(preferenceKey) ?? {}
  )
  const [picker, setPicker] = useState<Side | null>(null)
  const [pairing, setPairing] = useState<LadderPairingResponse | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const lock = useRef(false)
  const mounted = useRef(true)
  const loadout = useRef<HTMLElement>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const module = scenarioModule(scene.id)
  const configurable = scene.id === 'honnoji-decision'
  const entries = query.data?.entries ?? []
  const selectedRole = (target: Side) =>
    roleByKey(
      module,
      roles[target] ?? entries.find((e) => e.side === target)?.role?.key,
    )
  const selectedEntry = (target: Side) => {
    const role = selectedRole(target)
    if (configurable && !role) return undefined
    return entries.find((e) =>
      e.side === target &&
      (!configurable || roleByKey(module, e.role?.key)?.key === role?.key)
    )
  }
  const roleIdentity = (target: Side) => ({
    roleKey: selectedRole(target)?.key ?? target,
    roleName: selectedRole(target)?.name ??
      (configurable
        ? '未选择角色'
        : target === 'a'
        ? scene.sideAName
        : scene.sideBName),
  })
  const entry = selectedEntry(side)
  const stats = entry?.record ?? emptyRecord
  const count = stats.wins + stats.losses + stats.draws
  const [title, accent, background, hook] = colors[scene.id] ??
    [scene.title, '#eebc69', '#292929', scene.subject]
  const artwork = sortieArtwork(scene.id)
  const labels = speakerLabels(scene.id, {
    a: scene.sideAName,
    b: scene.sideBName,
  })
  const busy = pending || pairing != null || picker != null
  const agents =
    inventory.scenarios.find((s) => s.scenarioID === scene.id)?.sides[side] ??
      []
  const agent = preferredAgent(
    agents.filter((a) =>
      !configurable ||
      roleByKey(module, a.role?.key)?.key === selectedRole(side)?.key
    ),
  )
  const settingsPath = agent
    ? `/agents/${agent.agentID}`
    : configurable
    ? '/my-agents'
    : agentEntryUrl(scene.id, side)
  const practicePath = entry
    ? `/agents/${entry.agentID}?version=${entry.versionID}&battle=npc`
    : settingsPath
  const closePicker = () => {
    const target = picker
    setPicker(null)
    requestAnimationFrame(() =>
      loadout.current?.querySelector<HTMLButtonElement>(
        `[data-sortie-change-side="${target}"]`,
      )?.focus({ preventScroll: true })
    )
  }
  const match = async () => {
    if (!entry || lock.current) return
    lock.current = true
    setPending(true)
    setError(null)
    setExpired(false)
    try {
      const result = await ladder.pair(entry.versionID)
      if (mounted.current) setPairing(result)
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof ApiError && cause.code === 'no_opponent'
            ? '该场景对侧暂无可用对手'
            : rejectCopy(cause, null, '匹配未能完成，请重试。'),
        )
        query.reload()
      }
    } finally {
      lock.current = false
      if (mounted.current) setPending(false)
    }
  }
  const start = async () => {
    if (!pairing || lock.current) return
    lock.current = true
    setPending(true)
    setError(null)
    try {
      const result = await ladder.start(pairing.id)
      if (mounted.current) navigate(`/matches/${result.matchID}`)
    } catch (cause) {
      if (mounted.current) {
        setError(rejectCopy(cause, null, '未能开始对局，请重试。'))
        setExpired(
          cause instanceof ApiError &&
            ['pairing_expired', 'entry_changed', 'not_found'].includes(
              cause.code,
            ),
        )
      }
    } finally {
      lock.current = false
      if (mounted.current) setPending(false)
    }
  }
  return (
    <div
      className='sortie-page'
      style={{
        '--sortie-accent': accent,
        '--sortie-backdrop': background,
      } as CSSProperties}
    >
      <div className='sortie-stage'>
        <Link
          className='sortie-stage-target'
          to={`/scenarios/${scene.id}`}
          aria-label={`${title}场景介绍`}
        />
        <div className='sortie-art'>
          {artwork && <img src={artwork.src} alt={artwork.alt} />}
        </div>
        <div className='sortie-scene-copy'>
          <span className='sortie-mode'>
            <Swords size={14} />天梯匹配
          </span>
          <h2>{title}</h2>
          <p>{hook}</p>
        </div>
        <div className='sortie-records'>
          <div className='sortie-linked-record'>
            <span>智能体胜率</span>
            <strong>{rate(count ? stats.wins / count : null)}</strong>
            <small>
              {count
                ? `${stats.wins} 胜 ${stats.losses} 负 ${stats.draws} 平`
                : '还没有天梯对局'}
            </small>
            {entry && (
              <Link
                className='sortie-record-link'
                to={`/agents/${entry.agentID}`}
                aria-label={`智能体胜率 ${
                  rate(count ? stats.wins / count : null)
                }，查看智能体主页`}
                title='查看智能体主页'
              />
            )}
          </div>
          <div>
            <span>
              <Flame size={14} />当前连胜
            </span>
            <strong>
              {entry ? stats.streak : '—'}
              <em>场</em>
            </strong>
            <small>
              {entry ? `个人最高 ${stats.bestStreak} 场` : '先选择参赛智能体'}
            </small>
          </div>
          <HighestWinRate
            value={rate(query.data?.highestWinRate)}
            agentID={query.data?.highestWinRateAgentID}
          />
        </div>
      </div>
      <div className='sortie-scenarios' role='group' aria-label='选择出战场景'>
        {scenes.map((s) => {
          const image = sortieArtwork(s.id)
          const theme = colors[s.id] ?? [s.title, accent, background]
          return (
            <button
              key={s.id}
              type='button'
              aria-pressed={s.id === scene.id}
              disabled={busy}
              style={{
                '--tile-color': theme[1],
                '--tile-backdrop': theme[2],
              } as CSSProperties}
              onClick={() => onScenario(s.id)}
            >
              <span className='sortie-scenario-art'>
                {image && <img src={image.src} alt='' loading='lazy' />}
              </span>
              <span>{theme[0]}</span>
            </button>
          )
        })}
      </div>
      <section
        ref={loadout}
        className='sortie-loadout'
        aria-label='参赛角色'
      >
        <div className='sortie-loadout-top'>
          <span>
            <ShieldCheck size={14} />自动使用参赛版本
          </span>
        </div>
        {query.error
          ? (
            <div role='alert'>
              {query.error}
              <button type='button' onClick={query.reload}>重试</button>
            </div>
          )
          : !query.data
          ? <PageLoading />
          : picker
          ? (
            <EntryPicker
              scenarioID={scene.id}
              side={picker}
              faction={picker === 'a' ? scene.sideAName : scene.sideBName}
              current={selectedRole(picker)?.key ?? null}
              onClose={closePicker}
              onCommit={(key) => {
                rolePreferences.set(preferenceKey, { ...roles, [picker]: key })
                setRoles({ ...roles, [picker]: key })
                setSide(picker)
                setError(null)
                closePicker()
                return true
              }}
            />
          )
          : pairing
          ? (
            <>
              <OpponentReveal
                entry={fielded(pairing.entry)}
                opponent={fielded(pairing.opponent)}
                labels={labels}
                ownRole={{
                  roleKey: pairing.entry.role?.key ?? pairing.entry.side,
                  roleName: pairing.entry.role?.name ??
                    roleIdentity(side).roleName,
                }}
                otherRole={{
                  roleKey: pairing.opponent.role?.key ?? pairing.opponent.side,
                  roleName: pairing.opponent.role?.name ??
                    (side === 'a' ? scene.sideBName : scene.sideAName),
                }}
                name={pairing.opponent.ownerName}
                submitting={pending}
                error={error}
                onStart={() => void start()}
                disabled={expired}
              />
              {expired && (
                <button
                  type='button'
                  className='sortie-primary'
                  onClick={() => {
                    setPairing(null)
                    setError(null)
                    query.reload()
                  }}
                >
                  重新匹配
                </button>
              )}
            </>
          )
          : (
            <>
              <div
                className='sortie-roles'
                role='group'
                aria-label='选择出战角色'
              >
                {configurable &&
                  (['a', 'b'] as const).map((target) => (
                    <div className='sortie-faction-heading' key={target}>
                      <p
                        className='sortie-faction'
                        id={`sortie-faction-${target}`}
                      >
                        {target === 'a' ? scene.sideAName : scene.sideBName}
                      </p>
                      <button
                        type='button'
                        className='sortie-change-role'
                        data-sortie-change-side={target}
                        aria-label={`${
                          target === 'a' ? scene.sideAName : scene.sideBName
                        }：更换角色`}
                        disabled={busy}
                        onClick={() =>
                          setPicker(target)}
                      >
                        更换角色
                      </button>
                    </div>
                  ))}
                {(['a', 'b'] as const).map((target) => {
                  const role = roleIdentity(target)
                  const hasRole = !configurable || selectedRole(target) != null
                  return (
                    <button
                      key={target}
                      type='button'
                      data-sortie-side={target}
                      aria-pressed={side === target && hasRole}
                      disabled={busy}
                      aria-describedby={configurable
                        ? `sortie-faction-${target}`
                        : undefined}
                      onClick={() => {
                        setSide(target)
                        setError(null)
                      }}
                    >
                      {hasRole && (
                        <RolePortrait
                          labels={labels}
                          speaker={role.roleKey}
                          size='sm'
                        />
                      )}
                      <span className='sortie-role-label'>
                        <span>{role.roleName}</span>
                      </span>
                      <span className='sortie-role-check'>
                        {hasRole && side === target ? '✓' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className='sortie-entry-line'>
                <span>
                  {entry
                    ? (
                      <>
                        参赛 v{entry.ordinal}
                        <span className='sortie-entry-id'>
                          · #{entry.versionID}
                        </span>
                      </>
                    )
                    : '尚未设置参赛版本'}
                </span>
              </div>
              <div className='sortie-deploy'>
                <div className='sortie-match-note'>
                  {error ? <p role='alert'>{error}</p> : !entry
                    ? (
                      <>
                        <b>先选一份策略出战</b>
                        <span>在智能体页把已保存版本设为参赛。</span>
                      </>
                    )
                    : !scene.gateUnlocked
                    ? (
                      <>
                        <b>完成练习后解锁玩家匹配</b>
                        <span>两侧分别完成 NPC 练习后即可匹配。</span>
                      </>
                    )
                    : null}
                </div>
                {!entry || !scene.gateUnlocked
                  ? (
                    <Link
                      className='sortie-primary'
                      to={!entry ? settingsPath : practicePath}
                    >
                      {!entry ? '设置参赛版本' : '去练习'}
                      <ChevronRight size={18} />
                    </Link>
                  )
                  : (
                    <button
                      type='button'
                      className='sortie-primary'
                      disabled={pending}
                      onClick={() => void match()}
                    >
                      {pending
                        ? <LoaderCircle className='sortie-spinner' size={20} />
                        : <Swords size={20} />}{' '}
                      {pending ? '正在匹配…' : error ? '重新匹配' : '随机匹配'}
                    </button>
                  )}
              </div>
            </>
          )}
      </section>
    </div>
  )
}
