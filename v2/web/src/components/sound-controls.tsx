import { Play, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'

import { useSound } from '../context/sound'
import type { SoundCue } from '../lib/sound'
import { Button } from './ui/button'

export const SOUND_LABELS: Record<
  SoundCue,
  { label: string; description: string }
> = {
  save: { label: '保存版本', description: '短促的确认音，策略就此定稿。' },
  dispatch: { label: '发起对战', description: '两个干净的音符，轻快起步。' },
  response: {
    label: '模型回复',
    description: '回复完成时，短短一声低柔轻点。',
  },
  finish: { label: '对战完成', description: '几个音符收拢，这一局有了结果。' },
  hover: { label: '按钮悬停', description: '鼠标移入，轻轻一触。' },
  click: { label: '按钮点击', description: '按下按钮，清晰落定。' },
  reward: { label: '领取奖励', description: '原速 · 收高频，积分到账。' },
}

export function SoundToggle() {
  const { preferences, update, unlock } = useSound()
  return (
    <button
      type='button'
      aria-label={preferences.enabled ? '关闭音效' : '开启音效'}
      aria-pressed={preferences.enabled}
      title={preferences.enabled ? '关闭音效' : '开启音效'}
      className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-(--foreground-subtle) hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-2'
      onClick={() => {
        update({ enabled: !preferences.enabled })
        void unlock()
      }}
    >
      {preferences.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  )
}

export function SoundControls({ auditions = true }: { auditions?: boolean }) {
  const { preferences, update, unlock, play } = useSound()
  const [notice, setNotice] = useState('')
  const audition = async (cue: SoundCue) => {
    const ready = await unlock()
    const played = ready && play(cue, crypto.randomUUID(), true)
    setNotice(
      played
        ? `正在试听：${SOUND_LABELS[cue].label}`
        : '请开启音效并调高音量，再点击试听。',
    )
  }
  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold'>音效</h2>
        <SoundToggle />
      </div>
      <label className='block space-y-3 text-sm'>
        <span className='flex justify-between text-(--foreground-subtle)'>
          <span>音量</span>
          <span>{Math.round(preferences.volume * 100)}%</span>
        </span>
        <input
          type='range'
          min='0'
          max='100'
          step='1'
          aria-label='音效音量'
          value={Math.round(preferences.volume * 100)}
          onPointerDown={() => void unlock()}
          onKeyDown={() => void unlock()}
          onChange={(event) =>
            update({ volume: Number(event.target.value) / 100 })}
          className='h-6 w-full cursor-pointer accent-(--accent)'
        />
      </label>
      <label className='flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm'>
        <span>每次模型回复时播放</span>
        <input
          type='checkbox'
          checked={preferences.responses}
          onChange={(event) => {
            update({ responses: event.target.checked })
            void unlock()
          }}
          className='h-5 w-5 shrink-0 accent-(--accent)'
        />
      </label>
      {auditions && (
        <div className='divide-y divide-(--border-soft)'>
          {(Object.entries(SOUND_LABELS).filter(([cue]) =>
            cue !== 'reward'
          ) as [
            SoundCue,
            { label: string; description: string },
          ][]).map(([cue, item]) => (
            <div
              key={cue}
              className='flex items-center justify-between gap-3 py-4'
            >
              <div>
                <p className='text-sm font-medium'>{item.label}</p>
                <p className='mt-1 text-xs leading-5 text-(--foreground-muted)'>
                  {item.description}
                </p>
              </div>
              <Button
                variant='ghost'
                className='h-11 w-11 shrink-0 px-0'
                aria-label={`试听${item.label}`}
                onClick={() => void audition(cue)}
              >
                <Play size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p role='status' className='min-h-5 text-xs text-(--foreground-muted)'>
        {notice || '静音和音量会保存在此浏览器。'}
      </p>
    </div>
  )
}
