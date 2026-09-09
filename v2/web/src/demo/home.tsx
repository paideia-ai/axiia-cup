import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Pencil, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { AgentVersionDTO } from '../api/types'
import { versionTag } from '../lib/version-label'
import { Button } from '../components/ui/button'
import { VersionList } from '../components/version-list'
import { Modal } from './modal'
import { AgentIdentity } from './agent-identity'
import { NewAgentButton } from './new-agent-button'
import { VersionCompare } from './version-compare'
import { type Agent, nameOf, scenarioOf } from './model'

export function AgentHome({ agent, agents, update, remove, onCreate }: {
  agent: Agent
  agents: Agent[]
  update: (agent: Agent) => void
  remove: () => void
  onCreate: (anchor: HTMLElement) => void
}) {
  const navigate = useNavigate()
  const agentRail = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const rail = agentRail.current
    if (!rail) return
    let mounted = true
    const revealCurrent = () => {
      if (!mounted) return
      const active = rail.querySelector<HTMLElement>('[aria-current="page"]')
      if (!active) return
      const item = active.getBoundingClientRect()
      const viewport = rail.getBoundingClientRect()
      if (item.left < viewport.left || item.right > viewport.right) {
        rail.scrollLeft += item.left - viewport.left -
          (rail.clientWidth - item.width) / 2
      }
    }
    revealCurrent()
    const observer = new ResizeObserver(revealCurrent)
    observer.observe(rail)
    void document.fonts.ready.then(revealCurrent)
    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [agent.id, agents.length])
  const [dialog, setDialog] = useState<'delete' | 'battle' | null>(
    null,
  )
  const [battleVersion, setBattleVersion] = useState<AgentVersionDTO | null>(
    null,
  )
  const [opponent, setOpponent] = useState('预设对手')
  const [battleDone, setBattleDone] = useState(false)
  const [entryNotice, setEntryNotice] = useState<number | null>(null)
  useEffect(() => {
    if (entryNotice == null) return
    const timer = setTimeout(() => setEntryNotice(null), 2400)
    return () => clearTimeout(timer)
  }, [entryNotice])
  const scenario = scenarioOf(agent)
  const role = scenario.roles[agent.side]
  function battle(version: AgentVersionDTO) {
    setBattleVersion(version)
    setBattleDone(false)
    setDialog('battle')
  }
  return (
    <div className='space-y-6'>
      <Link
        to='/my-agents'
        className='block text-sm text-(--foreground-subtle) hover:text-(--foreground)'
      >
        ← 我的智能体
      </Link>
      <AgentIdentity
        agent={agent}
        update={update}
        onDelete={() => setDialog('delete')}
      />
      <nav
        aria-label='同角色智能体'
        className='flex min-w-0 items-center gap-2'
      >
        <div
          ref={agentRail}
          className='flex min-w-0 items-center gap-2 overflow-x-auto py-1'
        >
          {agents.filter((other) =>
            other.scenario === agent.scenario && other.side === agent.side
          ).map((other) => (
            <Link
              key={other.id}
              to={`/agents/${other.id}`}
              aria-current={other.id === agent.id ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-(--accent) ${
                other.id === agent.id
                  ? 'border-(--accent) text-(--accent)'
                  : 'border-(--border) text-(--foreground-subtle)'
              }`}
            >
              {nameOf(other)}
            </Link>
          ))}
        </div>
        <NewAgentButton role={role} onClick={onCreate} />
      </nav>
      <VersionList
        versions={agent.versions}
        sideName={role}
        compactActions
        detailsMissing={(id) =>
          !!agent.versions.find((version) => version.id === id)?.detailsMissing}
        onSetEntry={(id) => {
          update({
            ...agent,
            entrySelectionUnknown: false,
            versions: agent.versions.map((version) => ({
              ...version,
              isEntry: version.id === id,
            })),
          })
          setEntryNotice(id)
        }}
        onField={battle}
        headingAction={
          <Button
            type='button'
            size='sm'
            variant='ghost'
            className='h-11 w-11 shrink-0 p-0 text-white md:h-8 md:w-8'
            aria-label='新建版本'
            title='新建版本'
            onClick={() => navigate(`/agents/${agent.id}/build`)}
          >
            <span aria-hidden='true' className='relative h-5 w-5'>
              <Pencil className='h-5 w-5' strokeWidth={1.8} />
              <Plus
                className='absolute -right-1 -bottom-0.5 h-3 w-3 rounded-sm bg-(--background)'
                strokeWidth={2}
              />
            </span>
          </Button>
        }
        headingAside={<span />}
      />
      {agent.entrySelectionUnknown && (
        <p className='text-xs text-(--foreground-muted)'>
          列表已标此智能体参赛，具体版本号未提供。
        </p>
      )}
      <VersionCompare
        key={`${agent.id}-${agent.versions.length}`}
        versions={agent.versions}
      />
      {entryNotice != null && (
        <div
          role='status'
          className='fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm shadow-xl md:bottom-8'
        >
          <Check aria-hidden='true' className='h-4 w-4 text-(--success)' />
          已设置用此版本参赛
        </div>
      )}
      {dialog === 'delete' && (
        <Modal
          title='删除智能体'
          onClose={() => setDialog(null)}
        >
          <p className='text-sm'>
            删除{nameOf(agent)}？{agent.draft
              ? '此智能体还有草稿，删除后将一并移除。'
              : '此智能体还没有保存的版本。'}
          </p>
          <div className='flex justify-end gap-2'>
            <Button variant='secondary' onClick={() => setDialog(null)}>
              取消
            </Button>
            <Button onClick={remove}>确认删除</Button>
          </div>
        </Modal>
      )}
      {dialog === 'battle' && (
        <Modal
          title='出战'
          onClose={() => setDialog(null)}
        >
          {battleDone
            ? (
              <div className='space-y-3' role='status'>
                <h3 className='font-semibold'>出战配置已确认</h3>
                <p className='text-sm text-(--foreground-subtle)'>
                  已选择 {nameOf(agent)} · {battleVersion &&
                    versionTag(
                      battleVersion,
                      agent.versions,
                    )}，对手为{opponent}。这是交互演示，不会发起真实对局。
                </p>
                <Button onClick={() => setDialog(null)}>返回智能体主页</Button>
              </div>
            )
            : (
              <>
                <p className='text-sm text-(--foreground-subtle)'>
                  {nameOf(agent)} ·{' '}
                  {battleVersion && versionTag(battleVersion, agent.versions)}
                </p>
                <fieldset className='space-y-2'>
                  <legend className='mb-3 text-sm'>选择对手</legend>
                  {['预设对手', '其他玩家', '左右手互搏'].map((option) => (
                    <label
                      key={option}
                      className='flex gap-3 rounded-md border border-(--border) p-3 text-sm'
                    >
                      <input
                        type='radio'
                        name='opponent'
                        checked={opponent === option}
                        onChange={() => setOpponent(option)}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
                <p className='text-xs text-(--foreground-subtle)'>
                  演示模式，不消耗额度。
                </p>
                <Button onClick={() => setBattleDone(true)}>
                  确认出战配置
                </Button>
              </>
            )}
        </Modal>
      )}
    </div>
  )
}
