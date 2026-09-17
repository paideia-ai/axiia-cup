import { Archive, ArchiveRestore, ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { agents, myAgents } from '../api/client'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  notifyAgentsChanged,
  subscribeAgentsChanged,
} from '../lib/agent-events'
import { messageOf, useAsync } from '../lib/use-async'

export function ArchivedAgentsPage() {
  const { data, error, loading, reload } = useAsync(myAgents.archived, [])
  const [busy, setBusy] = useState<number | null>(null)
  const busyRef = useRef(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [restored, setRestored] = useState<{ id: number; name: string } | null>(
    null,
  )
  const [removed, setRemoved] = useState<Set<number>>(new Set())
  useEffect(() => subscribeAgentsChanged(reload), [reload])
  useEffect(() => setRemoved(new Set()), [data])

  const restore = async (id: number, name: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(id)
    setActionError(null)
    try {
      await agents.restore(id)
      setRemoved((previous) => new Set([...previous, id]))
      setRestored({ id, name })
      notifyAgentsChanged()
    } catch (cause) {
      setActionError(messageOf(cause, '恢复失败，请重试'))
    } finally {
      busyRef.current = false
      setBusy(null)
    }
  }
  const archived =
    data?.agents.filter(({ agent }) => !removed.has(agent.agentID)) ?? []

  return (
    <div className='max-w-xl space-y-6'>
      <Link
        to='/settings'
        className='inline-flex min-h-11 items-center gap-2 text-sm text-(--foreground-muted) hover:text-(--foreground)'
      >
        <ArrowLeft aria-hidden='true' className='h-4 w-4' />返回设置
      </Link>
      <div>
        <h1 className='text-2xl font-black tracking-tight'>已归档的智能体</h1>
        <p className='mt-2 text-sm text-(--foreground-subtle)'>
          归档只隐藏智能体，版本和战绩都会保留。
        </p>
      </div>
      {restored && (
        <p role='status' className='text-sm text-(--foreground-muted)'>
          已恢复 {restored.name}。
          <Link
            className='underline underline-offset-4'
            to={`/agents/${restored.id}`}
          >
            查看智能体
          </Link>
        </p>
      )}
      {actionError && (
        <p role='alert' className='text-sm text-(--accent)'>{actionError}</p>
      )}
      {error
        ? (
          <div role='alert' className='space-y-3'>
            <p className='text-sm text-(--accent)'>{error}</p>
            <Button variant='secondary' onClick={reload}>重新加载</Button>
          </div>
        )
        : loading && data == null
        ? (
          <p role='status' className='text-sm text-(--foreground-subtle)'>
            加载中…
          </p>
        )
        : archived.length === 0
        ? (
          <Card className='px-5 py-10 text-center'>
            <Archive
              aria-hidden='true'
              className='mx-auto mb-3 h-6 w-6 text-(--foreground-subtle)'
            />
            <h2 className='text-sm font-semibold'>暂无已归档的智能体</h2>
            <p className='mt-2 text-sm text-(--foreground-subtle)'>
              在智能体主页的更多菜单中，可以归档暂时不用的智能体。
            </p>
            <Link
              to='/my-agents'
              className='mt-5 inline-flex min-h-11 items-center text-sm underline underline-offset-4'
            >
              我的智能体
            </Link>
          </Card>
        )
        : (
          <Card>
            <ul className='divide-y divide-(--border-soft)'>
              {archived.map(({ agent, sideName, scenarioTitle }) => {
                const name = agent.name
                  ? `${sideName}「${agent.name}」`
                  : `${sideName} #${agent.agentID}`
                return (
                  <li
                    key={agent.agentID}
                    className='flex items-center justify-between gap-4 p-5'
                  >
                    <div className='min-w-0'>
                      <h2 className='break-words text-sm font-semibold'>
                        {name}
                      </h2>
                      <p className='mt-1 text-xs text-(--foreground-subtle)'>
                        {scenarioTitle} · {agent.versionCount} 个版本
                      </p>
                    </div>
                    <Button
                      variant='secondary'
                      className='min-h-11 shrink-0 gap-2'
                      disabled={busy != null}
                      aria-label={`恢复 ${name}`}
                      onClick={() => void restore(agent.agentID, name)}
                    >
                      <ArchiveRestore aria-hidden='true' className='h-4 w-4' />
                      {busy === agent.agentID ? '恢复中…' : '恢复'}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
    </div>
  )
}
