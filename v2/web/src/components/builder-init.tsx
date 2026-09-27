import { Check, ChevronLeft, Copy, X } from 'lucide-react'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { assembleDeck, type Deck, type DeckSelections } from '../lib/deck'
import { usePresetUsage } from '../lib/preset-usage'
import { promptLength } from '../lib/prompt-length'
import { playSound, unlockAudio } from '../lib/sound'
import type { CreationTool } from '../lib/first-battle'
import { tm } from '../testmode/mark'
import { Button } from './ui/button'
import { StrategyMoreMenu } from './strategy-more-menu'

interface InitModesProps {
  accountID?: string
  agentID: number
  scenarioID: string
  deck: Deck | null
  presetRoleKey?: string | null
  presetRoles?: { key: string; name: string; deck: Deck }[]
  metaPrompt: string
  currentPrompt: string
  onFill: (text: string, method: 'mcq' | 'builder', roleKey?: string) => void
  promptUnitLimit: number | null
  express?: boolean
  initialTool?: CreationTool | null
  onDirect?: () => void
}

// The first battle keeps its guided choices. In the regular workspace,
// presets move into More after the first confirmed fill in this scenario.
export function InitModes({
  accountID,
  agentID,
  scenarioID,
  deck,
  presetRoleKey = null,
  presetRoles = [],
  metaPrompt,
  currentPrompt,
  onFill,
  promptUnitLimit,
  express = false,
  initialTool = null,
  onDirect,
}: InitModesProps) {
  const { used: presetsUsed, markUsed } = usePresetUsage(
    accountID,
    scenarioID,
    agentID,
  )
  const [open, setOpen] = useState<'mcq' | 'meta' | null>(null)
  const [transferring, setTransferring] = useState(false)
  const presetTrigger = useRef<HTMLButtonElement>(null)
  const returnToPreset = useCallback(() => presetTrigger.current, [])

  const [previewRoleKey, setPreviewRoleKey] = useState(presetRoleKey)
  const previewRole = presetRoles.find((role) => role.key === previewRoleKey) ??
    presetRoles[0]
  const previewDeck = previewRole?.deck ?? deck
  const rolePicker = presetRoles.length > 0
    ? (
      <fieldset className='mb-5 space-y-2'>
        <legend className='mb-2 text-sm font-semibold'>选择角色</legend>
        <div className='flex flex-wrap gap-2'>
          {presetRoles.map((role) => (
            <Button
              key={role.key}
              type='button'
              size='sm'
              variant={previewRole?.key === role.key ? 'primary' : 'secondary'}
              aria-pressed={previewRole?.key === role.key}
              onClick={() => setPreviewRoleKey(role.key)}
            >
              {role.name}
            </Button>
          ))}
        </div>
      </fieldset>
    )
    : null
  const fillPreset = (text: string) => {
    if (previewRole) onFill(text, 'mcq', previewRole.key)
    else onFill(text, 'mcq')
    markUsed()
    setOpen(null)
    setTransferring(false)
    globalThis.requestAnimationFrame(() => {
      const input = document.getElementById('prompt-input')
      input?.focus()
      input?.classList.add('mcq-prompt-arrived')
      globalThis.setTimeout(
        () => input?.classList.remove('mcq-prompt-arrived'),
        900,
      )
    })
  }

  useEffect(() => {
    if (initialTool === 'raw') onDirect?.()
  }, [initialTool, onDirect])

  useEffect(() => {
    if (express && initialTool == null) {
      const timer = globalThis.setTimeout(() => setOpen('mcq'), 320)
      return () => globalThis.clearTimeout(timer)
    }
    if (initialTool !== 'mcq' && initialTool !== 'meta') return
    const timer = globalThis.setTimeout(
      () => setOpen(initialTool),
      express ? 320 : 0,
    )
    return () => globalThis.clearTimeout(timer)
  }, [express, initialTool])

  return (
    <div
      className='flex flex-wrap items-center gap-x-2 gap-y-1'
      aria-label='策略辅助'
      {...tm('E.init-card')}
    >
      <span className='text-xs text-(--foreground-subtle)'>
        不知道怎么指挥智能体？
      </span>
      <div className='flex flex-wrap items-center gap-1'>
        <Button
          size='sm'
          variant='ghost'
          className='h-11 md:h-8'
          onClick={() => setOpen('meta')}
          {...tm('E.init-tab-meta')}
        >
          让 AI 帮你想策略
        </Button>
        {presetsUsed
          ? (
            <StrategyMoreMenu
              triggerRef={presetTrigger}
              onPresets={() => {
                setPreviewRoleKey(presetRoleKey)
                setOpen('mcq')
              }}
            />
          )
          : (
            <Button
              ref={presetTrigger}
              size='sm'
              variant='ghost'
              className='h-11 md:h-8'
              onClick={() => {
                setPreviewRoleKey(presetRoleKey)
                setOpen('mcq')
              }}
              {...tm('E.init-tab-mcq')}
            >
              选择预设策略
            </Button>
          )}
      </div>

      {open === 'mcq'
        ? (
          <ToolDialog
            title='选择预设策略'
            entry={express}
            leaving={transferring}
            onClose={() => {
              setOpen(null)
              setTransferring(false)
            }}
            returnFocus={returnToPreset}
          >
            {rolePicker}
            {previewDeck
              ? (
                <McqFlow
                  key={previewRole?.key}
                  deck={previewDeck}
                  currentPrompt={currentPrompt}
                  promptUnitLimit={promptUnitLimit}
                  onFill={fillPreset}
                  onTransferStart={() => setTransferring(true)}
                />
              )
              : (
                <div className='space-y-4'>
                  <p className='text-sm text-(--foreground-subtle)'>
                    这个角色暂时没有预设策略。你可以直接编写，或让你的 AI
                    帮你想策略。
                  </p>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={() => setOpen('meta')}
                  >
                    让 AI 帮你想策略
                  </Button>
                </div>
              )}
          </ToolDialog>
        )
        : null}

      {open === 'meta'
        ? (
          <ToolDialog
            title='让 AI 帮你想策略'
            onClose={() => setOpen(null)}
          >
            <MetaDraft metaPrompt={metaPrompt} />
          </ToolDialog>
        )
        : null}
    </div>
  )
}

