import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  assembleDeck,
  type Deck,
  deckComplete,
  type DeckSelections,
} from '../lib/deck'
import { PROMPT_UNIT_LIMIT, promptLength } from '../lib/prompt-length'

export function McqDraft(
  { deck, currentDraft, onFill }: {
    deck: Deck
    currentDraft: string
    onFill: (text: string) => void
  },
) {
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [selections, setSelections] = useState<DeckSelections>({})
  const assembled = assembleDeck(deck, selections)
  const complete = deckComplete(deck, selections)
  const units = promptLength(assembled)
  const overLimit = units > PROMPT_UNIT_LIMIT
  const unanswered =
    deck.questions.filter((question) =>
      !question.options.some((option) => option.id === selections[question.id])
    ).length
  return (
    <div className='space-y-5'>
      <p className='text-sm text-(--foreground-subtle)'>
        {deck.intro ?? '选择你的策略，拼装预览会随选择更新。填入后可继续编辑。'}
      </p>
      {deck.questions.map((question, index) => (
        <fieldset key={question.id} className='space-y-2'>
          <legend className='mb-2 text-sm'>
            <span className='mr-1.5 font-mono text-xs text-(--foreground-subtle)'>
              {index + 1}/{deck.questions.length}
            </span>
            {question.prompt}
          </legend>
          <div className='flex flex-wrap gap-2'>
            {question.options.map((option) => (
              <button
                key={option.id}
                type='button'
                aria-pressed={selections[question.id] === option.id}
                onClick={() => {
                  setConfirmReplace(false)
                  setSelections((current) => ({
                    ...current,
                    [question.id]: option.id,
                  }))
                }}
                className={selections[question.id] === option.id
                  ? 'cursor-pointer rounded-full border border-(--accent) bg-[rgba(224,74,47,0.1)] px-3 py-1.5 text-left text-xs font-semibold text-(--accent)'
                  : 'cursor-pointer rounded-full border border-(--border) px-3 py-1.5 text-left text-xs font-medium text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground)'}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <section
        aria-label='拼装预览'
        className='space-y-3 border-t border-(--border-soft) pt-4'
      >
        <div className='flex items-center justify-between gap-2'>
          <h3 className='text-sm font-semibold'>拼装预览</h3>
          <span
            className={`text-xs ${
              overLimit ? 'text-(--accent)' : 'text-(--foreground-subtle)'
            }`}
            title='汉字按字、英文按词计数'
          >
            {units} / {PROMPT_UNIT_LIMIT}
          </span>
        </div>
        {assembled
          ? (
            <pre
              data-testid='mcq-preview'
              className='max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-(--border-soft) bg-white/2 p-3 font-sans text-xs leading-6 text-(--foreground-subtle)'
            >{assembled}</pre>
          )
          : (
            <p className='rounded-md border border-dashed border-(--border-soft) p-3 text-xs text-(--foreground-subtle)'>
              {deck.comboPrompts
                ? `选完全部 ${deck.questions.length} 题后生成完整提示词`
                : '选择上面的选项，提示词会在这里逐节拼出'}
            </p>
          )}
        <p className='text-xs text-(--foreground-subtle)'>
          汉字按字、英文按词计数；演示上限为 {PROMPT_UNIT_LIMIT}。
        </p>
        {overLimit && (
          <p role='alert' className='text-xs text-(--accent)'>
            拼装结果超过上限，请调整选项。
          </p>
        )}
        <div className='flex flex-wrap items-center gap-3'>
          <Button
            disabled={!complete || !assembled || overLimit}
            onClick={() => {
              if (
                currentDraft.trim() && currentDraft !== assembled
              ) setConfirmReplace(true)
              else onFill(assembled)
            }}
          >
            填入工作区
          </Button>
          {!complete && (
            <span role='status' className='text-xs text-(--foreground-subtle)'>
              还差 {unanswered} 题
            </span>
          )}
        </div>
        {confirmReplace && (
          <div
            role='alert'
            className='space-y-3 rounded-md border border-(--border) p-3'
          >
            <p className='text-sm text-(--foreground-subtle)'>
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
        )}
      </section>
    </div>
  )
}

export function MetaDraft(
  { metaPrompt }: { metaPrompt: string },
) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )
  async function copyMeta() {
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
        复制下面的元提示词，发给 DeepSeek、ChatGPT 等
        AI。拿到最终生成的提示词后，返回构建器，将它原样粘贴到主输入框即可。
      </p>
      <pre
        aria-label='元提示词内容'
        tabIndex={0}
        className='max-h-72 select-text overflow-y-auto whitespace-pre-wrap rounded-md border border-(--border-soft) bg-white/2 p-3 font-sans text-xs leading-6 text-(--foreground-subtle)'
      >{metaPrompt}</pre>
      {copyState === 'failed' && (
        <p role='status' className='text-xs text-(--warning)'>
          无法自动复制，请手动选择上方元提示词并复制。
        </p>
      )}
      <div className='flex flex-wrap gap-2'>
        <Button size='sm' variant='secondary' onClick={() => void copyMeta()}>
          {copyState === 'copied'
            ? (
              <Check
                aria-hidden='true'
                className='mr-1.5 h-3.5 w-3.5 text-(--success)'
              />
            )
            : <Copy aria-hidden='true' className='mr-1.5 h-3.5 w-3.5' />}
          {copyState === 'copied' ? '已复制' : '复制元提示词'}
        </Button>
      </div>
    </div>
  )
}
