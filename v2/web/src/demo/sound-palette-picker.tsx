import { Check, Play, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '../components/ui/button'
import { SOUND_LABELS } from '../components/sound-controls'
import { useSound } from '../context/sound'
import type { SoundCue } from '../lib/sound'
import {
  SOUND_PALETTES,
  soundPalette,
  type SoundPaletteID,
} from '../lib/sound-palettes'

export function SoundPalettePicker({ disabled }: { disabled: boolean }) {
  const { preferences, update, unlock, play, stop } = useSound()
  const [mode, setMode] = useState<'buttons' | 'all'>('buttons')
  const [playing, setPlaying] = useState<SoundPaletteID | null>(null)
  const [notice, setNotice] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const token = useRef(0)
  const active = useRef(false)
  const cancel = useCallback(() => {
    token.current++
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (active.current) stop()
    active.current = false
    setPlaying(null)
  }, [stop])

  useEffect(() => {
    if (disabled || !preferences.enabled || preferences.volume === 0) cancel()
  }, [disabled, preferences.enabled, preferences.volume, cancel])
  useEffect(() => {
    globalThis.addEventListener('blur', cancel)
    return () => {
      globalThis.removeEventListener('blur', cancel)
      cancel()
    }
  }, [cancel])

  const audition = async (id: SoundPaletteID) => {
    cancel()
    if (!preferences.enabled || preferences.volume === 0) {
      setNotice('请先开启音效，并把音量调到零以上。')
      return
    }
    const current = token.current
    const ready = await unlock()
    if (current !== token.current) return
    if (!ready) {
      setNotice('声音暂未开启，请再点击一次试听。')
      return
    }
    active.current = true
    setPlaying(id)
    const sequence: [SoundCue, number][] = mode === 'buttons'
      ? [['hover', 0], ['click', 350]]
      : [['hover', 0], ['click', 350], ['save', 700], ['dispatch', 1100], [
        'response',
        1600,
      ], ['finish', 1950]]
    for (const [cue, delay] of sequence) {
      timers.current.push(setTimeout(() => {
        if (current !== token.current) return
        play(cue, `palette:${id}:${current}:${cue}`, true, id)
        setNotice(`${soundPalette(id).name} · ${SOUND_LABELS[cue].label}`)
      }, delay))
    }
    timers.current.push(setTimeout(() => {
      if (current !== token.current) return
      active.current = false
      setPlaying(null)
      setNotice(`${soundPalette(id).name} · 试听结束`)
    }, mode === 'buttons' ? 600 : 2800))
  }

  return (
    <section
      aria-label='十套音效方案'
      className='mb-8 rounded-[10px] border border-(--border-soft) bg-(--surface) p-5'
    >
      <div className='mb-5 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold'>先试听，再选一套</h2>
          <p className='mt-2 text-sm leading-6 text-(--foreground-subtle)'>
            每套都有六种音效。悬停轻，点击清楚，全部去掉了噪声和摩擦声。
          </p>
        </div>
        <label className='flex items-center gap-2 text-sm text-(--foreground-subtle)'>
          试听内容
          <select
            aria-label='试听内容'
            value={mode}
            disabled={disabled}
            onChange={(event) => {
              cancel()
              setMode(event.target.value as 'buttons' | 'all')
            }}
            className='min-h-11 rounded-md border border-(--border-soft) bg-(--background) px-3 text-(--foreground)'
          >
            <option value='buttons'>悬停＋点击</option>
            <option value='all'>整套音效</option>
          </select>
        </label>
      </div>
      <fieldset
        disabled={disabled}
        className='grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2'
      >
        <legend className='sr-only'>选择音效方案</legend>
        {SOUND_PALETTES.map((item, index) => (
          <div
            key={item.id}
            className={`flex min-w-0 items-center gap-3 rounded-md border px-3 py-3 ${
              preferences.palette === item.id
                ? 'border-(--foreground-muted) bg-white/4'
                : 'border-(--border-soft)'
            }`}
          >
            <label className='flex min-w-0 flex-1 cursor-pointer items-start gap-3'>
              <input
                className='mt-1 h-4 w-4 shrink-0 accent-(--accent)'
                type='radio'
                name='sound-palette'
                value={item.id}
                checked={preferences.palette === item.id}
                onChange={() => {
                  cancel()
                  update({ palette: item.id })
                  setNotice(`已选用：${item.name}。下方演示将使用这一套。`)
                }}
              />
              <span className='min-w-0'>
                <span className='text-sm font-medium'>
                  <span className='mr-2 text-(--foreground-muted)'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item.name}
                </span>
                <span className='mt-1 block text-xs leading-5 text-(--foreground-muted)'>
                  {item.description}
                </span>
              </span>
            </label>
            <Button
              variant='ghost'
              className='h-11 w-11 shrink-0 px-0'
              disabled={disabled}
              aria-label={playing === item.id
                ? `停止试听${item.name}`
                : `试听方案${String(index + 1).padStart(2, '0')} ${item.name}`}
              onClick={() =>
                playing === item.id ? cancel() : void audition(item.id)}
            >
              {playing === item.id ? <Square size={15} /> : <Play size={16} />}
            </Button>
          </div>
        ))}
      </fieldset>
      <div className='mt-4 flex flex-wrap items-center justify-between gap-3 text-xs'>
        <p className='flex items-center gap-2 text-(--foreground-subtle)'>
          <Check size={14} />当前选用：{soundPalette(preferences.palette).name}
        </p>
        <p role='status' className='text-(--foreground-muted)'>
          {disabled
            ? '演示进行中，结束后可切换方案。'
            : notice || '试听不会改变选择；勾选圆点后应用到下方演示。'}
        </p>
      </div>
    </section>
  )
}