function McqFlow({
  deck,
  currentPrompt,
  promptUnitLimit,
  onFill,
  onTransferStart,
}: {
  deck: Deck
  currentPrompt: string
  promptUnitLimit: number | null
  onFill: (text: string) => void
  onTransferStart: () => void
}) {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<DeckSelections>({})
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [overLimit, setOverLimit] = useState(false)
  const [locked, setLocked] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confirmRef = useRef<HTMLDivElement>(null)
  const question = deck.questions[step]
  const assembled = assembleDeck(deck, selections)

  useEffect(() => () => {
    if (timer.current != null) globalThis.clearTimeout(timer.current)
  }, [])
  useEffect(() => {
    if (confirmReplace) confirmRef.current?.scrollIntoView({ block: 'nearest' })
  }, [confirmReplace])

  const commit = (text: string) => {
    setConfirmReplace(false)
    setTransferring(true)
    onTransferStart()
    const reduced =
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    timer.current = globalThis.setTimeout(() => onFill(text), reduced ? 0 : 420)
  }

  const choose = (optionID: string) => {
    if (locked || transferring) return
    unlockAudio()
    playSound('click')
    const next = { ...selections, [question.id]: optionID }
    setSelections(next)
    setConfirmReplace(false)
    setOverLimit(false)
    setLocked(true)
    timer.current = globalThis.setTimeout(() => {
      setLocked(false)
      if (step < deck.questions.length - 1) {
        setStep(step + 1)
        return
      }
      const text = assembleDeck(deck, next)
      const existing = (document.getElementById('prompt-input') as
        | HTMLTextAreaElement
        | null)?.value ?? currentPrompt
      if (
        !text ||
        (promptUnitLimit != null && promptLength(text) > promptUnitLimit)
      ) {
        setOverLimit(true)
      } else if (existing.trim()) {
        setConfirmReplace(true)
      } else {
        commit(text)
      }
    }, 180)
  }

  return (
    <div className='relative space-y-5'>
      <div
        className='flex gap-2'
        aria-label={`第 ${step + 1} 题，共 ${deck.questions.length} 题`}
      >
        {deck.questions.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${
              index <= step ? 'bg-(--accent)' : 'bg-(--border)'
            }`}
          />
        ))}
      </div>
      <fieldset
        disabled={locked || transferring}
        {...tm('E.mcq-question')}
      >
        <legend className='w-full'>
          <span className='font-mono text-xs text-(--foreground-muted)'>
            {String(step + 1).padStart(2, '0')} /{' '}
            {String(deck.questions.length).padStart(2, '0')}
          </span>
          <span className='mt-2 block text-lg font-semibold leading-7'>
            {question.prompt}
          </span>
        </legend>
        <div className='mt-5 grid gap-3'>
          {question.options.map((option, index) => {
            const active = selections[question.id] === option.id
            return (
              <button
                key={option.id}
                type='button'
                aria-pressed={active}
                onClick={() => choose(option.id)}
                className={`group flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium leading-6 transition ${
                  active
                    ? 'border-(--accent) bg-[rgba(224,74,47,0.1)] text-(--foreground)'
                    : 'border-(--border) bg-white/2 text-(--foreground-subtle) hover:border-(--foreground-muted) hover:bg-white/4 hover:text-(--foreground)'
                }`}
                {...tm('E.mcq-option')}
              >
                <span
                  aria-hidden='true'
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${
                    active
                      ? 'border-(--accent) bg-(--accent) text-white'
                      : 'border-(--border) text-(--foreground-muted)'
                  }`}
                >
                  {active
                    ? <Check aria-hidden='true' className='h-3.5 w-3.5' />
                    : String.fromCharCode(65 + index)}
                </span>
                {option.label}
              </button>
            )
          })}
        </div>
      </fieldset>
      {overLimit
        ? (
          <p role='alert' className='text-sm text-(--accent)'>
            生成结果超过字数上限，请返回修改选项。
          </p>
        )
        : null}
      {confirmReplace
        ? (
          <div
            ref={confirmRef}
            role='alert'
            className='space-y-3 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] p-3'
          >
            <p className='text-sm text-(--warning)'>
              主输入框已有策略，是否用这份预设策略替换？
            </p>
            <div className='flex gap-2'>
              <Button size='sm' onClick={() => commit(assembled)}>
                替换当前草稿
              </Button>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => setConfirmReplace(false)}
              >
                取消
              </Button>
            </div>
          </div>
        )
        : null}
      <div className='border-t border-(--border-soft) pt-4'>
        <Button
          size='sm'
          variant='ghost'
          disabled={step === 0 || locked || transferring}
          onClick={() => {
            setConfirmReplace(false)
            setOverLimit(false)
            setStep((value) => value - 1)
          }}
        >
          <ChevronLeft aria-hidden='true' className='mr-1 h-4 w-4' />
          上一题
        </Button>
      </div>
      {transferring
        ? (
          <div
            className='mcq-transfer absolute inset-0 z-10 flex items-center justify-center'
            role='status'
            aria-label='正在填入工作区'
          >
            <span aria-hidden='true' className='mcq-transfer-line' />
          </div>
        )
        : null}
    </div>
  )
}

