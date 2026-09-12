import { Volume2, VolumeX } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'

import {
  getSoundPreferences,
  playSound,
  type SoundCue,
  subscribeSound,
  unlockAudio,
  updateSoundPreferences,
} from '../lib/sound'
import { Button } from './ui/button'

function useSoundPreferences() {
  return useSyncExternalStore(
    subscribeSound,
    getSoundPreferences,
    getSoundPreferences,
  )
}

export function SoundToggle() {
  const preferences = useSoundPreferences()
  return (
    <button
      type='button'
      data-spec='U19-C01 U19-C04 U19-C12'
      aria-label={preferences.enabled ? '关闭音效' : '开启音效'}
      aria-pressed={preferences.enabled}
      title={preferences.enabled ? '关闭音效' : '开启音效'}
      className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-(--foreground-subtle) hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-2'
      onClick={() => {
        updateSoundPreferences({ enabled: !preferences.enabled })
        unlockAudio()
      }}
    >
      {preferences.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  )
}

export function OutputSoundToggle() {
  const preferences = useSoundPreferences()
  return (
    <button
      type='button'
      role='switch'
      data-spec='U19-C03 U19-C04 U19-C08'
      aria-label='模型回复提示音'
      aria-checked={preferences.outputs}
      disabled={!preferences.enabled}
      title={!preferences.enabled
        ? '请先在顶栏开启音效'
        : '每条模型回复完成时轻响一次'}
      className='inline-flex cursor-pointer items-center rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--foreground-subtle) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2'
      onClick={() => {
        updateSoundPreferences({ outputs: !preferences.outputs })
        unlockAudio()
      }}
    >
      回复提示音：{preferences.outputs ? '开' : '关'}
    </button>
  )
}

export const SOUND_LABELS: Record<SoundCue, string> = {
  save: '保存版本',
  dispatch: '发起对战',
  output: '模型回复',
  finish: '对战完成',
  reward: '领取奖励',
}

export function SoundControls() {
  const preferences = useSoundPreferences()
  const [notice, setNotice] = useState('')
  return (
    <section
      aria-labelledby='sound-settings-title'
      className='space-y-4'
      data-spec='U19-C04 U19-C05'
    >
      <div>
        <h2
          id='sound-settings-title'
          className='text-sm font-semibold text-(--foreground)'
        >
          音效
        </h2>
        <p className='mt-1 text-xs leading-relaxed text-(--foreground-muted)'>
          保存、出战、完局和领取奖励时轻响一下。仅在当前窗口播放，设置保存在此浏览器。
        </p>
      </div>
      <label className='flex items-center justify-between gap-3 text-sm'>
        <span>启用音效</span>
        <input
          type='checkbox'
          role='switch'
          checked={preferences.enabled}
          onChange={(event) => {
            updateSoundPreferences({ enabled: event.target.checked })
            unlockAudio()
          }}
          className='h-4 w-4 accent-(--accent)'
        />
      </label>
      <label className='flex items-center justify-between gap-3 text-sm'>
        <span>模型回复提示音</span>
        <input
          type='checkbox'
          role='switch'
          checked={preferences.outputs}
          disabled={!preferences.enabled}
          onChange={(event) => {
            updateSoundPreferences({ outputs: event.target.checked })
            unlockAudio()
          }}
          className='h-4 w-4 accent-(--accent)'
        />
      </label>
      <p className='text-xs text-(--foreground-muted)'>
        每条回复完成时轻响一次，默认关闭。
      </p>
      <label className='flex items-center gap-3 text-sm' data-spec='U19-C02'>
        <span className='shrink-0'>音量</span>
        <input
          type='range'
          aria-label='音量'
          min='0'
          max='100'
          step='1'
          value={Math.round(preferences.volume * 100)}
          disabled={!preferences.enabled}
          aria-valuetext={`${Math.round(preferences.volume * 100)}%`}
          onChange={(event) =>
            updateSoundPreferences({
              volume: Number(event.target.value) / 100,
            })}
          className='min-w-0 flex-1 accent-(--accent)'
        />
        <span className='w-10 text-right tabular-nums'>
          {Math.round(preferences.volume * 100)}%
        </span>
      </label>
      <div className='flex flex-wrap gap-2' aria-label='试听音效'>
        {(Object.keys(SOUND_LABELS) as SoundCue[]).map((cue) => (
          <Button
            key={cue}
            type='button'
            size='sm'
            variant='secondary'
            disabled={!preferences.enabled || preferences.volume === 0}
            onClick={() => {
              unlockAudio()
              // One microtask permits an already-allowed resume to settle. If the
              // browser still blocks audio, skip this cue and explain honestly.
              queueMicrotask(() => {
                const played = playSound(cue, undefined, true)
                setNotice(
                  played
                    ? `正在试听：${SOUND_LABELS[cue]}`
                    : '浏览器尚未允许播放，请再次点击试听。',
                )
              })
            }}
          >
            试听{SOUND_LABELS[cue]}
          </Button>
        ))}
      </div>
      <p role='status' className='min-h-4 text-xs text-(--foreground-muted)'>
        {notice}
      </p>
    </section>
  )
}
