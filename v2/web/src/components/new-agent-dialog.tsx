import { Popover } from '@base-ui-components/react/popover'
import { X } from 'lucide-react'
import { type CSSProperties, useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { agents, ApiError } from '../api/client'
import type { ScenarioSummary, Side } from '../api/types'
import { rejectCopy } from '../lib/reject-copy'
import { tm } from '../testmode/mark'
import { Button } from './ui/button'
import { Input } from './ui/input'

export const AGENT_NAME_LIMIT = 30

interface NewAgentDialogProps {
  scenario: ScenarioSummary
  initialSide: Side
  onClose: () => void
  anchor?: HTMLElement | null
}

const MOBILE_QUERY = '(max-width: 767px)'

export function NewAgentDialog({
  scenario,
  initialSide,
  onClose,
  anchor = null,
}: NewAgentDialogProps) {
  const navigate = useNavigate()
  const inputID = useId()
  const returnFocus = useRef<HTMLElement | null>(
    globalThis.document?.activeElement instanceof HTMLElement
      ? globalThis.document.activeElement
      : null,
  )
  const liveRef = useRef(true)
  const [side, setSide] = useState<Side>(initialSide)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [gateError, setGateError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mobile, setMobile] = useState(() =>
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia(MOBILE_QUERY).matches
  )
  const [viewport, setViewport] = useState(() => ({
    bottom: 0,
    height: globalThis.innerHeight,
  }))

  useEffect(() => {
    liveRef.current = true
    return () => {
      liveRef.current = false
    }
  }, [])

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') return
    const media = globalThis.matchMedia(MOBILE_QUERY)
    const sync = () => {
      setMobile(media.matches)
      const visualViewport = globalThis.visualViewport
      setViewport({
        bottom: visualViewport
          ? Math.max(
            0,
            globalThis.innerHeight - visualViewport.height -
              visualViewport.offsetTop,
          )
          : 0,
        height: visualViewport?.height ?? globalThis.innerHeight,
      })
    }

    sync()
    media.addEventListener('change', sync)
    globalThis.visualViewport?.addEventListener('resize', sync)
    globalThis.visualViewport?.addEventListener('scroll', sync)
    return () => {
      media.removeEventListener('change', sync)
      globalThis.visualViewport?.removeEventListener('resize', sync)
      globalThis.visualViewport?.removeEventListener('scroll', sync)
    }
  }, [])

  const sideName = (which: Side) =>
    which === 'a' ? scenario.sideAName : scenario.sideBName
  const opposite: Side = side === 'a' ? 'b' : 'a'
  const nameLength = [...name].length
  const tooLong = nameLength > AGENT_NAME_LIMIT

  const switchToOpposite = () => {
    setSide(opposite)
    setGateError(null)
    setNameError(null)
    setError(null)
  }

  const submit = async () => {
    if (busy || tooLong) return
    const trimmed = name.trim()
    setBusy(true)
    setGateError(null)
    setNameError(null)
    setError(null)
    try {
      const { agentID } = await agents.create({
        scenarioID: scenario.id,
        side,
        name: trimmed === '' ? undefined : trimmed,
      })
      if (!liveRef.current) return
      onClose()
      navigate(`/agents/${agentID}`)
    } catch (cause) {
      if (!liveRef.current) return
      if (cause instanceof ApiError && cause.code === 'sibling_gate') {
        setGateError(rejectCopy(cause, null))
      } else if (cause instanceof ApiError && cause.code === 'name_too_long') {
        const copy = rejectCopy(cause, null)
        setNameError(
          copy === cause.message
            ? `名字太长了——最多 ${AGENT_NAME_LIMIT} 字，删几个再试`
            : copy,
        )
      } else if (
        cause instanceof ApiError &&
        (cause.status === 404 || cause.status === 405)
      ) {
        setError(
          '当前服务器还不支持新建多个智能体——该功能随后端更新自动开放，现有智能体不受影响',
        )
      } else if (cause instanceof ApiError) {
        setError(rejectCopy(cause, null, '创建智能体失败'))
      } else {
        setError('网络开小差了——请检查连接后重试')
      }
      setBusy(false)
    }
  }

  return (
    <Popover.Root
      open
      modal={mobile ? true : 'trap-focus'}
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <Popover.Portal>
        {mobile
          ? <Popover.Backdrop className='fixed inset-0 z-50 bg-black/55' />
          : null}
        <Popover.Positioner
          anchor={anchor}
          side='bottom'
          align='end'
          sideOffset={8}
          collisionPadding={16}
          positionMethod='fixed'
          data-unanchored={anchor == null ? 'true' : undefined}
          className='new-agent-positioner z-[60]'
          style={{
            '--new-agent-bottom-inset': `${viewport.bottom}px`,
            '--new-agent-available-height': `${
              Math.max(160, viewport.height - 16)
            }px`,
          } as CSSProperties}
        >
          <Popover.Popup
            initialFocus={() => globalThis.document?.getElementById(inputID)}
            finalFocus={() => {
              if (anchor?.isConnected) return anchor
              if (returnFocus.current?.isConnected) return returnFocus.current
              return false
            }}
            className='new-agent-panel w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-(--border) bg-(--surface-elevated) p-4 text-(--foreground) shadow-[0_12px_36px_rgba(0,0,0,0.32)] outline-none'
            {...tm('E.new-agent-dialog')}
          >
            <div className='mb-3 flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <Popover.Title className='text-sm font-semibold'>
                  新建{sideName(side)}智能体
                </Popover.Title>
                <Popover.Description className='mt-1 truncate text-xs text-(--foreground-muted)'>
                  {scenario.title}
                </Popover.Description>
              </div>
              <Popover.Close
                aria-label='关闭弹窗'
                disabled={busy}
                className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:w-8'
                {...tm('E.new-agent-close')}
              >
                <X aria-hidden='true' className='h-4 w-4' />
              </Popover.Close>
            </div>

            <form
              className='space-y-3'
              onSubmit={(event) => {
                event.preventDefault()
                void submit()
              }}
            >
              <div className='space-y-1.5'>
                <label
                  htmlFor={inputID}
                  className='text-xs font-medium text-(--foreground-subtle)'
                >
                  名称（可选）
                </label>
                <Input
                  id={inputID}
                  value={name}
                  aria-describedby={`${inputID}-count ${inputID}-error`}
                  aria-invalid={nameError != null || tooLong || undefined}
                  placeholder={`如「铁腕${sideName(side)}」`}
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError(null)
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' && event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                    }
                  }}
                  {...tm('E.new-agent-name-input')}
                />
                <div className='flex items-start justify-between gap-2 text-[11px]'>
                  <span
                    id={`${inputID}-error`}
                    role={nameError != null || tooLong ? 'alert' : undefined}
                    className='text-(--accent)'
                    {...tm('E.new-agent-name-error')}
                  >
                    {nameError ??
                      (tooLong ? `名字最多 ${AGENT_NAME_LIMIT} 字` : '')}
                  </span>
                  <span
                    id={`${inputID}-count`}
                    className={tooLong
                      ? 'shrink-0 font-semibold text-(--accent)'
                      : 'shrink-0 text-(--foreground-muted)'}
                    {...tm('E.new-agent-name-counter')}
                  >
                    {nameLength}/{AGENT_NAME_LIMIT}
                  </span>
                </div>
              </div>

              {gateError
                ? (
                  <div
                    className='space-y-2 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] p-3'
                    {...tm('E.new-agent-gate')}
                  >
                    <p role='alert' className='text-sm text-(--warning)'>
                      {gateError}
                    </p>
                    <p className='text-xs leading-5 text-(--foreground-subtle)'>
                      先为对侧保存一个策略，再创建更多同侧智能体。
                    </p>
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      onClick={switchToOpposite}
                      {...tm('E.new-agent-gate-switch')}
                    >
                      去创建{sideName(opposite)}智能体
                    </Button>
                  </div>
                )
                : null}

              {error
                ? (
                  <p
                    role='alert'
                    className='text-sm text-(--accent)'
                    {...tm('E.new-agent-error')}
                  >
                    {error}
                  </p>
                )
                : null}

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  size='sm'
                  className='min-h-10 px-5'
                  aria-label='创建智能体'
                  disabled={busy || tooLong}
                  data-testid='create-agent'
                  {...tm('E.new-agent-submit')}
                >
                  {busy ? '创建中…' : '创建'}
                </Button>
              </div>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
