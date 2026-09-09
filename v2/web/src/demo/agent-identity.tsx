import { Menu } from '@base-ui-components/react/menu'
import { Check, Ellipsis, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { type Agent, nameOf, scenarioOf } from './model'

export function AgentIdentity({ agent, update, onDelete }: {
  agent: Agent
  update: (agent: Agent) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(agent.name)
  const editRef = useRef<HTMLFormElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const wasEditing = useRef(false)
  useEffect(() => {
    if (editing) editRef.current?.querySelector('input')?.select()
    else if (wasEditing.current) headingRef.current?.focus()
    wasEditing.current = editing
  }, [editing])
  const canDelete = agent.versions.length === 0
  const scenario = scenarioOf(agent)
  return (
    <div>
      <p className='mb-2 text-xs text-(--foreground-subtle)'>智能体主页</p>
      <div className='flex items-start gap-2'>
        {editing
          ? (
            <form
              ref={editRef}
              className='flex w-full max-w-lg items-center gap-1'
              onSubmit={(event) => {
                event.preventDefault()
                update({ ...agent, name: name.trim() })
                setEditing(false)
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  (event.nativeEvent.isComposing || event.keyCode === 229)
                ) event.preventDefault()
                if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  setEditing(false)
                }
              }}
            >
              <label htmlFor='inline-agent-name' className='sr-only'>
                智能体名称
              </label>
              <Input
                id='inline-agent-name'
                className='min-w-0 flex-1 text-lg font-semibold'
                maxLength={30}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder='智能体名称（可选）'
              />
              <Button
                type='submit'
                variant='ghost'
                size='sm'
                className='h-9 w-9 shrink-0 p-0'
                aria-label='保存名称'
                title='保存名称（Enter）'
              >
                <Check aria-hidden='true' className='h-4 w-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-9 w-9 shrink-0 p-0'
                aria-label='取消重命名'
                title='取消（Esc）'
                onClick={() => setEditing(false)}
              >
                <X aria-hidden='true' className='h-4 w-4' />
              </Button>
            </form>
          )
          : (
            <h1
              ref={headingRef}
              tabIndex={-1}
              className='min-w-0 wrap-anywhere text-2xl font-black tracking-tight outline-none'
            >
              {nameOf(agent)}
            </h1>
          )}
        <Menu.Root>
          <Menu.Trigger
            ref={triggerRef}
            hidden={editing}
            aria-label='智能体更多操作'
            title='更多操作'
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent)'
          >
            <Ellipsis aria-hidden='true' className='h-5 w-5' />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align='end' sideOffset={6} className='z-40'>
              <Menu.Popup
                finalFocus={() =>
                  document.querySelector('dialog[open]')
                    ? false
                    : editRef.current?.querySelector('input') ??
                      triggerRef.current}
                className='w-56 rounded-lg border border-(--border) bg-(--surface-elevated) p-1 shadow-xl outline-none'
              >
                <Menu.Item
                  onClick={() => {
                    setName(agent.name)
                    setEditing(true)
                  }}
                  className='flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm outline-none data-highlighted:bg-white/6'
                >
                  <Pencil aria-hidden='true' className='h-4 w-4' />重命名
                </Menu.Item>
                <div
                  role='separator'
                  className='my-1 border-t border-(--border-soft)'
                />
                <Menu.Item
                  disabled={!canDelete}
                  aria-describedby={!canDelete
                    ? 'delete-unavailable'
                    : undefined}
                  onClick={onDelete}
                  className='flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm text-(--accent) outline-none data-highlighted:bg-white/6 data-disabled:cursor-default data-disabled:text-(--foreground-subtle)'
                >
                  <Trash2
                    aria-hidden='true'
                    className='h-4 w-4'
                  />删除智能体
                </Menu.Item>
                {!canDelete && (
                  <p
                    id='delete-unavailable'
                    className='px-3 pb-2 text-xs text-(--foreground-subtle)'
                  >
                    已有版本，无法删除
                  </p>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
      <p className='mt-1 text-sm text-(--foreground-subtle)'>
        {scenario.title} · {agent.side === 0 ? '甲方' : '乙方'} ·{' '}
        {agent.versions.length} 个版本 ·{' '}
        <span className='font-mono text-xs'>
          {agent.sourceIDMissing ? '编号未提供' : `#${agent.id}`}
        </span>
      </p>
    </div>
  )
}
