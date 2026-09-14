import { Volume2, VolumeX } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import {
  getSoundPreferences,
  subscribeSound,
  unlockAudio,
  updateSoundPreferences,
} from '../lib/sound'

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

export function SoundControls() {
  const preferences = useSoundPreferences()
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
          编写策略、操作关键按钮、保存、出战、完局和领奖时给予声音反馈。对战结束也会在后台提醒，设置保存在此浏览器。
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
    </section>
  )
}
