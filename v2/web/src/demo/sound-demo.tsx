import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  LoaderCircle,
  Play,
  RotateCcw,
  Save,
  Send,
  Square,
  Volume2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  SOUND_LABELS,
  SoundControls,
  SoundToggle,
} from '../components/sound-controls'
import { Button } from '../components/ui/button'
import { useSound } from '../context/sound'
import type { SoundCue } from '../lib/sound'
import { RewardDemo } from './reward-demo'

type Phase =
  | 'editing'
  | 'saving'
  | 'saved'
  | 'dispatching'
  | 'running'
  | 'finished'
  | 'failed'
const PHASE_LABELS: Record<Phase, string> = {
  editing: '草稿',
  saving: '正在保存',
  saved: '版本已保存',
  dispatching: '正在发起',
  running: '对战进行中',
  finished: '对战已完成',
  failed: '对战已中止',
}
const INITIAL_PROMPT =
  '你是商鞅。先提出一项能被验证的小承诺，以此建立秦孝公对新法的信任。\n\n面对反对意见，不回避代价。用具体的试行范围、期限和退出条件回应，让对方看到变法可以从一个可控的行动开始。'
const TURNS = [
  {
    speaker: '商鞅',
    role: '你的智能体',
    text:
      '君上，新法不必一日遍行秦国。臣请先择一县试行，立木为信，明赏罚之约；三月之后，以田亩、粮入和讼案之数验其成效。',
  },
  {
    speaker: '甘龙',
    role: '预设对手',
    text:
      '一县之民也有生计。若试行使农时受扰、诉讼骤增，这三个月的损失由谁承担？只许言成，不许言败，便算不得可控。',
  },
  {
    speaker: '商鞅',
    role: '你的智能体',
    text:
      '可立三条界限：不增当季赋税，不改既有田界，争议由专吏限期核验。若粮入下降而非天灾所致，便暂缓新法，由臣具奏承担失策之责。',
  },
  {
    speaker: '秦孝公',
    role: '裁判追问',
    text:
      '条件已有，但孤还要知道：臣民凭什么相信，三月之后你会如约公布不利于自己的结果？',
  },
  {
    speaker: '商鞅',
    role: '你的智能体',
    text:
      '请由甘龙与县吏共同记数，每旬公布，臣不得独掌簿册。以公开之约约束立法之人，正是立信的第一步。',
  },
  {
    speaker: '秦孝公',
    role: '裁判回复',
    text:
      '可。先试一县，三月为期。由双方共同核验，届时再议推广。今日所定条件，一并记入诏令。',
  },
]