function MetaDraft({ metaPrompt }: { metaPrompt: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )

  const copyMeta = async () => {
    try {
      await navigator.clipboard.writeText(metaPrompt)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm leading-7 text-(--foreground-subtle)'>
        复制下面的策略构建提示词，发给你常用的
        AI。它会与你讨论、帮你完善策略；等你确认后，再生成最终策略提示词。
        将最终策略粘贴回构建器的主输入框。
      </p>
      <pre
        aria-label='策略构建提示词内容'
        tabIndex={0}
        className='max-h-72 select-text overflow-y-auto whitespace-pre-wrap rounded-md border border-(--border-soft) bg-white/2 p-3 font-sans text-xs leading-6 text-(--foreground-subtle)'
        {...tm('E.meta-prompt-text')}
      >
        {metaPrompt}
      </pre>
      {copyState === 'failed'
        ? (
          <p role='status' className='text-xs text-(--warning)'>
            无法自动复制，请手动选择上方策略构建提示词并复制。
          </p>
        )
        : null}
      <Button
        size='sm'
        variant='secondary'
        onClick={() => void copyMeta()}
        {...tm('E.meta-copy-button')}
      >
        {copyState === 'copied'
          ? <Check aria-hidden='true' className='mr-1.5 h-3.5 w-3.5' />
          : <Copy aria-hidden='true' className='mr-1.5 h-3.5 w-3.5' />}
        {copyState === 'copied' ? '已复制' : '复制策略构建提示词'}
      </Button>
    </div>
  )
}

function ToolDialog({
  title,
  onClose,
  children,
  returnFocus,
  entry = false,
  leaving = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  returnFocus?: () => HTMLElement | null
  entry?: boolean
  leaving?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleID = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      const target = returnFocus?.() ?? opener
      if (target?.isConnected) target.focus()
    }
  }, [returnFocus])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleID}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`mcq-dialog fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-(--border) bg-(--surface-elevated) p-0 text-(--foreground) shadow-2xl outline-none backdrop:bg-black/55 ${
        entry ? 'mcq-dialog--entry' : ''
      } ${leaving ? 'mcq-dialog--leaving' : ''}`}
    >
      <div className='sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-(--border-soft) bg-(--surface-elevated) px-5 py-4'>
        <h2 id={titleID} className='font-semibold'>{title}</h2>
        <button
          type='button'
          aria-label='关闭弹窗'
          onClick={onClose}
          className='flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) md:h-8 md:w-8'
        >
          <X aria-hidden='true' className='h-4 w-4' />
        </button>
      </div>
      <div className='space-y-5 p-5'>{children}</div>
    </dialog>
  )
}
