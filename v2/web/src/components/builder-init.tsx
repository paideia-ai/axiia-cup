import { Check, Copy, X } from 'lucide-react'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import {
  assembleDeck,
  type Deck,
  deckComplete,
  type DeckSelections,
} from '../lib/deck'
import { usePresetUsage } from '../lib/preset-usage'
import { promptLength } from '../lib/prompt-length'
import type { CreationTool } from '../lib/first-battle'
import { tm } from '../testmode/mark'
import { Button } from './ui/button'
import { StrategyMoreMenu } from './strategy-more-menu'

interface InitModesProps {
  accountID?: string
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
  const { used: presetsUsed, markUsed } = usePresetUsage(accountID, scenarioID)
  const [open, setOpen] = useState<'mcq' | 'meta' | null>(
    !express && initialTool !== 'raw' ? initialTool : null,
  )
  const presetTrigger = useRef<HTMLButtonElement>(null)
  const returnToPreset = useCallback(() => presetTrigger.current, [])
  const [tool, setTool] = useState<CreationTool>(initialTool ?? 'mcq')

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
  }

  useEffect(() => {
    if (initialTool === 'raw') onDirect?.()
  }, [initialTool, onDirect])

  if (express) {
    return (
      <section
        className='space-y-4'
        aria-label='新建方式'
        {...tm('E.init-card')}
      >
        <div className='flex flex-wrap gap-2'>
          {(['mcq', 'raw', 'meta'] as const).map((value) => (
            <Button
              key={value}
              variant={tool === value ? 'primary' : 'secondary'}
              aria-pressed={tool === value}
              onClick={() => {
                setTool(value)
                if (value === 'raw') onDirect?.()
              }}
              {...(value === 'mcq'
                ? tm('E.init-tab-mcq')
                : value === 'meta'
                ? tm('E.init-tab-meta')
                : {})}
            >
              {value === 'mcq'
                ? '选择预设策略'
                : value === 'raw'
                ? '直接编写'
                : '让 AI 帮你想策略'}
            </Button>
          ))}
        </div>
        {tool === 'mcq'
          ? (
            <section
              aria-label='选择预设策略'
              className='rounded-lg border border-(--border-soft) p-4'
            >
              {deck
                ? (
                  <McqDraft
                    deck={deck}
                    currentPrompt={currentPrompt}
                    promptUnitLimit={promptUnitLimit}
                    onFill={(text) => {
                      onFill(text, 'mcq')
                      markUsed()
                      setTool('raw')
                      onDirect?.()
                    }}
                  />
                )
                : (
                  <p>
                    这个角色暂时没有预设策略。你可以直接编写，或让 AI
                    帮你想策略。
                  </p>
                )}
            </section>
          )
          : tool === 'meta'
          ? (
            <section aria-label='让 AI 帮你想策略'>
              <MetaDraft metaPrompt={metaPrompt} />
            </section>
          )
          : <p>直接在下方策略提示词中编写；切换方式不会替换已有草稿。</p>}
      </section>
    )
  }

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
            onClose={() => setOpen(null)}
            returnFocus={returnToPreset}
          >
            {rolePicker}
            {previewDeck
              ? (
                <McqDraft
                  key={previewRole?.key}
                  deck={previewDeck}
                  currentPrompt={currentPrompt}
                  promptUnitLimit={promptUnitLimit}
                  onFill={(text) => {
                    fillPreset(text)
                    setOpen(null)
                  }}
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

function McqDraft({
  deck,
  currentPrompt,
  promptUnitLimit,
  onFill,
}: {
  deck: Deck
  currentPrompt: string
  promptUnitLimit: number | null
  onFill: (text: string) => void
}) {
  const [selections, setSelections] = useState<DeckSelections>({})
  const [confirmReplace, setConfirmReplace] = useState(false)
  const assembled = assembleDeck(deck, selections)
  const complete = deckComplete(deck, selections)
  const units = promptLength(assembled)
  const overLimit = promptUnitLimit != null && units > promptUnitLimit
  const unanswered = deck.questions.filter(
    (question) =>
      !question.options.some((option) => option.id === selections[question.id]),
  ).length
  const comboPending = deck.comboPrompts != null && !complete

  const requestFill = () => {
    if (
      currentPrompt.trim() !== '' &&
      currentPrompt.trim() !== assembled.trim()
    ) {
      setConfirmReplace(true)
      return
    }
    onFill(assembled)
  }

  return (
    <div className='space-y-5'>
      {deck.intro
        ? (
          <p className='text-sm text-(--foreground-subtle)'>
            {deck.intro}
          </p>
        )
        : null}
      {deck.questions.map((question, index) => (
        <fieldset
          key={question.id}
          className='space-y-2'
          {...tm('E.mcq-question')}
        >
          <legend className='mb-2 text-sm text-(--foreground)'>
            <span className='mr-1.5 font-mono text-xs text-(--foreground-muted)'>
              {index + 1}/{deck.questions.length}
            </span>
            {question.prompt}
          </legend>
          <div className='flex flex-wrap gap-2'>
            {question.options.map((option) => {
              const active = selections[question.id] === option.id
              return (
                <button
                  key={option.id}
                  type='button'
                  aria-pressed={active}
                  onClick={() => {
                    setConfirmReplace(false)
                    setSelections((current) => ({
                      ...current,
                      [question.id]: option.id,
                    }))
                  }}
                  className={active
                    ? 'cursor-pointer rounded-full border border-(--accent) bg-[rgba(224,74,47,0.1)] px-3 py-1.5 text-left text-xs font-semibold text-(--accent)'
                    : 'cursor-pointer rounded-full border border-(--border) px-3 py-1.5 text-left text-xs font-medium text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground)'}
                  {...tm('E.mcq-option')}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <section
        aria-label='拼装预览'
        className='space-y-3 border-t border-(--border-soft) pt-4'
        {...tm('E.mcq-preview')}
      >
        <div className='flex items-center justify-between gap-2'>
          <h3 className='text-sm font-semibold text-(--foreground)'>
            拼装预览
          </h3>
          <span
            className={`font-mono text-xs ${
              overLimit ? 'text-(--accent)' : 'text-(--foreground-muted)'
            }`}
            title='按汉字或英文词计数（非 token）'
            {...tm('E.mcq-counter')}
          >
            {units} / {promptUnitLimit ?? '—'}
          </span>
        </div>
        {assembled
          ? (
            <pre className='max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-(--border-soft) bg-white/2 p-3 font-sans text-xs leading-6 text-(--foreground-subtle)'>
              {assembled}
            </pre>
          )
          : (
            <p className='rounded-md border border-dashed border-(--border-soft) p-3 text-xs text-(--foreground-muted)'>
              {comboPending
                ? `选完全部 ${deck.questions.length} 题后生成完整提示词`
                : '选择上面的选项，提示词会在这里逐节拼出'}
            </p>
          )}
        {overLimit
          ? (
            <p role='alert' className='text-xs text-(--accent)'>
              拼装结果超过上限，请调整选项。
            </p>
          )
          : null}
        <div className='flex flex-wrap items-center gap-3'>
          <Button
            size='sm'
            disabled={!complete || assembled === '' || overLimit}
            onClick={requestFill}
            {...tm('E.mcq-fill-button')}
          >
            填入工作区
          </Button>
          {!complete
            ? (
              <span
                role='status'
                className='text-xs text-(--foreground-muted)'
                {...tm('E.mcq-remaining')}
              >
                还差 {unanswered} 题
              </span>
            )
            : null}
        </div>
        {confirmReplace
          ? (
            <div
              role='alert'
              className='space-y-3 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] p-3'
            >
              <p className='text-sm text-(--warning)'>
                主输入框已有策略，是否用这份预设策略替换？
              </p>
              <div className='flex gap-2'>
                <Button size='sm' onClick={() => onFill(assembled)}>
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
      </section>
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
}: {
  title: string
  onClose: () => void
  children: ReactNode
  returnFocus?: () => HTMLElement | null
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
      className='fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-(--border) bg-(--surface-elevated) p-0 text-(--foreground) shadow-2xl outline-none backdrop:bg-black/55'
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
