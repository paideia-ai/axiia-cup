import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import {
  assembleDeck,
  type Deck,
  deckComplete,
  type DeckSelections,
} from '../lib/deck'
import { PROMPT_UNIT_LIMIT, promptLength } from '../lib/prompt-length'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'

// 新建流程的初始化方式三选一（E6/#83，mock S25 的三 tab 形态）：MCQ 拼装
// （默认，#12）/ Basic 直写 / 元提示词。只在版本数为 0 且工作区为空时由
// 构建器挂载（E7 门在 lib/deck.ts initModesAvailable）；「填入工作区」把拼
// 好的纯文本交回构建器后，工作区非空、本组件即被卸载——保存 v1 之后迭代
// 只有文本工作台，清空工作区也不再回到这里（重选初始化＝「再建一个」，#90）。
// MCQ 选择只活在组件内存里（不持久化；E5「选项随版本存档」等 P5 后端批次
// 由保存接口承接）——调用方用 key 绑定 deck 身份，切侧/切角色即重置。

interface InitModesProps {
  deck: Deck
  metaPrompt: string
  onFill: (text: string, method: 'mcq' | 'builder') => void
}

export function InitModes({ deck, metaPrompt, onFill }: InitModesProps) {
  // 受控 tab：元提示词面板的粘贴框只在其 tab 激活时挂载——页面上「策略
  // 提示词」工作区始终是唯一常驻的 textarea（选择器与工具脚本据此定位）。
  const [tab, setTab] = useState('mcq')
  const [selections, setSelections] = useState<DeckSelections>({})
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)

  const assembled = assembleDeck(deck, selections)
  const complete = deckComplete(deck, selections)
  const units = promptLength(assembled)
  const overLimit = units > PROMPT_UNIT_LIMIT
  const unanswered = deck.questions.filter(
    (question) =>
      !question.options.some((option) => option.id === selections[question.id]),
  ).length
  // combo deck（电车）：选完才有产物可预览；fragment deck 边选边长。
  const comboPending = deck.comboPrompts != null && !complete

  const copyMeta = () => {
    // 非安全上下文没有 clipboard——静默降级，文本仍可手动全选复制。
    try {
      void navigator.clipboard.writeText(metaPrompt).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }).catch(() => {})
    } catch {
      // 忽略
    }
  }

  return (
    <Card>
      <CardContent className='space-y-4 pt-5'>
        <div>
          <p className='text-sm font-semibold text-(--foreground)'>
            初始化方式 · 三选一生成首稿
          </p>
          {
            /* #90：「复制为新智能体」已废止；保存 v1 后清空工作区也不复活
            三选一（E7/#83）——想重新选卡＝「再建一个」智能体或创建对侧 */
          }
          <p className='mt-0.5 text-xs text-(--foreground-muted)'>
            保存即成为 v1；此后的迭代只有文本编辑（想重新选卡：再建一个智能体）
          </p>
        </div>
        <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
          <TabsList>
            <TabsTrigger value='mcq'>MCQ 拼装</TabsTrigger>
            <TabsTrigger value='basic'>Basic 直写</TabsTrigger>
            <TabsTrigger value='meta'>元提示词</TabsTrigger>
          </TabsList>

          <TabsContent value='mcq' className='space-y-4'>
            {deck.intro
              ? (
                <p className='text-sm text-(--foreground-subtle)'>
                  {deck.intro}
                </p>
              )
              : null}
            {deck.questions.map((question, index) => (
              <div key={question.id} className='space-y-2'>
                <p className='text-sm text-(--foreground)'>
                  <span className='mr-1.5 font-mono text-xs text-(--foreground-muted)'>
                    {index + 1}/{deck.questions.length}
                  </span>
                  {question.prompt}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {question.options.map((option) => {
                    const active = selections[question.id] === option.id
                    return (
                      <button
                        key={option.id}
                        type='button'
                        aria-pressed={active}
                        onClick={() =>
                          setSelections((current) => ({
                            ...current,
                            [question.id]: option.id,
                          }))}
                        className={active
                          ? 'cursor-pointer rounded-full border border-(--accent) bg-[rgba(224,74,47,0.1)] px-3 py-1.5 text-left text-xs font-semibold text-(--accent)'
                          : 'cursor-pointer rounded-full border border-(--border) px-3 py-1.5 text-left text-xs font-medium text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground)'}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className='space-y-2 border-t border-(--border-soft) pt-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-xs font-semibold tracking-[0.06em] text-(--foreground-muted)'>
                  拼装预览
                </p>
                <span
                  className={`font-mono text-xs ${
                    overLimit ? 'text-(--accent)' : 'text-(--foreground-muted)'
                  }`}
                  title='按汉字或英文词计数（非 token）'
                >
                  {units} / {PROMPT_UNIT_LIMIT}
                </span>
              </div>
              {assembled
                ? (
                  <pre className='max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 font-sans text-xs leading-relaxed text-(--foreground-subtle)'>
                    {assembled}
                  </pre>
                )
                : (
                  <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-3 text-xs text-(--foreground-muted)'>
                    {comboPending
                      ? `选完全部 ${deck.questions.length} 题后生成完整提示词`
                      : '选择上面的选项，提示词会在这里逐节拼出'}
                  </p>
                )}
              <div className='flex items-center gap-3'>
                <Button
                  size='sm'
                  disabled={!complete || assembled === '' || overLimit}
                  onClick={() => onFill(assembled, 'mcq')}
                >
                  填入工作区
                </Button>
                {!complete
                  ? (
                    <span className='text-xs text-(--foreground-muted)'>
                      还差 {unanswered} 题
                    </span>
                  )
                  : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value='basic'>
            <p className='text-sm text-(--foreground-subtle)'>
              直接在下方编辑框书写策略提示词——写下任何文字后，这里会自动收起。
            </p>
          </TabsContent>

          <TabsContent value='meta' className='space-y-3'>
            {tab === 'meta'
              ? (
                <>
                  <p className='text-sm text-(--foreground-subtle)'>
                    复制这段元提示词发给你常用的 AI，再把生成结果粘贴回来。
                  </p>
                  <pre className='max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 font-sans text-xs leading-relaxed text-(--foreground-subtle)'>
                    {metaPrompt}
                  </pre>
                  <Button size='sm' variant='secondary' onClick={copyMeta}>
                    {copied
                      ? (
                        <Check className='mr-1.5 h-3.5 w-3.5 text-(--success)' />
                      )
                      : <Copy className='mr-1.5 h-3.5 w-3.5' />}
                    {copied ? '已复制' : '复制元提示词'}
                  </Button>
                  <Textarea
                    rows={5}
                    value={pasted}
                    onChange={(event) => setPasted(event.target.value)}
                    placeholder='把 AI 生成的策略提示词粘贴到这里…'
                  />
                  <Button
                    size='sm'
                    disabled={pasted.trim() === ''}
                    onClick={() => onFill(pasted, 'builder')}
                  >
                    填入工作区
                  </Button>
                </>
              )
              : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