export function SoundDemo() {
  const { preferences, unlock, play, stop, update } = useSound()
  useEffect(() => {
    update({ palette: 'clear' })
  }, [update])
  const [prompt, setPrompt] = useState(INITIAL_PROMPT)
  const [phase, setPhase] = useState<Phase>('editing')
  const [tab, setTab] = useState<'prompt' | 'battle'>('prompt')
  const [version, setVersion] = useState(0)
  const [turns, setTurns] = useState<number[]>([])
  const [streaming, setStreaming] = useState<
    { index: number; text: string } | null
  >(null)
  const [heard, setHeard] = useState<{ cue: SoundCue; id: number } | null>(null)
  const [events, setEvents] = useState<SoundCue[]>([])
  const [readyNotice, setReadyNotice] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const run = useRef(0)
  const phaseRef = useRef<Phase>('editing')
  const viewEnd = useRef<HTMLDivElement>(null)
  const busy = ['saving', 'dispatching', 'running'].includes(phase)

  const transition = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const later = (callback: () => void, ms: number) => {
    const current = run.current
    timers.current.push(setTimeout(() => {
      if (run.current === current) callback()
    }, ms))
  }
  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    stop()
  }, [stop])
  useEffect(() => {
    if (tab === 'battle' && turns.length > 0) {
      const panel = viewEnd.current?.parentElement
      if (panel) panel.scrollTop = panel.scrollHeight
    }
  }, [tab, turns.length])

  const cue = (sound: SoundCue, suffix = '') => {
    setEvents((current) => [...current, sound])
    if (play(sound, `demo:${run.current}:${sound}:${suffix}`)) {
      setHeard({ cue: sound, id: Date.now() })
    }
  }
  const prepare = () => {
    void unlock().then((ready) => {
      setReadyNotice(
        ready ? '' : '浏览器暂未开启声音，请点击右侧任一试听按钮。',
      )
    })
  }

  const streamTurn = (index: number) => {
    const text = TURNS[index].text
    let length = 0
    const tick = () => {
      length += 5
      setStreaming({ index, text: text.slice(0, length) })
      if (length < text.length) later(tick, 65)
      else {
        setStreaming(null)
        setTurns((current) => [...current, index])
        cue('response', String(index))
        if (index + 1 < TURNS.length) later(() => streamTurn(index + 1), 800)
        else {later(() => {
            transition('finished')
            cue('finish')
          }, 1000)}
      }
    }
    tick()
  }

  const dispatch = () => {
    if (phaseRef.current !== 'saved') return
    prepare()
    transition('dispatching')
    setTab('battle')
    setTurns([])
    setStreaming(null)
    later(() => {
      transition('running')
      cue('dispatch')
      later(() => streamTurn(0), 1000)
    }, 650)
  }

  const save = (autoDispatch = false) => {
    if (
      !prompt.trim() ||
      ['saving', 'dispatching', 'running'].includes(phaseRef.current)
    ) return
    clearTimers()
    stop()
    run.current++
    prepare()
    setEvents([])
    setHeard(null)
    setTurns([])
    setStreaming(null)
    setTab('prompt')
    transition('saving')
    later(() => {
      setVersion((current) => current + 1)
      transition('saved')
      cue('save')
      if (autoDispatch) later(dispatch, 950)
    }, 550)
  }

  const reset = () => {
    clearTimers()
    stop()
    run.current++
    transition('editing')
    setTurns([])
    setStreaming(null)
    setEvents([])
    setHeard(null)
    setTab('prompt')
  }
  const interrupt = () => {
    clearTimers()
    stop()
    run.current++
    setStreaming(null)
    transition('failed')
  }

  return (
    <div className='sound-demo min-h-screen bg-(--background)'>
      <header className='border-b border-(--border-soft)'>
        <div className='mx-auto flex h-16 max-w-[1040px] items-center justify-between gap-3 px-4 sm:px-6'>
          <span className='text-sm font-black tracking-[0.24em] text-(--accent)'>
            AXIIA CUP
          </span>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-(--foreground-muted)'>音效预览</span>
            <SoundToggle />
          </div>
        </div>
      </header>
      <main className='mx-auto max-w-[1040px] px-4 py-8 sm:px-6 sm:py-10'>
        <div className='mb-8 flex flex-wrap items-end justify-between gap-5'>
          <div>
            <p className='mb-3 flex items-center gap-2 text-sm text-(--foreground-muted)'>
              <Volume2 size={16} /> 保存 · 出战 · 回复 · 完成
            </p>
            <h1 className='text-[26px] font-bold tracking-tight sm:text-[32px]'>
              赢下游戏，领取奖励。
            </h1>
            <p className='mt-3 max-w-xl text-sm leading-7 text-(--foreground-subtle)'>
              基础音效选用「清透轻点」。这次听听，哪一种声音最像钱到账。
            </p>
          </div>
          <Button
            size='lg'
            onClick={() => save(true)}
            disabled={busy || !prompt.trim()}
          >
            <Play size={16} className='mr-2' />体验完整流程
          </Button>
        </div>

        <RewardDemo disabled={busy} />
        <div className='sound-demo-grid'>
          <section className='min-w-0' aria-label='模拟对战工作区'>
            <div className='overflow-hidden rounded-[10px] border border-(--border-soft) bg-(--surface)'>
              <div className='flex items-center justify-between gap-3 border-b border-(--border-soft) px-5 py-4'>
                <div className='min-w-0'>
                  <p className='text-xs text-(--foreground-muted)'>商鞅变法</p>
                  <h2 className='mt-1 text-lg font-semibold'>以信立法</h2>
                </div>
                <span className='rounded border border-(--border-soft) px-2 py-1 text-xs text-(--foreground-subtle)'>
                  商鞅 · 甲方
                </span>
              </div>
              <div
                className='flex border-b border-(--border-soft) px-5'
                role='tablist'
                aria-label='工作区'
              >
                <button
                  type='button'
                  id='prompt-tab'
                  role='tab'
                  aria-selected={tab === 'prompt'}
                  aria-controls='prompt-panel'
                  tabIndex={tab === 'prompt' ? 0 : -1}
                  onClick={() => setTab('prompt')}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'ArrowRight' || event.key === 'ArrowLeft'
                    ) {
                      setTab('battle')
                      document.getElementById('battle-tab')?.focus()
                    }
                  }}
                  className={`sound-tab ${tab === 'prompt' ? 'is-active' : ''}`}
                >
                  策略提示词
                </button>
                <button
                  type='button'
                  id='battle-tab'
                  role='tab'
                  aria-selected={tab === 'battle'}
                  aria-controls='battle-panel'
                  tabIndex={tab === 'battle' ? 0 : -1}
                  onClick={() => setTab('battle')}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'ArrowRight' || event.key === 'ArrowLeft'
                    ) {
                      setTab('prompt')
                      document.getElementById('prompt-tab')?.focus()
                    }
                  }}
                  className={`sound-tab ${tab === 'battle' ? 'is-active' : ''}`}
                >
                  对战实况{turns.length > 0 && (
                    <span className='ml-2 text-xs text-(--foreground-muted)'>
                      {turns.length}
                    </span>
                  )}
                </button>
              </div>

              <div
                id='prompt-panel'
                role='tabpanel'
                aria-labelledby='prompt-tab'
                hidden={tab !== 'prompt'}
                className='p-5'
              >
                <label
                  htmlFor='demo-prompt'
                  className='mb-3 block text-sm text-(--foreground-subtle)'
                >
                  你希望智能体如何说服秦孝公？
                </label>
                <textarea
                  id='demo-prompt'
                  value={prompt}
                  disabled={busy}
                  onChange={(event) => {
                    setPrompt(event.target.value)
                    if (phase !== 'editing') transition('editing')
                  }}
                  className='sound-prompt'
                />
                <div className='mt-3 flex items-center justify-between gap-3 text-xs text-(--foreground-muted)'>
                  <span>本页内容仅用于试听</span>
                  <span>{prompt.length} 字</span>
                </div>
                <div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-(--border-soft) pt-5'>
                  <span
                    className='inline-flex items-center gap-2 text-sm text-(--foreground-subtle)'
                    role='status'
                  >
                    {phase === 'saving'
                      ? <LoaderCircle size={16} className='sound-spin' />
                      : version > 0 && phase === 'saved'
                      ? <Check size={16} className='text-(--success)' />
                      : <Circle size={10} />}
                    {phase === 'saved'
                      ? `版本 v${version} 已保存`
                      : PHASE_LABELS[phase]}
                  </span>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant='secondary'
                      soundFeedback
                      onClick={() => save()}
                      disabled={busy || !prompt.trim()}
                    >
                      <Save size={15} className='mr-2' />保存版本
                    </Button>
                    <Button
                      soundFeedback
                      onClick={dispatch}
                      disabled={phase !== 'saved'}
                    >
                      <Send size={15} className='mr-2' />发起对战
                    </Button>
                  </div>
                </div>
              </div>

              <div
                id='battle-panel'
                role='tabpanel'
                aria-labelledby='battle-tab'
                hidden={tab !== 'battle'}
              >
                <div className='flex flex-wrap items-center justify-between gap-3 border-b border-(--border-soft) px-5 py-3 text-xs'>
                  <span className='text-(--foreground-subtle)'>
                    商鞅{' '}
                    <span className='mx-2 text-(--foreground-muted)'>对阵</span>
                    {' '}
                    甘龙
                  </span>
                  <span className='inline-flex items-center gap-2'>
                    {phase === 'running' && (
                      <span className='h-1.5 w-1.5 rounded-full bg-(--success)' />
                    )}
                    {PHASE_LABELS[phase]}
                  </span>
                </div>
                <div className='sound-transcript'>
                  {turns.length === 0 && streaming == null && (
                    <div className='flex min-h-72 flex-col items-center justify-center gap-4 text-center text-sm text-(--foreground-muted)'>
                      {phase === 'dispatching' || phase === 'running'
                        ? (
                          <>
                            <LoaderCircle size={24} className='sound-spin' />
                            <p>智能体正在准备回应…</p>
                          </>
                        )
                        : (
                          <>
                            <Send size={24} />
                            <p>先保存一个版本，再发起对战。</p>
                            <Button
                              variant='secondary'
                              onClick={() => setTab('prompt')}
                            >
                              返回策略提示词<ArrowRight
                                size={14}
                                className='ml-2'
                              />
                            </Button>
                          </>
                        )}
                    </div>
                  )}
                  {turns.map((index) => (
                    <Turn key={index} index={index} text={TURNS[index].text} />
                  ))}
                  {streaming && (
                    <Turn
                      index={streaming.index}
                      text={streaming.text}
                      streaming
                    />
                  )}
                  {phase === 'running' && streaming == null &&
                    turns.length > 0 && (
                    <p className='px-5 py-3 text-xs text-(--foreground-muted)'>
                      正在思考…
                    </p>
                  )}
                  <div ref={viewEnd} />
                </div>
                {phase === 'finished' && (
                  <div
                    className='mx-5 mb-5 rounded-md border border-(--border-soft) bg-(--background) p-4'
                    role='status'
                  >
                    <div className='flex items-center gap-2 text-sm font-semibold'>
                      <CheckCheck
                        size={18}
                        className='text-(--success)'
                      />对战完成
                    </div>
                    <p className='mt-2 text-sm leading-6 text-(--foreground-subtle)'>
                      秦孝公同意先试一县。你的策略以试行条件和公开核验，换来了一次推进的机会。
                    </p>
                    <p className='mt-3 text-xs text-(--foreground-muted)'>
                      演示结局 · 与提示词编辑内容无关
                    </p>
                  </div>
                )}
                {phase === 'failed' && (
                  <p
                    role='status'
                    className='px-5 pb-5 text-sm text-(--foreground-subtle)'
                  >
                    对战已中止。没有播放完成音效。
                  </p>
                )}
              </div>
            </div>

            <div className='mt-5 rounded-[10px] border border-(--border-soft) px-5 py-4'>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-(--foreground-muted)'>
                {(['save', 'dispatch', 'response', 'finish'] as const).map((
                  sound,
                  index,
                ) => (
                  <span key={sound} className='inline-flex items-center gap-3'>
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        events.includes(sound) ? 'text-(--foreground)' : ''
                      }`}
                    >
                      {events.includes(sound)
                        ? <Check size={13} />
                        : <Circle size={8} />}
                      {SOUND_LABELS[sound].label}
                    </span>
                    {index < 3 && <ChevronRight size={12} />}
                  </span>
                ))}
              </div>
              <div className='mt-3 flex min-h-6 items-center justify-between gap-3'>
                <p
                  className='text-xs text-(--foreground-muted)'
                  aria-live='polite'
                >
                  {!preferences.enabled
                    ? '音效已关闭，流程照常进行。'
                    : heard
                    ? `最近播放：${SOUND_LABELS[heard.cue].label}`
                    : '点击「体验完整流程」，或逐步操作。'}
                </p>
                {heard && preferences.enabled && (
                  <span
                    key={heard.id}
                    className='sound-meter'
                    aria-hidden='true'
                  >
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </div>
            </div>
            <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
              <Button variant='ghost' onClick={reset}>
                <RotateCcw size={14} className='mr-2' />重置演示
              </Button>
              {busy && (
                <Button variant='ghost' onClick={interrupt}>
                  <Square size={13} className='mr-2' />中止演示
                </Button>
              )}
            </div>
          </section>

          <aside className='min-w-0 space-y-5'>
            <section
              aria-label='音效控制与试听'
              className='rounded-[10px] border border-(--border-soft) bg-(--surface) p-5'
            >
              <SoundControls />
            </section>
            <div className='px-1 text-xs leading-6 text-(--foreground-muted)'>
              <p>
                短促的落点，轻微的余韵。参考 Slay the Spire / Balatro 的触感，为
                Axiia 制作的一组原创音效。
              </p>
              <p className='mt-3'>
                保存和对战按钮：悬停轻响，点击更清晰。首次打开时，先点击任一试听按钮开启声音。回复音仍可单独开启。
              </p>
            </div>
          </aside>
        </div>
        {readyNotice && (
          <p role='status' className='mt-5 text-sm text-(--warning)'>
            {readyNotice}
          </p>
        )}
        <footer className='mt-10 border-t border-(--border-soft) pt-5 text-xs leading-6 text-(--foreground-muted)'>
          本地音效演示。对话为模拟内容，不会保存到账号，也不会调用模型或消耗额度。
        </footer>
      </main>
    </div>
  )
}

function Turn(
  { index, text, streaming = false }: {
    index: number
    text: string
    streaming?: boolean
  },
) {
  const turn = TURNS[index]
  return (
    <article className='border-b border-(--border-soft) px-5 py-4 last:border-b-0'>
      <div className='mb-2 flex items-center gap-2 text-sm'>
        <span className='font-semibold'>{turn.speaker}</span>
        <span className='text-xs text-(--foreground-muted)'>{turn.role}</span>
        {streaming && (
          <LoaderCircle
            size={12}
            className='sound-spin ml-auto text-(--foreground-muted)'
          />
        )}
      </div>
      <p className='text-sm leading-7 text-(--foreground-subtle)'>
        {text}
        {streaming && (
          <span className='ml-1 inline-block h-3 w-0.5 bg-(--foreground-muted)' />
        )}
      </p>
    </article>
  )
}
